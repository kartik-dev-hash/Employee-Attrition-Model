
import sys
import json
import os
import csv
from datetime import datetime, timezone

try:
    import numpy as np
    import joblib
    from sklearn.ensemble import (
        RandomForestClassifier,
        GradientBoostingClassifier,
        VotingClassifier,
    )
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import (
        accuracy_score,
        precision_score,
        recall_score,
        f1_score,
        confusion_matrix,
        roc_auc_score
    )
    SKLEARN_AVAILABLE = True
except ImportError as e:
    SKLEARN_AVAILABLE = False
    IMPORT_ERROR = str(e)

# These names must match the CSV columns and prediction inputs.
FEATURE_COLUMNS = [
    "JobSatisfaction",
    "EnvironmentSatisfaction",
    "WorkLifeBalance",
    "RelationshipSatisfaction"
]


def train_model(csv_path, model_version="1.0.0"):
    if not SKLEARN_AVAILABLE:
        return {
            "success": False,
            "status": "FAILED",
            "message": f"Missing Python dependency: {IMPORT_ERROR}"
        }

    if not os.path.exists(csv_path):
        return {
            "success": False,
            "status": "FAILED",
            "message": f"CSV file not found: {csv_path}"
        }

    X = []
    y = []

    with open(csv_path, newline="", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)

        missing = set(FEATURE_COLUMNS + ["Attrition"]) - set(reader.fieldnames or [])
        if missing:
            return {
                "success": False,
                "status": "FAILED",
                "message": f"Missing CSV columns: {sorted(missing)}"
            }

        for row in reader:
            try:
                features = [float(row[name]) for name in FEATURE_COLUMNS]
                outcome = row["Attrition"].strip().lower()

                if outcome not in ("yes", "no"):
                    continue

                X.append(features)
                y.append(1 if outcome == "yes" else 0)
            except (ValueError, TypeError, AttributeError):
                continue

    if len(X) < 20:
        return {
            "success": False,
            "status": "NEEDS_LABELED_DATA",
            "datasetSize": len(X),
            "message": "Not enough valid labeled rows to train."
        }

    X = np.asarray(X)
    y = np.asarray(y)

    if len(np.unique(y)) < 2:
        return {
            "success": False,
            "status": "NEEDS_LABELED_DATA",
            "message": "The dataset must contain both Attrition Yes and No."
        }

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=42,
        stratify=y
    )

    rf = RandomForestClassifier(
        n_estimators=180,
        max_depth=6,
        min_samples_leaf=4,
        random_state=42,
    )
    gb = GradientBoostingClassifier(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.08,
        random_state=42,
    )
    clf = VotingClassifier(
        estimators=[("rf", rf), ("gb", gb)],
        voting="soft",
    )
    clf.fit(X_train, y_train)

    predictions = clf.predict(X_test)
    probabilities = clf.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "precision": round(float(precision_score(
            y_test, predictions, zero_division=0
        )), 4),
        "recall": round(float(recall_score(
            y_test, predictions, zero_division=0
        )), 4),
        "f1Score": round(float(f1_score(
            y_test, predictions, zero_division=0
        )), 4),
        "confusionMatrix": confusion_matrix(y_test, predictions).tolist(),
        "rocAuc": None
    }

    if len(np.unique(y_test)) == 2:
        metrics["rocAuc"] = round(
            float(roc_auc_score(y_test, probabilities)), 4
        )

    artifacts_dir = os.path.join(os.path.dirname(__file__), "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)

    artifact_path = os.path.abspath(os.path.join(
        artifacts_dir, f"attrition_model_{model_version}.joblib"
    ))

    # Save both the model and the expected feature order.
    joblib.dump({
        "model": clf,
        "features": FEATURE_COLUMNS
    }, artifact_path)

    return {
        "success": True,
        "status": "TRAINED",
        "modelVersion": model_version,
        "trainingTimestamp": datetime.now(timezone.utc).isoformat(),
        "datasetSize": len(X),
        "validLabeledRecords": len(X),
        "features": FEATURE_COLUMNS,
        "evaluationMetrics": metrics,
        "artifactPath": artifact_path,
        "message": "Model trained and evaluated on a held-out test set."
    }


def main():
    # CSV path can be provided explicitly, or use the project's default.
    default_csv = os.path.join(
        os.path.dirname(__file__),
        "data",
        "WA_Fn-UseC_-HR-Employee-Attrition.csv"
    )

    if len(sys.argv) >= 3 and sys.argv[1] == "--csv":
        csv_path = sys.argv[2]
    else:
        csv_path = default_csv

    result = train_model(csv_path)
    print(json.dumps(result))


if __name__ == "__main__":
    main()