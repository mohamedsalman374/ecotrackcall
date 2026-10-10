'use strict';
const { supabaseAdmin, getUserClient } = require('../config/supabase');

// GET /api/v1/dashboard/summary
async function getSummary(req, res, next) {
  try {
    const userId = req.user.id;
    const client = getUserClient(req.token);

    // Latest calculation
    const { data: calcs } = await client
      .from('carbon_calculations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const latest = calcs && calcs.length > 0 ? calcs[0] : null;

    // Total count
    const { count } = await client
      .from('carbon_calculations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Latest recommendation
    const { data: recData } = await client
      .from('ai_recommendations')
      .select('response, monthly_goal, green_challenge, estimated_reduction')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const profile  = req.profile;
    const ecoScore = latest ? latest.eco_score : 100;

    let ecoLevel;
    if (ecoScore >= 80)      ecoLevel = 'Eco Champion';
    else if (ecoScore >= 60) ecoLevel = 'Eco Conscious';
    else if (ecoScore >= 40) ecoLevel = 'Needs Improvement';
    else                     ecoLevel = 'High Carbon Impact';

    return res.json({
      success: true,
      eco_score:          ecoScore,
      eco_level:          ecoLevel,
      total_emissions:    latest ? latest.total_emissions : 0,
      total_calculations: count || 0,
      latest_calculation: latest,
      recent_calculations: calcs || [],
      breakdown: latest ? {
        transportation: latest.transportation_emissions,
        electricity:    latest.electricity_emissions,
        water:          latest.water_emissions,
        food:           latest.food_emissions,
        waste:          latest.waste_emissions,
        shopping:       latest.shopping_emissions,
        travel:         latest.travel_emissions,
      } : null,
      recommendations: recData?.response?.transportation_tips
        ? [
            { title: 'Transportation', tips: recData.response.transportation_tips },
            { title: 'Electricity',    tips: recData.response.electricity_tips },
            { title: 'Food & Diet',    tips: recData.response.food_tips },
          ]
        : [],
      monthly_goal:       recData?.monthly_goal || null,
      profile,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };
