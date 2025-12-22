const { Router } = require('express');
const { authenticate } = require('../../middleware/authMiddleware');
const { listFavorites, addFavorite, removeFavorite } = require('./favorites.controller');

const router = Router();

router.use(authenticate);

router.get('/', listFavorites);
router.post('/:productId', addFavorite);
router.delete('/:productId', removeFavorite);

module.exports = router;
