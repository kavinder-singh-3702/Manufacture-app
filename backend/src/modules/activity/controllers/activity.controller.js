const { listActivitiesForUser } = require('../services/activity.service');

const listUserActivity = async (req, res, next) => {
  try {
    const activities = await listActivitiesForUser({
      userId: req.user.id,
      limit: req.query.limit,
      companyId: req.query.companyId,
      action: req.query.action
    });

    return res.json({ activities });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listUserActivity
};
