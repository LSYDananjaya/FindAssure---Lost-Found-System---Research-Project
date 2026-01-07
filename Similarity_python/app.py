from flask import Flask, request, jsonify
import os
import json
import uuid
import tempfile

from video_to_text import extract_text
from local_nlp_checker import LocalNLP
from gemini_batch_checker import gemini_batch_similarity

app = Flask(__name__)
nlp = LocalNLP()

TMP_DIR = tempfile.gettempdir()

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

    enriched = []

    # -----------------------------
    # VIDEO → TEXT
    # -----------------------------
    for a in answers:
        key = a["video_key"]

        if key not in request.files:
            return jsonify({"error": f"Missing file: {key}"}), 400

        file = request.files[key]
        video_path = os.path.join(
            TMP_DIR, f"{uuid.uuid4().hex}_{file.filename}"
        )
        file.save(video_path)

        owner_text = extract_text(video_path)

        enriched.append({
            "question_id": a["question_id"],
            "founder_answer": a["founder_answer"],
            "owner_answer": owner_text
        })

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
    gemini_details = gemini.get("matchDetails", [])

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

        local_score = local["fused"]
        gem_score = None

        if i < len(gemini_details):
            gem_score = gemini_details[i]["similarityScore"] / 100.0

        fused = local_score if gem_score is None else (
            local_score * 0.6 + gem_score * 0.4
        )

        final_scores.append(fused)

        results.append({
            "question_id": a["question_id"],
            "founder_answer": a["founder_answer"],
            "owner_transcript": a["owner_answer"],
            "local_score": to_percent(local_score),
            "gemini_score": to_percent(gem_score),
            "final_similarity": to_percent(fused),
            "status": classify_status(fused),
            "gemini_analysis": gemini_details[i]["analysis"]
            if i < len(gemini_details) else None
        })

    avg_final = sum(final_scores) / len(final_scores)

    return jsonify({
        "owner_id": owner_id,
        "category": category,
        "final_confidence": to_percent(avg_final),
        "is_absolute_owner": avg_final >= 0.70,
        "results": results,
        "gemini_recommendation": gemini.get("recommendation"),
        "gemini_reasoning": gemini.get("reasoning")
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
