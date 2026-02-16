const config = require('../../../../config/env');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const isExpoToken = (token) => typeof token === 'string' && /^ExponentPushToken\[.+\]$/.test(token);

const sendPushMessages = async (messages) => {
  if (!Array.isArray(messages) || !messages.length) {
    return { successCount: 0, failureCount: 0, results: [] };
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  if (config.expoPushAccessToken) {
    headers.Authorization = `Bearer ${config.expoPushAccessToken}`;
  }

  const batches = chunk(messages, 100);
  const results = [];

  for (const batch of batches) {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(batch)
    });

    let parsed;
    try {
      parsed = await response.json();
    } catch {
      parsed = { data: [] };
    }

    const data = Array.isArray(parsed?.data) ? parsed.data : [];

    for (let i = 0; i < batch.length; i += 1) {
      const ticket = data[i] || {};
      const message = batch[i];
      const status = ticket.status === 'ok' ? 'ok' : 'error';
      results.push({
        token: message.to,
        status,
        id: ticket.id,
        details: ticket.details || null,
        message: ticket.message || null,
      });
    }
  }

  const successCount = results.filter((item) => item.status === 'ok').length;
  const failureCount = results.length - successCount;

  return {
    successCount,
    failureCount,
    results
  };
};

module.exports = {
  sendPushMessages,
  isExpoToken
};
