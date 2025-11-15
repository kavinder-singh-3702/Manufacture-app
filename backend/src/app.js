const express = require('express');
const session = require('express-session');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const config = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(
  session({
    name: config.sessionName,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.node === 'production',
      maxAge: config.sessionCookieMaxAge
    },
    // MemoryStore is fine for dev; swap for Redis/Mongo in production for HA.
  })
);

app.get('/', (req, res) => {
  res.json({ message: 'Manufacture API backend' });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
