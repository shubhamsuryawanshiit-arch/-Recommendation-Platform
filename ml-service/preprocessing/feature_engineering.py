import re

def release_year(title: str):
    match = re.search(r"\((\d{4})\)\s*$", str(title))
    return int(match.group(1)) if match else None

def genre_features(genres: str):
    return [genre for genre in str(genres).split("|") if genre and genre != "(no genres listed)"]
