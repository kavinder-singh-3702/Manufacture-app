const notFoundHandler = (req, res, next) => {
  return res.status(404).json({
    message: 'Resource not found',
    path: req.originalUrl
  });
};

const errorHandler = (err, req, res, next) => {
  const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : err.status || 500;
  const response = {
    message: err.code === 'LIMIT_FILE_SIZE'
      ? 'Uploaded file exceeds the allowed size limit'
      : err.message || 'Internal server error'
  };

  if (typeof err.code === 'string' && err.code.trim()) {
    response.code = err.code;
  }

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  return res.status(status).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
