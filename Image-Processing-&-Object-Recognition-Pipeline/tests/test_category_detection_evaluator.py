from __future__ import annotations

import csv
import importlib.util
import json
from pathlib import Path

from PIL import Image


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "evaluate_category_detection.py"


def load_evaluator_module():
    spec = importlib.util.spec_from_file_location("evaluate_category_detection", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class FakeDetector:
    def __init__(self, predictions):
        self.predictions = predictions

    def detect(self, image_path):
        return self.predictions.get(Path(image_path).name, [])


class FakeDetection:
    def __init__(self, label, confidence):
        self.label = label
        self.confidence = confidence


def write_image(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.new("RGB", (12, 12), color=(120, 80, 40)).save(path)


def test_evaluator_records_predictions_and_no_detection(tmp_path):
    evaluator = load_evaluator_module()
    image_dir = tmp_path / "images"
    write_image(image_dir / "wallet.jpg")
    write_image(image_dir / "helmet.jpg")

    labels_path = tmp_path / "labels.csv"
    with labels_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["image_path", "true_label"])
        writer.writeheader()
        writer.writerow({"image_path": "images/wallet.jpg", "true_label": "Wallet"})
        writer.writerow({"image_path": "images/helmet.jpg", "true_label": "Helmet"})

    result = evaluator.run_evaluation(
        labels_path=labels_path,
        output_dir=tmp_path / "results",
        detector=FakeDetector(
            {
                "wallet.jpg": [FakeDetection("Wallet", 0.91)],
                "helmet.jpg": [],
            }
        ),
    )

    assert result.metrics["total_images"] == 2
    assert result.metrics["correct_predictions"] == 1
    assert result.metrics["accuracy"] == 0.5
    assert result.predictions[1]["predicted_label"] == "No Detection"
    assert result.predictions[1]["is_correct"] is False
    assert (tmp_path / "results" / "predictions.csv").exists()
    assert (tmp_path / "results" / "metrics.json").exists()
    assert (tmp_path / "results" / "confusion_matrix.png").exists()
    assert (tmp_path / "results" / "per_class_accuracy.png").exists()
    assert (tmp_path / "results" / "confidence_distribution.png").exists()


def test_metrics_json_contains_report_ready_fields(tmp_path):
    evaluator = load_evaluator_module()
    image_dir = tmp_path / "images"
    write_image(image_dir / "phone.jpg")

    labels_path = tmp_path / "labels.csv"
    labels_path.write_text("image_path,true_label\nimages/phone.jpg,Smart Phone\n", encoding="utf-8")

    evaluator.run_evaluation(
        labels_path=labels_path,
        output_dir=tmp_path / "results",
        detector=FakeDetector({"phone.jpg": [FakeDetection("Smart Phone", 0.88)]}),
    )

    metrics = json.loads((tmp_path / "results" / "metrics.json").read_text(encoding="utf-8"))

    assert metrics["accuracy"] == 1.0
    assert metrics["macro_precision"] == 1.0
    assert metrics["macro_recall"] == 1.0
    assert metrics["macro_f1"] == 1.0
    assert metrics["per_class_accuracy"]["Smart Phone"] == 1.0
    assert "report_note" in metrics


def test_cli_reports_empty_dataset_without_traceback(tmp_path, monkeypatch, capsys):
    evaluator = load_evaluator_module()
    labels_path = tmp_path / "labels.csv"
    labels_path.write_text("image_path,true_label\n", encoding="utf-8")

    monkeypatch.setattr(
        "sys.argv",
        [
            "evaluate_category_detection.py",
            "--labels",
            str(labels_path),
            "--output-dir",
            str(tmp_path / "results"),
        ],
    )

    assert evaluator.main() == 1
    captured = capsys.readouterr()
    assert "No evaluation rows found" in captured.err
    assert "Traceback" not in captured.err
