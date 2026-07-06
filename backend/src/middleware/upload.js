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
//
// fieldSize (default 1 MB) also needs a bump: the AdStudio wizard packs
// the whole creative payload — including bannerPosterBase64 for video
// ads — into a single "payload" JSON string field. A base64 poster
// alone is often 1-3 MB, so the default 1 MB per-field cap hit
// LIMIT_FIELD_VALUE and threw 500. 10 MB per field covers realistic
// posters with comfortable headroom.
const uploadAdMedia = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
    fieldSize: 10 * 1024 * 1024,
  },
});

module.exports = {
  uploadMemory,
  uploadAdMedia,
};
