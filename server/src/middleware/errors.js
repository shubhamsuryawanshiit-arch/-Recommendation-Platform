export function notFound(req, res) { res.status(404).json({ message: 'That route could not be found.' }); }
export function errors(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 11000) return res.status(409).json({ message: 'That record already exists.' });
  if (error.name === 'ZodError') return res.status(400).json({ message: error.issues?.[0]?.message || 'The submitted data is invalid.' });
  if (error.name === 'MulterError') return res.status(400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 8 MB or smaller.' : 'The image upload was rejected.' });
  if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: 'The submitted data is invalid.' });
  console.error(error);
  res.status(error.status || 500).json({ message: error.status ? error.message : 'The server could not complete the request.' });
}
