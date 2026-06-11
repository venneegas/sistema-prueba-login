import json
import sys


FEATURES = [
    "saldo_inicial",
    "ingresos_mes1",
    "ingresos_mes2",
    "ingresos_mes3",
    "total_ingresos",
    "egresos_mes1",
    "egresos_mes2",
    "egresos_mes3",
    "total_egresos",
    "dinero_en_caja",
    "saldo_banco_mes1",
    "saldo_banco_mes2",
    "saldo_banco_mes3",
    "dinero_en_banco",
    "saldo_final",
    "ratio_egresos_ingresos",
    "ratio_banco_saldo_final",
]


def fail(message, code="MODEL_ERROR"):
    print(json.dumps({"success": False, "code": code, "message": message}, ensure_ascii=False))
    sys.exit(1)


def main():
    try:
        from sklearn.ensemble import IsolationForest
        import numpy as np
    except ModuleNotFoundError:
        fail(
            "Falta instalar dependencias Python. Ejecuta: pip install -r backend/ml/requirements.txt",
            "MISSING_PYTHON_DEPS",
        )

    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except json.JSONDecodeError:
        fail("Payload JSON invalido.", "INVALID_JSON")

    rows = payload.get("rows") or []
    contamination = payload.get("contamination", "auto")

    if len(rows) < 5:
        fail("Se necesitan al menos 5 colegios completos para ejecutar Isolation Forest.", "INSUFFICIENT_ROWS")

    matrix = []
    for row in rows:
        matrix.append([float(row.get(feature) or 0) for feature in FEATURES])

    x = np.array(matrix, dtype=float)

    model = IsolationForest(
        n_estimators=200,
        contamination=contamination,
        random_state=42,
    )
    predictions = model.fit_predict(x)
    decision_scores = model.decision_function(x)
    raw_anomaly_scores = -decision_scores

    min_score = float(np.min(raw_anomaly_scores))
    max_score = float(np.max(raw_anomaly_scores))
    score_range = max(max_score - min_score, 1e-9)
    risk_scores = ((raw_anomaly_scores - min_score) / score_range) * 100

    means = np.mean(x, axis=0)
    stds = np.std(x, axis=0)
    stds[stds == 0] = 1

    alerts = []
    scored_rows = []

    for index, row in enumerate(rows):
        risk_score = round(float(risk_scores[index]), 2)
        is_anomaly = bool(predictions[index] == -1)
        z_values = np.abs((x[index] - means) / stds)
        top_indices = np.argsort(z_values)[-3:][::-1]
        top_features = [
            {
                "feature": FEATURES[feature_index],
                "value": round(float(x[index][feature_index]), 4),
                "deviation": round(float(z_values[feature_index]), 4),
            }
            for feature_index in top_indices
            if float(z_values[feature_index]) > 0
        ]

        risk_level = "alta" if risk_score >= 75 else "media" if risk_score >= 50 else "baja"
        result = {
            **row,
            "is_anomaly": is_anomaly,
            "anomaly_score": round(float(raw_anomaly_scores[index]), 6),
            "risk_score": risk_score,
            "risk_level": risk_level,
            "top_features": top_features,
        }
        scored_rows.append(result)

        if is_anomaly:
            alerts.append(result)

    print(json.dumps({
        "success": True,
        "model": "IsolationForest",
        "features": FEATURES,
        "total_rows": len(rows),
        "total_alerts": len(alerts),
        "alerts": sorted(alerts, key=lambda item: item["risk_score"], reverse=True),
        "scored_rows": sorted(scored_rows, key=lambda item: item["risk_score"], reverse=True),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
