from functools import lru_cache

@lru_cache(maxsize=2048)
def cached_key(user_id, strategy, version):
    return f"{version}:{strategy}:{user_id}"
