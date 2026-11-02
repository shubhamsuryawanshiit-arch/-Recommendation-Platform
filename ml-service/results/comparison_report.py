from pathlib import Path
import pandas as pd

def export_comparison(report, directory: Path):
    rows = [{"model": key, **value} for key, value in report.get("results", {}).items()]
    directory.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows).to_csv(directory / "model-comparison.csv", index=False)
