export function errorHandler(err, req, res, next) {
  const status = err.status || 500

  if (process.env.NODE_ENV === 'development') {
    res.status(status).json({
      error: err.message,
      stack: err.stack,
    })
  } else {
    res.status(status).json({
      error: status === 500 ? 'Internal Server Error' : err.message,
    })
  }
}
