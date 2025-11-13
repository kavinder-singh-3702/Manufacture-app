const createLogger = (label = 'app') => {
  const formatMessage = (level, message, ...meta) => {
    const timestamp = new Date().toISOString();
    return [`[${timestamp}]`, `[${label}]`, level.toUpperCase() + ':', message, ...meta];
  };

  return {
    info: (message, ...meta) => console.log(...formatMessage('info', message, ...meta)),
    warn: (message, ...meta) => console.warn(...formatMessage('warn', message, ...meta)),
    error: (message, ...meta) => console.error(...formatMessage('error', message, ...meta))
  };
};

module.exports = createLogger;
