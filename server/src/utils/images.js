export const POSTER_FALLBACK = '/assets/movies/placeholders/poster-placeholder.svg';
export const BACKDROP_FALLBACK = '/assets/movies/placeholders/backdrop-placeholder.svg';
export const CAST_FALLBACK = '/assets/movies/placeholders/cast-placeholder.svg';
const isLocal = path => typeof path === 'string' && path.startsWith('/assets/movies/');
export const getMoviePoster = movie => isLocal(movie?.posterPath) ? movie.posterPath : POSTER_FALLBACK;
export const getMovieBackdrop = movie => isLocal(movie?.backdropPath) ? movie.backdropPath : BACKDROP_FALLBACK;
export const getCastImage = path => isLocal(path) ? path : CAST_FALLBACK;
export const getPlaceholderImage = type => type === 'backdrop' ? BACKDROP_FALLBACK : type === 'cast' ? CAST_FALLBACK : POSTER_FALLBACK;
