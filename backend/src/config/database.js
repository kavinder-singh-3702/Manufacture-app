const mongoose = require('mongoose');

let cachedConnection = null;

const connectDatabase = async (mongoUri) => {
  if (cachedConnection) {
    return cachedConnection;
  }

  mongoose.set('strictQuery', true);

  try {
    cachedConnection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    return cachedConnection;
  } catch (error) {
    cachedConnection = null;
    throw error;
  }
};

const disconnectDatabase = async () => {
  if (!cachedConnection) return;

  await mongoose.disconnect();
  cachedConnection = null;
};

module.exports = {
  connectDatabase,
  disconnectDatabase
};
