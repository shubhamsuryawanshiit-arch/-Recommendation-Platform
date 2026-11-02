import json
from datetime import datetime, timezone
from pathlib import Path

def log_generation(directory: Path, user_id: str, strategy: str, elapsed_ms: float, result_count: int):
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / "recommendation-generation.jsonl"
    with path.open("a", encoding="utf-8") as stream:
        stream.write(json.dumps({"userId": user_id, "strategy": strategy, "elapsedMs": elapsed_ms, "resultCount": result_count, "createdAt": datetime.now(timezone.utc).isoformat()}) + "\n")
