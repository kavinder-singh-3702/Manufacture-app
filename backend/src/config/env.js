const dotenv = require('dotenv');

// Load environment variables from .env if present
dotenv.config();

const config = {
  node: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/manufacture'
};

module.exports = Object.freeze(config);
