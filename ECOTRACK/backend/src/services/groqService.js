'use strict';
const { getGroqClient } = require('../config/groq');
const env = require('../config/env');
const { supabaseAdmin, getUserClient } = require('../config/supabase');

// ─────────────────────────────────────────────
// Prompt Builder
// ─────────────────────────────────────────────

function buildPrompt(calcData, profile) {
  const score     = calcData.eco_score ?? 0;
  const total     = calcData.total_emissions ?? 0;
  const name      = (profile && profile.full_name) ? profile.full_name : 'the user';

  const breakdown = {
    Transportation: calcData.transportation_emissions ?? calcData.breakdown?.transportation ?? 0,
    Electricity:    calcData.electricity_emissions    ?? calcData.breakdown?.electricity    ?? 0,
    Water:          calcData.water_emissions          ?? calcData.breakdown?.water          ?? 0,
    'Food & Diet':  calcData.food_emissions           ?? calcData.breakdown?.food           ?? 0,
    Waste:          calcData.waste_emissions          ?? calcData.breakdown?.waste          ?? 0,
    Shopping:       calcData.shopping_emissions       ?? calcData.breakdown?.shopping       ?? 0,
    Travel:         calcData.travel_emissions         ?? calcData.breakdown?.travel         ?? 0,
  };

  const sorted = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => `- ${k}: ${Number(v).toFixed(2)} kg CO₂e`)
    .join('\n');

  return `You are an expert environmental consultant and friendly Eco-coach.

Analyze the following carbon footprint data for ${name} and provide a personalized, practical recommendation plan.

USER DATA (calculated by verified application code — do NOT recalculate):
- Eco Score: ${score}/100  (0 = worst, 100 = best)
- Total Monthly Emissions: ${Number(total).toFixed(2)} kg CO₂e

EMISSION BREAKDOWN (highest to lowest):
${sorted}

INSTRUCTIONS:
1. Focus on the top 2-3 highest-emission categories.
2. Keep all tips short, actionable, and realistic for everyday life.
3. Be encouraging and positive — never judgmental.
4. Do NOT recalculate or contradict the emission values or Eco Score provided above.
5. For estimated_reduction_kg, provide a realistic possible monthly saving if the user follows the tips. Do NOT guarantee it.
6. Respond ONLY with a raw valid JSON object — no markdown fences, no extra text.

Required JSON structure:
{
  "overall_analysis": "<2-3 sentences summarizing footprint and praising effort>",
  "transportation_tips": ["<tip 1>", "<tip 2>"],
  "electricity_tips": ["<tip 1>", "<tip 2>"],
  "water_tips": ["<tip 1>", "<tip 2>"],
  "food_tips": ["<tip 1>", "<tip 2>"],
  "waste_tips": ["<tip 1>", "<tip 2>"],
  "shopping_tips": ["<tip 1>", "<tip 2>"],
  "travel_tips": ["<tip 1>", "<tip 2>"],
  "monthly_goal": "<specific achievable goal for this month>",
  "green_challenge": "<fun weekly challenge>",
  "estimated_reduction_kg": <integer — realistic possible monthly reduction>,
  "motivational_message": "<short closing motivational message>"
}`;
}

// ─────────────────────────────────────────────
// Groq Invocation
// ─────────────────────────────────────────────

const GROQ_TIMEOUT_MS = 30000;

async function callGroq(prompt) {
  const groq  = getGroqClient();
  const model = env.groq.model;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const completion = await groq.chat.completions.create(
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.45,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      },
      { signal: controller.signal }
    );

    clearTimeout(timer);
    return completion.choices[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError' || err.code === 'ETIMEDOUT') {
      throw new Error('Groq request timed out. Please try again later.');
    }
    // Surface rate-limit errors clearly
    if (err.status === 429) {
      throw new Error('Groq rate limit reached. Please wait a moment and try again.');
    }
    throw err;
  }
}

// ─────────────────────────────────────────────
// Response Parsing & Validation
// ─────────────────────────────────────────────

const REQUIRED_KEYS = [
  'overall_analysis', 'transportation_tips', 'electricity_tips', 'water_tips',
  'food_tips', 'waste_tips', 'shopping_tips', 'travel_tips',
  'monthly_goal', 'green_challenge', 'estimated_reduction_kg', 'motivational_message',
];

function parseAndValidate(raw) {
  let text = raw;
  // Strip accidental markdown fences
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Groq returned a response that could not be parsed as JSON.');
  }

  // Ensure required keys exist and coerce tip arrays
  for (const key of REQUIRED_KEYS) {
    if (!(key in parsed)) {
      parsed[key] = key.endsWith('_tips') ? [] : '';
    }
    if (key.endsWith('_tips') && !Array.isArray(parsed[key])) {
      parsed[key] = [String(parsed[key])];
    }
  }

  parsed.estimated_reduction_kg = parseInt(parsed.estimated_reduction_kg, 10) || 0;
  return parsed;
}

// ─────────────────────────────────────────────
// Generate & Save Recommendation
// ─────────────────────────────────────────────

async function generateRecommendation(userId, calcData, profile, accessToken) {
  const prompt = buildPrompt(calcData, profile);

  let raw;
  try {
    raw = await callGroq(prompt);
  } catch (err) {
    console.error('[groqService] Groq API call failed:', err.message);
    throw err;
  }

  if (!raw) throw new Error('Groq returned an empty response.');

  const aiData = parseAndValidate(raw);

  // Save to Supabase
  const record = {
    user_id:           userId,
    calculation_id:    calcData.id || null,
    response:          aiData,
    estimated_reduction: aiData.estimated_reduction_kg,
    monthly_goal:      aiData.monthly_goal || '',
    green_challenge:   aiData.green_challenge || '',
  };

  const client = accessToken ? getUserClient(accessToken) : supabaseAdmin;
  const { data, error } = await client
    .from('ai_recommendations')
    .insert(record)
    .select()
    .single();

  if (error) throw new Error(`Failed to save recommendation: ${error.message}`);
  return data;
}

async function getLatestRecommendation(userId, accessToken) {
  const client = accessToken ? getUserClient(accessToken) : supabaseAdmin;
  const { data, error } = await client
    .from('ai_recommendations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function getUserRecommendations(userId, accessToken) {
  const client = accessToken ? getUserClient(accessToken) : supabaseAdmin;
  const { data, error } = await client
    .from('ai_recommendations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Transforms categorized Groq tips into structured recommendation cards
 * for uniform display in React frontend.
 */
function toRecommendationCards(responseObj) {
  if (!responseObj) return [];
  const cards = [];
  const categories = [
    { key: 'transportation_tips', name: 'Transportation', impact: 'High', saving: 8 },
    { key: 'electricity_tips',    name: 'Electricity',    impact: 'High', saving: 12 },
    { key: 'food_tips',           name: 'Food & Diet',    impact: 'Medium', saving: 5 },
    { key: 'water_tips',          name: 'Water Conservation', impact: 'Medium', saving: 3 },
    { key: 'waste_tips',          name: 'Waste Management', impact: 'Medium', saving: 2 },
    { key: 'shopping_tips',       name: 'Conscious Shopping', impact: 'Low', saving: 4 },
    { key: 'travel_tips',         name: 'Travel & Commute', impact: 'Medium', saving: 10 },
  ];

  for (const cat of categories) {
    const tips = Array.isArray(responseObj[cat.key]) ? responseObj[cat.key] : [];
    tips.forEach((tip, idx) => {
      cards.push({
        id: `${cat.key}-${idx}`,
        category: cat.name,
        impact: cat.impact,
        title: `${cat.name} Action #${idx + 1}`,
        description: tip,
        action: tip,
        potential_saving: cat.saving,
      });
    });
  }
  return cards;
}

/**
 * Natural language sustainability query using Groq
 */
async function generateCustomAdvice(prompt, profile) {
  const groq = getGroqClient();
  const model = env.groq.model;
  const userName = profile?.full_name || 'Friend';

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `You are EcoTrack AI Eco-Coach assisting ${userName}. Provide personalized, encouraging, and highly practical sustainability tips. Format your answer clearly with bullet points. Never hallucinate data.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.6,
    max_tokens: 2500,
  });

  return completion.choices[0]?.message?.content?.trim() || '';
}

module.exports = {
  generateRecommendation,
  getLatestRecommendation,
  getUserRecommendations,
  toRecommendationCards,
  generateCustomAdvice,
};

