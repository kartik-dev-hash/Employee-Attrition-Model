
"""Run inference using a trained employee attrition model."""

import sys
import json
import os

try:
    import joblib
    import numpy as np
except ImportError:
    print(json.dumps({
        "success": False,
        "message": "Install joblib, numpy, and scikit-learn."
    }))
    sys.exit(1)


FEATURE_NAMES = [
    "JobSatisfaction",
    "EnvironmentSatisfaction",
    "WorkLifeBalance",
    "RelationshipSatisfaction",
]


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "message": "Inference payload JSON argument required."
        }))
        sys.exit(1)

    try:
        data = json.loads(sys.argv[1])
        artifact_path = data.get("artifactPath")
        features = data.get("features")

        if not artifact_path or not os.path.isfile(artifact_path):
            raise ValueError("Trained model artifact was not found.")

        if not isinstance(features, dict):
            raise ValueError("Features must be provided as a JSON object.")

        # The application must provide these exact input keys.
        missing = [
            name for name in [
                "jobSatisfaction",
                "environmentSatisfaction",
                "workLifeBalance",
                "relationshipSatisfaction",
            ]
            if name not in features
        ]

        if missing:
            raise ValueError(
                "Missing required features: " + ", ".join(missing)
            )

        values = [
            float(features["jobSatisfaction"]),
            float(features["environmentSatisfaction"]),
            float(features["workLifeBalance"]),
            float(features["relationshipSatisfaction"]),
        ]

        if not all(1 <= value <= 4 for value in values):
            raise ValueError(
                "The IBM-trained model expects satisfaction ratings "
                "from 1 to 4."
            )

        artifact = joblib.load(artifact_path)

        # The current training script saves a dictionary, not a bare model.
        if not isinstance(artifact, dict) or "model" not in artifact:
            raise ValueError(
                "Unexpected artifact format. Retrain using the current "
                "train_model.py script."
            )

        clf = artifact["model"]
        saved_features = artifact.get("features", FEATURE_NAMES)

        if saved_features != FEATURE_NAMES:
            raise ValueError("Model feature order does not match inference.")

        X = np.array([values], dtype=float)
        pred = int(clf.predict(X)[0])

        probability = None
        if hasattr(clf, "predict_proba"):
            probabilities = clf.predict_proba(X)[0]
            classes = list(clf.classes_)

            if 1 in classes:
                probability = float(probabilities[classes.index(1)])

        print(json.dumps({
            "success": True,
            "prediction": "Yes" if pred == 1 else "No",
            "probability": (
                round(probability, 4)
                if probability is not None else None
            ),
            "riskCategory": (
                "HIGH_RISK"
                if probability is not None and probability >= 0.5
                else "LOW_RISK"
                if probability is not None
                else "UNKNOWN"
            ),
        }))

    except Exception as error:
        print(json.dumps({
            "success": False,
            "message": str(error)
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()