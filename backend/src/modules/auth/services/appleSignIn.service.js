const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const createError = require('http-errors');
const User = require('../../../models/user.model');
const { attachUserToSession } = require('./session-auth.service');
const { buildUserResponse } = require('../utils/response.util');
const { clearStaleActiveCompany } = require('../utils/activeCompany.util');
const { ACTIVITY_ACTIONS } = require('../../../constants/activity');
const { recordActivitySafe, extractRequestContext } = require('../../activity/services/activity.service');

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS_URI = 'https://appleid.apple.com/auth/keys';

const client = jwksClient({
  jwksUri: APPLE_JWKS_URI,
  cache: true,
  cacheMaxAge: 60 * 60 * 1000,
  rateLimit: true,
});

const allowedAudiences = () => {
  const raw = process.env.APPLE_BUNDLE_IDS || '';
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

const getSigningKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
};

const verifyIdentityToken = (identityToken) =>
  new Promise((resolve, reject) => {
    const audiences = allowedAudiences();
    if (!audiences.length) {
      return reject(createError(500, 'Apple Sign-In is not configured (APPLE_BUNDLE_IDS missing)'));
    }
    jwt.verify(
      identityToken,
      getSigningKey,
      {
        algorithms: ['RS256'],
        issuer: APPLE_ISSUER,
        audience: audiences,
      },
      (err, payload) => {
        if (err) return reject(createError(401, `Invalid Apple identity token: ${err.message}`));
        resolve(payload);
      }
    );
  });

const composeDisplayName = (firstName, lastName) =>
  [firstName, lastName].filter(Boolean).join(' ').trim();

const splitName = (fullName) => {
  if (!fullName) return { firstName: '', lastName: '' };
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
};

const findOrCreateAppleUser = async ({ appleUserId, email, firstName, lastName }) => {
  let user = await User.findOne({ appleUserId });
  if (user) return { user, created: false };

  if (email) {
    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user.appleUserId = appleUserId;
      if (!user.emailVerifiedAt) user.emailVerifiedAt = new Date();
      await user.save({ validateBeforeSave: false });
      return { user, created: false };
    }
  }

  if (!email) {
    throw createError(400, 'Apple did not return an email. Re-try and grant email permission.');
  }

  const resolvedFirstName = firstName || '';
  const resolvedLastName = lastName || '';
  const displayName = composeDisplayName(resolvedFirstName, resolvedLastName) || email.split('@')[0];

  const randomPassword = crypto.randomBytes(32).toString('hex');

  user = await User.create({
    appleUserId,
    email: email.toLowerCase(),
    firstName: resolvedFirstName,
    lastName: resolvedLastName,
    displayName,
    password: randomPassword,
    accountType: 'normal',
    emailVerifiedAt: new Date(),
  });

  return { user, created: true };
};

const signInWithApple = async (req, { identityToken, fullName }) => {
  if (!identityToken) {
    throw createError(400, 'identityToken is required');
  }

  const payload = await verifyIdentityToken(identityToken);
  const appleUserId = payload.sub;
  const email = typeof payload.email === 'string' ? payload.email : undefined;

  if (!appleUserId) {
    throw createError(401, 'Apple token did not include a stable user id');
  }

  const { firstName, lastName } = typeof fullName === 'string'
    ? splitName(fullName)
    : { firstName: fullName?.givenName, lastName: fullName?.familyName };

  const { user, created } = await findOrCreateAppleUser({
    appleUserId,
    email,
    firstName,
    lastName,
  });

  user.lastLoginAt = new Date();
  user.lastLoginIp = req.ip;
  await user.save({ validateBeforeSave: false });

  await clearStaleActiveCompany(user);
  await attachUserToSession(req, user.id);

  await recordActivitySafe({
    userId: user.id,
    action: created ? ACTIVITY_ACTIONS.AUTH_SIGNUP_COMPLETED : ACTIVITY_ACTIONS.AUTH_LOGIN,
    label: created ? 'Account created via Apple' : 'Signed in with Apple',
    description: created ? 'New account provisioned through Sign in with Apple' : 'Authenticated with Apple identity token',
    meta: { provider: 'apple', email: user.email },
    context: extractRequestContext(req),
  });

  return buildUserResponse(user);
};

module.exports = {
  signInWithApple,
};
