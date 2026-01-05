from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os

from local_nlp_checker import LocalNLP
from gemini_batch_checker import gemini_batch_similarity

# Load environment variables
load_dotenv()

app = Flask(__name__)
nlp = LocalNLP()

def classify_status(score):
    if score >= 0.70:
        return "match"
    if score >= 0.40:
        return "partial_match"
    return "mismatch"

def to_percent(v):
    if v is None:
        return None
    return f"{int(round(v * 100))}%"

def build_explanation(f):
    sbert = f.get("sbert", 0.0)
    wmd = f.get("wmd", 0.0)
    jac = f.get("jaccard", 0.0)
    tfidf = f.get("tfidf", 0.0)
    if sbert > 0.90 and wmd > 0.90:
        return "Owner answer strongly matches semantic meaning."
    if sbert > 0.75:
        return "High semantic similarity with small wording differences."
    if jac > 0.40 or tfidf > 0.40:
        return "Some lexical overlap detected; owner captures some details."
    return "Owner answer does not meaningfully match founder answer."

@app.route("/verify-owner", methods=["POST"])
def verify_owner():
    payload = request.get_json()
    if not payload:
        return jsonify({"error": "Missing request body"}), 400

    data = payload[0] if isinstance(payload, list) else payload

    owner_id = data.get("owner_id")
    category = data.get("category")
    answers = data.get("answers", [])

    if not answers:
        return jsonify({"error": "Answers array missing"}), 400

    batch_payload = []
    for idx, a in enumerate(answers):
        batch_payload.append({
            "question": a.get("question_text", f"Question {idx+1}"),
            "founder": a.get("founder_answer", ""),
            "owner": a.get("owner_answer", "")
        })

    gemini_batch = gemini_batch_similarity(batch_payload)

    if "error" in gemini_batch:
        gemini_details = None
        gemini_overall = None
        gemini_recommendation = "UNKNOWN"
        gemini_reasoning = gemini_batch.get("raw", "Gemini failed")
    else:
        gemini_details = gemini_batch.get("matchDetails", [])
        gemini_overall = gemini_batch.get("overallScore", 0) / 100.0
        gemini_recommendation = gemini_batch.get("recommendation", "")
        gemini_reasoning = gemini_batch.get("reasoning", "")

    results = []
    local_scores = []
    gemini_scores = []
    final_scores = []

    for idx, a in enumerate(answers):
        founder = a.get("founder_answer", "")
        owner = a.get("owner_answer", "")

        local_res = nlp.score_pair(founder, owner)
        local_score = float(local_res["fused"])
        local_scores.append(local_score)

        if gemini_details and idx < len(gemini_details):
            gem_score = gemini_details[idx]["similarityScore"] / 100.0
            gemini_scores.append(gem_score)
        else:
            gem_score = None

        # 🎯 IMPROVED LOGIC: If Gemini is very confident (≥90%), trust it completely
        if gem_score is None:
            fused = local_score
        elif gem_score >= 0.90:
            # Gemini is very confident - ignore NLP score completely
            fused = gem_score
        else:
            # Gemini unsure - blend with NLP (60% NLP + 40% Gemini)
            fused = (local_score * 0.6) + (gem_score * 0.4)

        final_scores.append(fused)

        results.append({
            "question_id": idx + 1,
            "local_nlp_score": to_percent(local_score),
            "gemini_score": to_percent(gem_score) if gem_score is not None else None,
            "final_similarity": to_percent(fused),
            "status": classify_status(fused),
            "local_explanation": build_explanation(local_res["features"]),
            "gemini_analysis": gemini_details[idx]["analysis"] if gemini_details and idx < len(gemini_details) else None
        })

    avg_local = sum(local_scores) / len(local_scores)
    avg_gemini = sum(gemini_scores) / len(gemini_scores) if gemini_scores else None
    avg_final = sum(final_scores) / len(final_scores)

    # 🚨 CRITICAL SECURITY CHECK: If ANY question has 0% or very low similarity, REJECT
    min_score = min(final_scores)
    has_zero_match = min_score <= 0.10  # 10% threshold for "essentially zero"
    
    # If any question fails completely, reject ownership regardless of other scores
    if has_zero_match:
        is_owner = False
        rejection_reason = f"Critical failure: Question {final_scores.index(min_score) + 1} has {to_percent(min_score)} similarity (≤10%). Owner failed to provide valid information for at least one question."
    else:
        is_owner = avg_final >= 0.70
        rejection_reason = None

    response = {
        "owner_id": owner_id,
        "category": category,
        "average_local_score": to_percent(avg_local),
        "average_gemini_score": to_percent(avg_gemini),
        "final_confidence": to_percent(avg_final),
        "is_absolute_owner": is_owner,
        "has_zero_match_question": has_zero_match,
        "minimum_question_score": to_percent(min_score),
        "rejection_reason": rejection_reason,
        "gemini_overall_score": to_percent(gemini_overall),
        "gemini_recommendation": gemini_recommendation,
        "gemini_reasoning": gemini_reasoning,
        "results": results
    }

    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
