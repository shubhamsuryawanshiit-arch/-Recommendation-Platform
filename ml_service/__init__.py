"""Import alias for the hyphenated ml-service source folder."""
from pathlib import Path
__path__ = [str(Path(__file__).resolve().parent.parent / 'ml-service')]
