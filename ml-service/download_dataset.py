import argparse
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")
from dataset.dataset_downloader import ensure_dataset
from dataset.dataset_validator import validate_dataset

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download or validate the official MovieLens Latest Small dataset.")
    parser.add_argument("--update", action="store_true", help="Download the latest archive again, replacing local CSVs.")
    folder = ensure_dataset(update=parser.parse_args().update)
    print(f"Dataset ready: {folder}")
    print(validate_dataset(folder))
