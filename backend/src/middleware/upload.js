const multer = require('multer');

// Memory storage because we stream to S3; limit to 5MB per file.
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Ad banner videos can be larger than ordinary documents/images.
const uploadAdMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
});

module.exports = {
  uploadMemory,
  uploadAdMedia,
};
