from __future__ import annotations

import argparse
import csv
import json
import sys
import warnings
from pathlib import Path
from typing import Any, Iterable, Optional

warnings.filterwarnings(
    "ignore",
    message=r"datetime\.datetime\.utcfromtimestamp\(\) is deprecated.*",
    category=DeprecationWarning,
    module=r"pytz\.tzinfo",
)

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.domain.category_specs import ALLOWED_LABELS, canonicalize_label  # noqa: E402


NO_DETECTION_LABEL = "No Detection"
REPORT_NOTE = (
    "The image-processing component was evaluated using a manually labeled internal test set. "
    "Each image was passed through the YOLO-based category detector, and the top-confidence "
    "category was compared with the ground-truth label. The reported accuracy is therefore a "
    "component-level category detection accuracy, not a full-system benchmark."
)


class EvaluationResult:
    def __init__(self, predictions: list[dict[str, Any]], metrics: dict[str, Any]) -> None:
        self.predictions = predictions
        self.metrics = metrics


class YoloDetectorAdapter:
    def __init__(self) -> None:
        from app.services.yolo_service import YoloService

        self.service = YoloService()

    def detect(self, image_path: Path) -> list[Any]:
        return self.service.detect_objects(str(image_path))


def normalize_label(label: str) -> str:
    text = str(label or "").strip()
    return canonicalize_label(text) or text


def read_cases(labels_path: Path) -> list[dict[str, Any]]:
    if not labels_path.exists():
        raise FileNotFoundError(f"Labels CSV not found: {labels_path}")

    cases: list[dict[str, Any]] = []
    with labels_path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        required = {"image_path", "true_label"}
        missing = required.difference(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Labels CSV is missing required columns: {', '.join(sorted(missing))}")

        for row_number, row in enumerate(reader, start=2):
            image_value = str(row.get("image_path") or "").strip()
            true_label = normalize_label(str(row.get("true_label") or ""))
            if not image_value or not true_label:
                raise ValueError(f"Row {row_number} must include image_path and true_label.")
            if true_label not in ALLOWED_LABELS:
                raise ValueError(
                    f"Row {row_number} has unsupported true_label '{true_label}'. "
                    f"Allowed labels: {', '.join(ALLOWED_LABELS)}"
                )

            image_path = Path(image_value)
            if not image_path.is_absolute():
                image_path = labels_path.parent / image_path
            if not image_path.exists():
                raise FileNotFoundError(f"Image from row {row_number} not found: {image_path}")

            cases.append({"image_path": image_path, "true_label": true_label})

    if not cases:
        raise ValueError(f"No evaluation rows found in {labels_path}")
    return cases


def top_prediction(detections: Iterable[Any]) -> tuple[str, float]:
    detections_list = list(detections or [])
    if not detections_list:
        return NO_DETECTION_LABEL, 0.0

    best = max(detections_list, key=lambda det: float(getattr(det, "confidence", 0.0) or 0.0))
    label = normalize_label(str(getattr(best, "label", "") or ""))
    return label or NO_DETECTION_LABEL, float(getattr(best, "confidence", 0.0) or 0.0)


def collect_predictions(cases: list[dict[str, Any]], detector: Any) -> list[dict[str, Any]]:
    predictions: list[dict[str, Any]] = []
    for case in cases:
        image_path = Path(case["image_path"])
        true_label = str(case["true_label"])
        predicted_label, confidence = top_prediction(detector.detect(image_path))
        predictions.append(
            {
                "image_path": str(image_path),
                "true_label": true_label,
                "predicted_label": predicted_label,
                "confidence": round(confidence, 6),
                "is_correct": predicted_label == true_label,
            }
        )
    return predictions


def calculate_metrics(predictions: list[dict[str, Any]]) -> dict[str, Any]:
    y_true = [str(row["true_label"]) for row in predictions]
    y_pred = [str(row["predicted_label"]) for row in predictions]
    true_labels = sorted({label for label in y_true if label in ALLOWED_LABELS})
    metric_labels = sorted(set(y_true).union(y_pred))

    per_class_accuracy: dict[str, float] = {}
    for label in true_labels:
        class_rows = [row for row in predictions if row["true_label"] == label]
        correct = sum(1 for row in class_rows if row["is_correct"])
        per_class_accuracy[label] = round(correct / len(class_rows), 4) if class_rows else 0.0

    correct_predictions = sum(1 for row in predictions if row["is_correct"])
    return {
        "total_images": len(predictions),
        "correct_predictions": correct_predictions,
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "macro_precision": round(float(precision_score(y_true, y_pred, labels=metric_labels, average="macro", zero_division=0)), 4),
        "macro_recall": round(float(recall_score(y_true, y_pred, labels=metric_labels, average="macro", zero_division=0)), 4),
        "macro_f1": round(float(f1_score(y_true, y_pred, labels=metric_labels, average="macro", zero_division=0)), 4),
        "per_class_accuracy": per_class_accuracy,
        "labels": metric_labels,
        "chart_labels": ALLOWED_LABELS + [NO_DETECTION_LABEL],
        "report_note": REPORT_NOTE,
    }


def save_predictions_csv(predictions: list[dict[str, Any]], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["image_path", "true_label", "predicted_label", "confidence", "is_correct"],
        )
        writer.writeheader()
        writer.writerows(predictions)


def save_metrics_json(metrics: dict[str, Any], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")


def save_confusion_matrix(predictions: list[dict[str, Any]], labels: list[str], output_path: Path) -> None:
    y_true = [str(row["true_label"]) for row in predictions]
    y_pred = [str(row["predicted_label"]) for row in predictions]
    matrix = confusion_matrix(y_true, y_pred, labels=labels)

    fig_width = max(8, len(labels) * 0.75)
    fig, ax = plt.subplots(figsize=(fig_width, fig_width * 0.75))
    image = ax.imshow(matrix, cmap="Blues")
    fig.colorbar(image, ax=ax, fraction=0.046, pad=0.04)

    ax.set_title("Category Detection Confusion Matrix")
    ax.set_xlabel("Predicted label")
    ax.set_ylabel("True label")
    ax.set_xticks(range(len(labels)))
    ax.set_yticks(range(len(labels)))
    ax.set_xticklabels(labels, rotation=45, ha="right")
    ax.set_yticklabels(labels)

    for row_index in range(matrix.shape[0]):
        for col_index in range(matrix.shape[1]):
            value = int(matrix[row_index, col_index])
            ax.text(col_index, row_index, str(value), ha="center", va="center", color="black")

    fig.tight_layout()
    fig.savefig(output_path, dpi=180)
    plt.close(fig)


def save_per_class_accuracy(per_class_accuracy: dict[str, float], output_path: Path) -> None:
    labels = list(per_class_accuracy.keys())
    values = [per_class_accuracy[label] for label in labels]

    fig_width = max(8, len(labels) * 0.7)
    fig, ax = plt.subplots(figsize=(fig_width, 5))
    ax.bar(labels, values, color="#2f6f8f")
    ax.set_ylim(0, 1)
    ax.set_title("Per-Class Detection Accuracy")
    ax.set_ylabel("Accuracy")
    ax.set_xticks(range(len(labels)))
    ax.set_xticklabels(labels, rotation=45, ha="right")
    ax.grid(axis="y", alpha=0.25)

    for index, value in enumerate(values):
        ax.text(index, min(value + 0.03, 1.0), f"{value:.2f}", ha="center", va="bottom", fontsize=9)

    fig.tight_layout()
    fig.savefig(output_path, dpi=180)
    plt.close(fig)


def save_confidence_distribution(predictions: list[dict[str, Any]], output_path: Path) -> None:
    correct = [float(row["confidence"]) for row in predictions if row["is_correct"]]
    incorrect = [float(row["confidence"]) for row in predictions if not row["is_correct"]]

    fig, ax = plt.subplots(figsize=(8, 5))
    bins = [index / 10 for index in range(0, 11)]
    ax.hist(correct, bins=bins, alpha=0.75, label="Correct", color="#287c5b")
    ax.hist(incorrect, bins=bins, alpha=0.75, label="Incorrect / No Detection", color="#b94747")
    ax.set_title("Detection Confidence Distribution")
    ax.set_xlabel("Top detection confidence")
    ax.set_ylabel("Image count")
    ax.set_xlim(0, 1)
    ax.legend()
    ax.grid(axis="y", alpha=0.25)

    fig.tight_layout()
    fig.savefig(output_path, dpi=180)
    plt.close(fig)


def save_charts(predictions: list[dict[str, Any]], metrics: dict[str, Any], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    labels = [str(label) for label in metrics.get("chart_labels", metrics["labels"])]
    save_confusion_matrix(predictions, labels, output_dir / "confusion_matrix.png")
    save_per_class_accuracy(metrics["per_class_accuracy"], output_dir / "per_class_accuracy.png")
    save_confidence_distribution(predictions, output_dir / "confidence_distribution.png")


def run_evaluation(labels_path: Path, output_dir: Path, detector: Optional[Any] = None) -> EvaluationResult:
    labels_path = Path(labels_path)
    output_dir = Path(output_dir)

    cases = read_cases(labels_path)
    active_detector = detector or YoloDetectorAdapter()
    predictions = collect_predictions(cases, active_detector)
    metrics = calculate_metrics(predictions)

    save_predictions_csv(predictions, output_dir / "predictions.csv")
    save_metrics_json(metrics, output_dir / "metrics.json")
    save_charts(predictions, metrics, output_dir)

    return EvaluationResult(predictions=predictions, metrics=metrics)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Evaluate YOLO category detection accuracy on labeled images.")
    default_root = PROJECT_ROOT / "evaluation" / "category_detection"
    parser.add_argument("--labels", type=Path, default=default_root / "labels.csv", help="Path to labels.csv.")
    parser.add_argument("--output-dir", type=Path, default=default_root / "results", help="Directory for result artifacts.")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        result = run_evaluation(labels_path=args.labels, output_dir=args.output_dir)
    except (FileNotFoundError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    print(json.dumps(result.metrics, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
