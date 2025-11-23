const { Router } = require('express');
const { getCurrentUser, updateCurrentUser, uploadUserFile } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { updateProfileValidation, uploadUserFileValidation } = require('../validators/user.validators');
const { uploadMemory } = require('../middleware/upload');

const router = Router();

router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, validate(updateProfileValidation), updateCurrentUser);
router.post(
  '/me/uploads',
  authenticate,
  uploadMemory.single('file'),
  (req, _res, next) => {
    if (req.file) {
      req.body.fileName = req.file.originalname;
      req.body.mimeType = req.file.mimetype;
      req.body.content = req.file.buffer.toString('base64');
    }
    next();
  },
  validate(uploadUserFileValidation),
  uploadUserFile
);

module.exports = router;
