const {
  createQuote,
  listQuotes,
  getQuoteById,
  respondToQuote,
  updateQuoteStatus
} = require('../services/quote.service');

const createQuoteController = async (req, res, next) => {
  try {
    const quote = await createQuote(req.body, req.user);
    return res.status(201).json({ quote });
  } catch (error) {
    return next(error);
  }
};

const listQuotesController = async (req, res, next) => {
  try {
    const result = await listQuotes(req.user, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getQuoteController = async (req, res, next) => {
  try {
    const quote = await getQuoteById(req.params.quoteId, req.user);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    return res.json({ quote });
  } catch (error) {
    return next(error);
  }
};

const respondToQuoteController = async (req, res, next) => {
  try {
    const quote = await respondToQuote(req.params.quoteId, req.body, req.user);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    return res.json({ quote });
  } catch (error) {
    return next(error);
  }
};

const updateQuoteStatusController = async (req, res, next) => {
  try {
    const quote = await updateQuoteStatus(req.params.quoteId, req.body, req.user);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    return res.json({ quote });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createQuoteController,
  listQuotesController,
  getQuoteController,
  respondToQuoteController,
  updateQuoteStatusController
};
