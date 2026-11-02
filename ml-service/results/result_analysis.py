def analyze(report):
    results = report.get("results", {})
    comparable = [(name, metric.get("rmse")) for name, metric in results.items() if metric.get("rmse") is not None]
    return {"bestRmseModel": min(comparable, key=lambda item: item[1])[0] if comparable else None, "modelsCompared": list(results), "evaluationId": report.get("evaluationId")}
