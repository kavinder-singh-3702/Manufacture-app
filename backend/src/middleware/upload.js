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
// fieldSize (default 1 MB) also needs a bump: the wizard's non-file `payload`
// field still carries a legacy base64 fallback for callers with no multipart
// request to draw a file from (see ad.routes.js parseAdMultipart) — a base64
// poster alone can be 1-3 MB, so the default 1 MB per-field cap threw 500.
// 10 MB per field covers realistic posters with comfortable headroom. Actual
// banner image/video/poster/advertiser-logo uploads go through the `.fields`
// file slots below instead, capped by `fileSize`, not `fieldSize`.
const uploadAdMedia = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
    fieldSize: 10 * 1024 * 1024,
  },
});

// One named file slot per media kind the campaign wizard can upload. All
// optional — a request may include any subset (or none, for a plain JSON
// text-only edit). Keeping the field names identical between the web and
// app clients means the server-side parsing (parseAdMultipart) needs no
// per-platform branching.
const uploadAdMediaFields = uploadAdMedia.fields([
  { name: 'bannerVideo', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 },
  { name: 'bannerPoster', maxCount: 1 },
  { name: 'advertiserLogo', maxCount: 1 },
]);

module.exports = {
  uploadMemory,
  uploadAdMedia,
  uploadAdMediaFields,
};
