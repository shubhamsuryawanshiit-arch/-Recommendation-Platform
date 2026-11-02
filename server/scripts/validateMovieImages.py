"""Check local image mapping paths and basic image file signatures."""
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAPPING = ROOT / 'server' / 'data' / 'movieImageMapping.json'
PUBLIC = ROOT / 'client' / 'public'

def image_is_valid(path: Path) -> bool:
    try:
        header = path.read_bytes()[:16]
    except OSError:
        return False
    return (header.startswith(b'\xff\xd8\xff') or header.startswith(b'\x89PNG\r\n\x1a\n') or (header[:4] == b'RIFF' and header[8:12] == b'WEBP') or header[4:8] == b'ftyp')

def main():
    issues = []
    entries = json.loads(MAPPING.read_text(encoding='utf-8'))
    seen = set()
    for entry in entries:
        movie_id = entry.get('movieLensId')
        if movie_id in seen: issues.append(f'duplicate movieLensId: {movie_id}')
        seen.add(movie_id)
        for field in ('posterPath', 'backdropPath'):
            url = entry.get(field, '')
            if not url: continue
            if not isinstance(url, str) or not url.startswith('/assets/movies/'):
                issues.append(f'movie {movie_id}: {field} is not a local movie asset path'); continue
            file_path = (PUBLIC / url.lstrip('/')).resolve()
            if PUBLIC.resolve() not in file_path.parents:
                issues.append(f'movie {movie_id}: {field} escapes public assets'); continue
            if not file_path.is_file(): issues.append(f'movie {movie_id}: missing {url}')
            elif not image_is_valid(file_path): issues.append(f'movie {movie_id}: invalid image data at {url}')
    print(json.dumps({'mappings': len(entries), 'issues': issues}, indent=2))
    return 1 if issues else 0

if __name__ == '__main__': raise SystemExit(main())
