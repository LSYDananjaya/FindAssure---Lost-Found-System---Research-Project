from flask import Flask, request, jsonify
import os
import json
import uuid
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

from video_to_text import extract_text
from local_nlp_checker import LocalNLP
from gemini_batch_checker import gemini_batch_similarity

app = Flask(__name__)
nlp = LocalNLP()

TMP_DIR = tempfile.gettempdir()
MAX_WORKERS = 5  # Process up to 5 videos in parallel

# -----------------------------
def classify_status(score):
    if score >= 0.70:
        return "match"
    if score >= 0.40:
        return "partial_match"
    return "mismatch"

def to_percent(v):
    return None if v is None else f"{int(round(v * 100))}%"

# -----------------------------
@app.route("/verify-owner", methods=["POST"])
def verify_owner():

    if "data" not in request.form:
        return jsonify({"error": "Missing data field"}), 400

    try:
        data = json.loads(request.form["data"])
    except Exception:
        return jsonify({"error": "Invalid JSON in data"}), 400

    owner_id = data.get("owner_id")
    category = data.get("category")
    answers = data.get("answers", [])

    if not answers:
        return jsonify({"error": "No answers provided"}), 400

    print(f"⏱️ Starting video processing for {len(answers)} videos...")
    start_time = time.time()

    # -----------------------------
    # PARALLEL VIDEO → TEXT
    # -----------------------------
    def process_single_video(answer_data, file_data):
        """Process a single video file and return enriched data"""
        a = answer_data
        key = a["video_key"]
        
        video_path = os.path.join(TMP_DIR, f"{uuid.uuid4().hex}_{file_data.filename}")
        
        try:
            file_data.save(video_path)
            owner_text = extract_text(video_path)
            
            return {
                "question_id": a["question_id"],
                "founder_answer": a["founder_answer"],
                "owner_answer": owner_text,
                "success": True
            }
        except Exception as e:
            print(f"❌ Error processing {key}: {str(e)}")
            return {
                "question_id": a.get("question_id", 0),
                "founder_answer": a.get("founder_answer", ""),
                "owner_answer": "[Processing Error]",
                "error": str(e),
                "success": False
            }
        finally:
            # Clean up video file
            try:
                if os.path.exists(video_path):
                    os.remove(video_path)
            except Exception:
                pass

    # Prepare video data with files (access request.files BEFORE threading)
    video_tasks = []
    for a in answers:
        key = a["video_key"]
        
        if key not in request.files:
            return jsonify({"error": f"Missing file: {key}"}), 400
        
        video_tasks.append({
            "answer": a,
            "file": request.files[key]
        })

    enriched = []
    
    # Process all videos in parallel using ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit all video processing tasks
        future_to_answer = {
            executor.submit(process_single_video, task["answer"], task["file"]): task 
            for task in video_tasks
        }
        
        # Collect results as they complete
        for future in as_completed(future_to_answer):
            result = future.result()
            if result.get("success", False):
                enriched.append(result)
            else:
                # If processing failed, still add it with error message
                enriched.append(result)
    
    # Sort by question_id to maintain order
    enriched.sort(key=lambda x: x["question_id"])
    
    video_processing_time = time.time() - start_time
    print(f"✅ Video processing completed in {video_processing_time:.2f}s (parallel)")
    
    # Check if any videos failed
    if any(not item.get("success", True) for item in enriched):
        failed_count = sum(1 for item in enriched if not item.get("success", True))
        print(f"⚠️ Warning: {failed_count} video(s) failed to process")

    # -----------------------------
    # GEMINI BATCH
    # -----------------------------
    gemini_payload = [
        {
            "question": f"Question {x['question_id']}",
            "founder": x["founder_answer"],
            "owner": x["owner_answer"],
        }
        for x in enriched
    ]

    gemini = gemini_batch_similarity(gemini_payload)

    # Handle gemini errors gracefully
    gemini_failed = isinstance(gemini, dict) and "error" in gemini
    
    if gemini_failed:
        gemini_details = []
        gemini_recommendation = "LOCAL_NLP_ONLY"
        
        # Provide user-friendly error message
        error_msg = gemini.get("message", "Gemini API unavailable")
        if "quota" in error_msg.lower() or "429" in str(error_msg):
            gemini_reasoning = "⚠️ Using Local NLP verification only (Gemini API quota exceeded). Results based on sentence similarity analysis."
        else:
            gemini_reasoning = f"⚠️ Using Local NLP verification only (Gemini AI unavailable). Results based on sentence similarity analysis."
        
        print(f"⚠️ Gemini API failed: {error_msg}. Falling back to Local NLP only.")
    else:
        gemini_details = gemini.get("matchDetails", []) if isinstance(gemini, dict) else []
        gemini_recommendation = gemini.get("recommendation") if isinstance(gemini, dict) else None
        gemini_reasoning = gemini.get("reasoning") if isinstance(gemini, dict) else None

    # -----------------------------
    # LOCAL NLP + FUSION
    # -----------------------------
    results = []
    final_scores = []

    for i, a in enumerate(enriched):
        local = nlp.score_pair(
            a["founder_answer"],
            a["owner_answer"]
        )

        local_score = float(local["fused"])
        gem_score = None

        if i < len(gemini_details):
            try:
                gem_score = gemini_details[i]["similarityScore"] / 100.0
            except Exception:
                gem_score = None

        # ✅ RULE 1: Gemini override when very confident
        if gem_score is None:
            fused = local_score
        elif gem_score >= 0.80:
            fused = gem_score
        else:
            fused = (local_score * 0.5) + (gem_score * 0.5)

        final_scores.append(fused)

        results.append({
            "question_id": a["question_id"],
            "founder_answer": a["founder_answer"],
            "owner_transcript": a["owner_answer"],
            "local_score": to_percent(local_score),
            "gemini_score": to_percent(gem_score),
            "final_similarity": to_percent(fused),
            "status": classify_status(fused),
            "gemini_analysis": gemini_details[i].get("analysis")
            if i < len(gemini_details) and isinstance(gemini_details[i], dict) else None
        })

    avg_final = sum(final_scores) / len(final_scores)

    # ✅ RULE 2: Critical security reject if ANY question <= 10%
    min_score = min(final_scores)
    has_zero_match = min_score <= 0.25

    if has_zero_match:
        is_owner = False
        rejection_reason = (
            f"Critical failure: Question {final_scores.index(min_score) + 1} has "
            f"{to_percent(min_score)} similarity (≤10%). Owner failed to provide valid "
            f"information for at least one question."
        )
    else:
        is_owner = avg_final >= 0.70
        rejection_reason = None

    total_time = time.time() - start_time
    print(f"🎯 Total verification time: {total_time:.2f}s")

    return jsonify({
        "owner_id": owner_id,
        "category": category,
        "final_confidence": to_percent(avg_final),
        "is_absolute_owner": is_owner,
        "has_zero_match_question": has_zero_match,
        "minimum_question_score": to_percent(min_score),
        "rejection_reason": rejection_reason,
        "results": results,
        "gemini_recommendation": gemini_recommendation,
        "gemini_reasoning": gemini_reasoning,
        "verification_mode": "local_nlp_only" if gemini_failed else "gemini_enhanced",
        "processing_time_seconds": round(total_time, 2),
        "video_processing_time_seconds": round(video_processing_time, 2)
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
