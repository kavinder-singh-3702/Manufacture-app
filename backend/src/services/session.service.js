/**
 * Helpers to interact with express-session using promises so that
 * controllers can await the lifecycle events instead of dealing
 * with callback hell every time we rotate or destroy sessions.
 */
const regenerateSession = (req) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        return reject(error);
      }
      return resolve(req.session);
    });
  });

const destroySession = (req) =>
  new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) {
        return reject(error);
      }
      return resolve();
    });
  });

module.exports = {
  regenerateSession,
  destroySession,
};
