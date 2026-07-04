const multer = require('multer');

// Memory storage because we stream to S3; limit to 5MB per file.
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Ad banner videos can be larger than ordinary documents/images.
// 30 MB proved too tight — a modern iPhone 4K/60 clip is ~5-10 MB per
// second, so even a 30s "Low" export can exceed the cap. Bumped to
// 100 MB which comfortably fits a minute of decent-quality video.
const uploadAdMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

module.exports = {
  uploadMemory,
  uploadAdMedia,
};
