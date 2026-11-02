const FALLBACK = '/assets/movies/placeholders/poster-placeholder.svg';
const BACKDROP = '/assets/movies/placeholders/backdrop-placeholder.svg';
const assetOrigin = (import.meta.env.VITE_ASSET_URL || '').replace(/\/$/, '');
export const localMovieImage = (path, type = 'poster') => {
  const fallback = type === 'backdrop' ? BACKDROP : FALLBACK;
  if (typeof path !== 'string' || !path.startsWith('/assets/movies/')) return fallback;
  if (assetOrigin && !path.startsWith('/assets/movies/placeholders/')) return `${assetOrigin}${path}`;
  return path;
};
export const movieImageFallback = type => type === 'backdrop' ? BACKDROP : FALLBACK;
