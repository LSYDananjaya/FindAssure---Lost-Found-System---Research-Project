from __future__ import annotations

import argparse
import json
from pathlib import Path


def precision_at_k(predicted: list[str], relevant: set[str], k: int) -> float:
    if k <= 0:
        return 0.0
    top_k = predicted[:k]
    if not top_k:
        return 0.0
    hits = sum(1 for item_id in top_k if item_id in relevant)
    return float(hits / float(k))


def false_positive_rate(predicted: list[str], relevant: set[str]) -> float:
    if not predicted:
        return 0.0
    fp = sum(1 for item_id in predicted if item_id not in relevant)
    return float(fp / float(len(predicted)))


def evaluate_cases(cases: list[dict]) -> dict[str, float]:
    if not cases:
        return {"precision_at_1": 0.0, "precision_at_5": 0.0, "false_positive_rate": 0.0}

    p1_total = 0.0
    p5_total = 0.0
    fpr_total = 0.0
    for case in cases:
        relevant = {str(item) for item in case.get("relevant_ids", [])}
        predicted = [str(item) for item in case.get("predicted_ids", [])]
        p1_total += precision_at_k(predicted, relevant, 1)
        p5_total += precision_at_k(predicted, relevant, 5)
        fpr_total += false_positive_rate(predicted, relevant)

    count = float(len(cases))
    return {
        "precision_at_1": round(p1_total / count, 4),
        "precision_at_5": round(p5_total / count, 4),
        "false_positive_rate": round(fpr_total / count, 4),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate offline image-search relevance fixtures.")
    parser.add_argument(
        "--fixtures",
        default=str(Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "search_precision_cases.json"),
        help="Path to a JSON file with offline search cases.",
    )
    args = parser.parse_args()

    fixture_path = Path(args.fixtures)
    payload = json.loads(fixture_path.read_text(encoding="utf-8"))
    cases = payload.get("cases", [])
    summary = evaluate_cases(cases)

    print(json.dumps({"fixtures": str(fixture_path), "cases": len(cases), "metrics": summary}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
