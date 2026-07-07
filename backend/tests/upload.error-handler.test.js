const express = require('express');
const multer = require('multer');
const request = require('supertest');
const { errorHandler } = require('../src/middleware/errorHandler');

describe('upload error handling', () => {
  test('returns 413 for Multer file size limit errors', async () => {
    const app = express();

    app.post('/upload', (_req, _res, next) => {
      next(new multer.MulterError('LIMIT_FILE_SIZE'));
    });
    app.use(errorHandler);

    const response = await request(app).post('/upload').send();

    expect(response.status).toBe(413);
    expect(response.body).toMatchObject({
      message: 'Uploaded file exceeds the allowed size limit',
      code: 'LIMIT_FILE_SIZE'
    });
  });
});
