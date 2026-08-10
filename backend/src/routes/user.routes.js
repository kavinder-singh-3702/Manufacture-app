const { Router } = require('express');
const { body } = require('express-validator');
const { getCurrentUser, updateCurrentUser, uploadUserFile, deleteCurrentUser } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { updateProfileValidation, uploadUserFileValidation } = require('../validators/user.validators');
const { uploadMemory } = require('../middleware/upload');

const router = Router();

// Apple 5.1.1(v): account deletion must be initiated from inside the app.
// Body requires an exact "DELETE" confirmation string; password re-entry
// is optional here (the service enforces it for non-Apple-only accounts).
const deleteAccountValidation = [
  body('confirm').isString().equals('DELETE').withMessage('Please type DELETE to confirm.'),
  body('password').optional().isString(),
];

router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, validate(updateProfileValidation), updateCurrentUser);
// POST rather than DELETE so the client can send a JSON body (the
// httpClient's DELETE helper omits `data`; standard REST also
// discourages DELETE-with-body).
router.post('/me/delete', authenticate, validate(deleteAccountValidation), deleteCurrentUser);
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
