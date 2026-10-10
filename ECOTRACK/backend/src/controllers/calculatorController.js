'use strict';
const {
  computeEmissions, saveCalculation,
  getCalculations, getCalculationById, deleteCalculation, deleteAllCalculations,
} = require('../services/calculatorService');
const { getFactors } = require('../services/emissionFactorService');

// POST /api/v1/calculator/calculate
async function calculate(req, res, next) {
  try {
    const result = computeEmissions(req.body);
    const saved  = await saveCalculation(req.user.id, result, req.token);
    return res.status(201).json({ success: true, data: { ...saved, breakdown: result.breakdown, eco_level: result.eco_level } });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/calculator/factors
function getEmissionFactors(req, res) {
  return res.json({ success: true, factors: getFactors() });
}

// GET /api/v1/calculator/latest
async function getLatest(req, res, next) {
  try {
    const calcs = await getCalculations(req.user.id, req.token, 1);
    if (!calcs || calcs.length === 0) {
      return res.status(404).json({ success: false, error: 'No calculations found.' });
    }
    return res.json({ success: true, data: calcs[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/calculator/:id
async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const calc = await getCalculationById(req.user.id, id, req.token);
    if (!calc) return res.status(404).json({ success: false, error: 'Calculation not found.' });
    return res.json({ success: true, data: calc });
  } catch (err) {
    next(err);
  }
}

module.exports = { calculate, getEmissionFactors, getLatest, getById };
