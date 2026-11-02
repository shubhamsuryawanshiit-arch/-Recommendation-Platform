from pathlib import Path
from ..evaluation.evaluation_report import save_report
from .comparison_report import export_comparison

def generate(report, directory: Path):
    save_report(report, directory)
    export_comparison(report, directory)
