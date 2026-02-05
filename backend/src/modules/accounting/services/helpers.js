const mongoose = require('mongoose');

const roundMoney = (value) => {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return 0;
  return Number(number.toFixed(2));
};

const roundQuantity = (value, decimals = 6) => {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return 0;
  return Number(number.toFixed(decimals));
};

const toObjectId = (value) => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (!mongoose.Types.ObjectId.isValid(String(value))) return undefined;
  return new mongoose.Types.ObjectId(String(value));
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const sanitizeMeta = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return Object.entries(value).reduce((acc, [key, item]) => {
    if (item !== undefined) {
      acc[key] = item;
    }
    return acc;
  }, {});
};

const parseDateOrDefault = (value, fallback = new Date()) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
};

const isSameDayInTimezone = (firstDate, secondDate, timezone = 'UTC') => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return formatter.format(firstDate) === formatter.format(secondDate);
};

module.exports = {
  roundMoney,
  roundQuantity,
  toObjectId,
  ensureArray,
  sanitizeMeta,
  parseDateOrDefault,
  isSameDayInTimezone
};

