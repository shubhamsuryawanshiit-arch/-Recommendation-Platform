from pathlib import Path
import pandas as pd

REQUIRED = {"movies.csv": {"movieId", "title", "genres"}, "ratings.csv": {"userId", "movieId", "rating", "timestamp"}, "tags.csv": {"userId", "movieId", "tag", "timestamp"}, "links.csv": {"movieId", "imdbId", "tmdbId"}}

def validate_dataset(directory: Path) -> dict:
    report = {}
    for filename, columns in REQUIRED.items():
        path = directory / filename
        if not path.is_file(): raise FileNotFoundError(f"Required dataset file missing: {path}")
        actual = set(pd.read_csv(path, nrows=0).columns)
        missing = columns - actual
        if missing: raise ValueError(f"{filename} missing columns: {sorted(missing)}")
        report[filename] = {"rows": int(sum(1 for _ in path.open(encoding="utf-8")) - 1), "columns": sorted(actual)}
    return report
