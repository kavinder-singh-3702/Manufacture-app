const notFoundHandler = (req, res, next) => {
  return res.status(404).json({
    message: 'Resource not found',
    path: req.originalUrl
  });
};

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const response = {
    message: err.message || 'Internal server error'
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  return res.status(status).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
