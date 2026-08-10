const createError = require('http-errors');
const blockService = require('../services/block.service');

const blockUserController = async (req, res, next) => {
  try {
    const blockerId = req.user?.id;
    if (!blockerId) throw createError(401, 'Authentication required');
    const result = await blockService.blockUser({
      blockerId,
      blockedUserId: req.params.userId,
      reason: req.body?.reason,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

const unblockUserController = async (req, res, next) => {
  try {
    const blockerId = req.user?.id;
    if (!blockerId) throw createError(401, 'Authentication required');
    const result = await blockService.unblockUser({
      blockerId,
      blockedUserId: req.params.userId,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

const listMyBlocksController = async (req, res, next) => {
  try {
    const blockerId = req.user?.id;
    if (!blockerId) throw createError(401, 'Authentication required');
    const blocks = await blockService.listBlockedByMe(blockerId);
    return res.json({ blocks });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  blockUserController,
  unblockUserController,
  listMyBlocksController,
};
