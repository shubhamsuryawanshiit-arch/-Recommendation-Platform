from pathlib import Path
import pandas as pd
from .dataset_downloader import ensure_dataset
from .dataset_validator import validate_dataset

def load_dataset(directory: Path | None = None):
    root = directory or ensure_dataset()
    validate_dataset(root)
    return {name: pd.read_csv(root / f"{name}.csv") for name in ("movies", "ratings", "tags", "links")}
