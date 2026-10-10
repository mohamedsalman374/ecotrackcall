'use strict';
const { getUserClient } = require('../config/supabase');
const groqService = require('../services/groqService');

// POST /api/v1/ai/recommendations/generate
async function generateRecommendations(req, res, next) {
  try {
    const userId = req.user.id;
    const client = getUserClient(req.token);

    // Get the latest calculation to base recommendations on
    const { data: calcs, error } = await client
      .from('carbon_calculations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !calcs || calcs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please complete at least one carbon calculation before generating AI recommendations.',
      });
    }

    const calcData = calcs[0];
    const profile  = req.profile;

    let saved;
    try {
      saved = await groqService.generateRecommendation(userId, calcData, profile, req.token);
    } catch (aiErr) {
      console.error('[aiController] Groq failed:', aiErr.message);
      return res.status(503).json({
        success: false,
        error: 'The AI recommendation service is temporarily unavailable. Please try again shortly.',
        fallback: true,
      });
    }

    const cards = groqService.toRecommendationCards(saved.response);
    return res.status(201).json({
      success: true,
      data: saved,
      recommendations: cards,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/ai/recommendations/latest
async function getLatestRecommendation(req, res, next) {
  try {
    const data = await groqService.getLatestRecommendation(req.user.id, req.token);
    if (!data) {
      return res.status(404).json({ success: false, error: 'No recommendations found. Generate one first.' });
    }
    const cards = groqService.toRecommendationCards(data.response);
    return res.json({ success: true, data, recommendations: cards });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/ai/recommendations
async function listRecommendations(req, res, next) {
  try {
    const list = await groqService.getUserRecommendations(req.user.id, req.token);
    const latestRec = list && list.length > 0 ? list[0] : null;
    const cards = latestRec ? groqService.toRecommendationCards(latestRec.response) : [];

    return res.json({
      success: true,
      data: list,
      latest: latestRec,
      recommendations: cards,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/ai/generate (interactive query)
async function customAdvice(req, res, next) {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'A prompt is required.' });
    }

    const text = await groqService.generateCustomAdvice(prompt.trim(), req.profile);
    return res.json({
      success: true,
      response: text,
      text,
    });
  } catch (err) {
    console.error('[aiController] Groq custom advice failed:', err.message);
    return res.status(503).json({
      success: false,
      error: 'AI Eco-Coach is temporarily unavailable. Please try again in a moment.',
    });
  }
}

module.exports = {
  generateRecommendations,
  getLatestRecommendation,
  listRecommendations,
  customAdvice,
};
