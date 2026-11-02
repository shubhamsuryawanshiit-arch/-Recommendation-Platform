import json
from pathlib import Path
import pandas as pd

def save_report(report, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "latest-evaluation.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    rows = [{"model": name, **metrics, "evaluationDate": report["evaluationDate"], "modelVersion": report["modelVersion"]} for name, metrics in report["results"].items()]
    pd.DataFrame(rows).to_csv(output_dir / "latest-evaluation.csv", index=False)
