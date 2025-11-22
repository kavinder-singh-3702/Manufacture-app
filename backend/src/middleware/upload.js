const multer = require('multer');

// Memory storage because we stream to S3; limit to 5MB per file.
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = {
  uploadMemory,
};
