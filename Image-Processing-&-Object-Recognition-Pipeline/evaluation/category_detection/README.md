# Category Detection Evaluation

Use this folder to create viva/report-ready object/category detection results for the image-processing component.

## 1. Add Labeled Images

Place manually labeled test images in:

```text
evaluation/category_detection/images/
```

Then add rows to `labels.csv`:

```csv
image_path,true_label
images/wallet_01.jpg,Wallet
images/helmet_01.jpg,Helmet
images/student_id_01.jpg,Student ID
```

The `true_label` value must match one of the pipeline labels in `app/domain/category_specs.py`.

## 2. Run The Evaluator

From `Image-Processing-&-Object-Recognition-Pipeline/`:

```bash
python scripts/evaluate_category_detection.py
```

Or pass custom paths:

```bash
python scripts/evaluate_category_detection.py --labels evaluation/category_detection/labels.csv --output-dir evaluation/category_detection/results
```

## 3. Report Artifacts

The script writes:

- `results/predictions.csv`
- `results/metrics.json`
- `results/confusion_matrix.png`
- `results/per_class_accuracy.png`
- `results/confidence_distribution.png`

Recommended report wording:

> The image-processing component was evaluated using a manually labeled internal test set. Each image was passed through the YOLO-based category detector, and the top-confidence category was compared with the ground-truth label. The reported accuracy is therefore a component-level category detection accuracy, not a full-system benchmark.
