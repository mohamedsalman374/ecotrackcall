'use strict';
const { getUserClient } = require('../config/supabase');

const VALID_RANGES = ['1m', '3m', '6m', '1y', 'all'];

function getRangeCutoff(range) {
  const now = new Date();
  switch (range) {
    case '1m': return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
    case '3m': return new Date(now.setMonth(now.getMonth() - 3)).toISOString();
    case '6m': return new Date(now.setMonth(now.getMonth() - 6)).toISOString();
    case '1y': return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
    default:   return null;
  }
}

// GET /api/v1/analytics?range=3m
async function getAnalytics(req, res, next) {
  try {
    const range  = VALID_RANGES.includes(req.query.range) ? req.query.range : 'all';
    const cutoff = getRangeCutoff(range);
    const client = getUserClient(req.token);

    let query = client
      .from('carbon_calculations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });

    if (cutoff) query = query.gte('created_at', cutoff);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const records = data || [];
    const CATS = ['transportation', 'electricity', 'water', 'food', 'waste', 'shopping', 'travel'];

    // Averages per category
    const averages = {};
    for (const cat of CATS) {
      const col = `${cat}_emissions`;
      const vals = records.map(r => Number(r[col] || 0));
      averages[cat] = vals.length ? +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2) : 0;
    }

    // Totals per category
    const totals = {};
    for (const cat of CATS) {
      totals[cat] = +records.reduce((s, r) => s + Number(r[`${cat}_emissions`] || 0), 0).toFixed(2);
    }

    // Average total emission
    const avgEmission = records.length
      ? +(records.reduce((s, r) => s + Number(r.total_emissions || 0), 0) / records.length).toFixed(2)
      : 0;

    // Highest category overall
    const highestCategory = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Net reduction (first vs last)
    const first = records[0]?.total_emissions ?? null;
    const last  = records[records.length - 1]?.total_emissions ?? null;
    const totalReduction = first !== null && last !== null ? +(first - last).toFixed(2) : 0;

    return res.json({
      success: true,
      range,
      trends: records,
      averages,
      totals,
      average_emission: avgEmission,
      highest_category: highestCategory,
      total_reduction:  totalReduction,
      total_records:    records.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAnalytics };
