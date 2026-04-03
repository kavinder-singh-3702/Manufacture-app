const express = require('express');
const session = require('express-session');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const razorpayWebhookRouter = require('./modules/productOrders/routes/razorpayWebhook.routes');
const config = require('./config/env');
const { getSessionStore } = require('./config/sessionStore');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

if (config.trustProxy) {
  app.set('trust proxy', config.trustProxy);
}

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use('/api/payments/razorpay/webhook', express.raw({ type: 'application/json' }), razorpayWebhookRouter);
// Allow uploads up to 5 MB (base64 inflates ~33%), so set parser limits a bit higher.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const sessionStore = getSessionStore();
if (config.node === 'production' && !sessionStore) {
  throw new Error('Redis-backed session store is required in production');
}

const sessionOptions = {
  name: config.sessionName,
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: config.sessionCookieSameSite,
    secure: config.sessionCookieSecure,
    maxAge: config.sessionCookieMaxAge
  },
};

if (sessionStore) {
  sessionOptions.store = sessionStore;
}

if (config.sessionCookieDomain) {
  sessionOptions.cookie.domain = config.sessionCookieDomain;
}

if (config.trustProxy) {
  sessionOptions.proxy = true;
}

app.use(
  session(sessionOptions)
);

app.get('/', (req, res) => {
  res.json({ message: 'Manufacture API backend' });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
