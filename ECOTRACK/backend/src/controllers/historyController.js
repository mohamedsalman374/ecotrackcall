'use strict';
const {
  getCalculations, getCalculationById,
  deleteCalculation, deleteAllCalculations,
} = require('../services/calculatorService');
const { toCsvBuffer, toPdfBuffer } = require('../services/exportService');

// GET /api/v1/history
async function listHistory(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const data  = await getCalculations(req.user.id, req.token, limit);
    return res.json({ success: true, data, total: data.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/history/:id
async function getHistoryItem(req, res, next) {
  try {
    const calc = await getCalculationById(req.user.id, req.params.id, req.token);
    if (!calc) return res.status(404).json({ success: false, error: 'Record not found.' });
    return res.json({ success: true, data: calc });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/history/:id
async function deleteHistoryItem(req, res, next) {
  try {
    await deleteCalculation(req.user.id, req.params.id, req.token);
    return res.json({ success: true, message: 'Calculation record deleted.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/history/batch-delete
async function batchDeleteHistory(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids must be a non-empty array.' });
    }
    for (const id of ids) {
      await deleteCalculation(req.user.id, id, req.token);
    }
    return res.json({ success: true, message: `${ids.length} records deleted.` });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/history/all
async function deleteAllHistory(req, res, next) {
  try {
    await deleteAllCalculations(req.user.id, req.token);
    return res.json({ success: true, message: 'All calculation history deleted.' });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/history/export/csv
async function exportCsv(req, res, next) {
  try {
    const records = await getCalculations(req.user.id, req.token, 1000);
    const buf     = toCsvBuffer(records);
    const fname   = `ecotrack_history_${new Date().toISOString().slice(0, 10)}.csv`;
    res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${fname}"` });
    return res.send(buf);
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/history/export/pdf
async function exportPdf(req, res, next) {
  try {
    const records = await getCalculations(req.user.id, req.token, 1000);
    const buf     = await toPdfBuffer(records);
    const fname   = `ecotrack_history_${new Date().toISOString().slice(0, 10)}.pdf`;
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fname}"` });
    return res.send(buf);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listHistory, getHistoryItem, deleteHistoryItem,
  batchDeleteHistory, deleteAllHistory, exportCsv, exportPdf,
};
