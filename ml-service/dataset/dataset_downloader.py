"""Fetch the official GroupLens MovieLens Latest Small archive on demand."""
from pathlib import Path
from urllib.request import urlopen
from zipfile import ZipFile
import os

DATASET_URL = "https://files.grouplens.org/datasets/movielens/ml-latest-small.zip"
BASE = Path(__file__).resolve().parent
DATASET_DIR = Path(os.getenv("DATASET_DIR", BASE / "ml-latest-small"))

def ensure_dataset(update: bool = False) -> Path:
    required = ("movies.csv", "ratings.csv", "tags.csv", "links.csv")
    if not update and all((DATASET_DIR / name).is_file() for name in required):
        return DATASET_DIR
    DATASET_DIR.parent.mkdir(parents=True, exist_ok=True)
    archive = DATASET_DIR.parent / "ml-latest-small.zip"
    if update or not archive.exists():
        with urlopen(DATASET_URL, timeout=60) as response, archive.open("wb") as output:
            output.write(response.read())
    with ZipFile(archive) as zf:
        root = "ml-latest-small/"
        for name in required:
            member = root + name
            if member not in zf.namelist():
                raise ValueError(f"MovieLens archive is missing {name}")
        DATASET_DIR.mkdir(parents=True, exist_ok=True)
        for name in required:
            (DATASET_DIR / name).write_bytes(zf.read(root + name))
    return DATASET_DIR
