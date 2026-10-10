'use strict';
const { getFactor, validKeys } = require('./emissionFactorService');
const { supabaseAdmin, getUserClient } = require('../config/supabase');

// ─────────────────────────────────────────────
// Input Validation Helpers
// ─────────────────────────────────────────────

function clampNum(val, min = 0, max = Infinity) {
  const n = parseFloat(val);
  if (isNaN(n)) return min;
  return Math.min(Math.max(n, min), max);
}

function safeChoice(val, validList, defaultVal) {
  return validList.includes(val) ? val : defaultVal;
}

// ─────────────────────────────────────────────
// Core Calculation Engine
// ─────────────────────────────────────────────

/**
 * Validate, compute emissions for all 7 categories, and derive Eco Score.
 * Returns structured result object — does NOT touch the database.
 *
 * Categories:
 *  1. Transportation (mode + km/month)
 *  2. Electricity    (kWh/month)
 *  3. Water          (litres/day × days)
 *  4. Food/Diet      (diet type — monthly)
 *  5. Waste          (kg/month + recycling %)
 *  6. Shopping       (clothing, electronics, general items/month)
 *  7. Travel         (flights + train trips/month)
 */
function computeEmissions(input) {
  // ── 1. Transportation ──
  const transportMode = safeChoice(input.transport_mode, validKeys('transportation'), 'car');
  const transportKm   = clampNum(input.transport_km, 0, 10000);
  const transportEmissions = transportKm * getFactor('transportation', transportMode);

  // ── 2. Electricity ──
  const electricityKwh     = clampNum(input.electricity_kwh, 0, 5000);
  const renewablePct       = clampNum(input.renewable_pct, 0, 100) / 100;
  const gridKwh            = electricityKwh * (1 - renewablePct);
  const electricityEmissions = gridKwh * getFactor('electricity', 'grid_average');

  // ── 3. Water ──
  const waterLitresPerDay  = clampNum(input.water_litres_per_day, 0, 2000);
  const waterDays          = clampNum(input.water_days, 1, 31);
  const waterEmissions     = waterLitresPerDay * waterDays * getFactor('water', 'tap_water');

  // ── 4. Food / Diet ──
  const dietType        = safeChoice(input.diet_type, validKeys('food'), 'average');
  const foodEmissions   = getFactor('food', dietType) * 30; // monthly

  // ── 5. Waste ──
  const wasteKg         = clampNum(input.waste_kg, 0, 500);
  const recyclingPct    = clampNum(input.recycling_pct, 0, 100) / 100;
  const landfillKg      = wasteKg * (1 - recyclingPct);
  const recycledKg      = wasteKg * recyclingPct;
  const wasteEmissions  =
    landfillKg * getFactor('waste', 'landfill') +
    recycledKg * getFactor('waste', 'recycled');

  // ── 6. Shopping ──
  const clothingItems   = clampNum(input.clothing_items, 0, 100);
  const electronicsItems= clampNum(input.electronics_items, 0, 50);
  const generalItems    = clampNum(input.general_items, 0, 200);
  const shoppingEmissions =
    clothingItems    * getFactor('shopping', 'clothing') +
    electronicsItems * getFactor('shopping', 'electronics') +
    generalItems     * getFactor('shopping', 'general');

  // ── 7. Travel ──
  const domesticFlights      = clampNum(input.domestic_flights, 0, 50);
  const internationalFlights = clampNum(input.international_flights, 0, 20);
  const trainTrips           = clampNum(input.train_trips, 0, 100);
  const travelEmissions =
    domesticFlights      * getFactor('travel', 'domestic_flight') +
    internationalFlights * getFactor('travel', 'international_flight') +
    trainTrips           * getFactor('travel', 'train_trip');

  // ── Total ──
  const total = [
    transportEmissions, electricityEmissions, waterEmissions, foodEmissions,
    wasteEmissions, shoppingEmissions, travelEmissions,
  ].reduce((sum, v) => sum + v, 0);

  // ── Eco Score (0-100, deterministic) ──
  // Baseline: 0 kg → score 100; ≥2000 kg → score 0
  const MAX = 2000.0;
  const ecoScore = Math.max(0, Math.min(100, +(100 - (total / MAX) * 100).toFixed(1)));

  // ── Eco Level label ──
  let ecoLevel;
  if (ecoScore >= 80)      ecoLevel = 'Eco Champion';
  else if (ecoScore >= 60) ecoLevel = 'Eco Conscious';
  else if (ecoScore >= 40) ecoLevel = 'Needs Improvement';
  else                     ecoLevel = 'High Carbon Impact';

  // ── Highest-emission category ──
  const categoryMap = {
    transportation: transportEmissions,
    electricity:    electricityEmissions,
    water:          waterEmissions,
    food:           foodEmissions,
    waste:          wasteEmissions,
    shopping:       shoppingEmissions,
    travel:         travelEmissions,
  };
  const highestCategory = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    breakdown: {
      transportation: +transportEmissions.toFixed(2),
      electricity:    +electricityEmissions.toFixed(2),
      water:          +waterEmissions.toFixed(2),
      food:           +foodEmissions.toFixed(2),
      waste:          +wasteEmissions.toFixed(2),
      shopping:       +shoppingEmissions.toFixed(2),
      travel:         +travelEmissions.toFixed(2),
    },
    total_emissions: +total.toFixed(2),
    eco_score:       ecoScore,
    eco_level:       ecoLevel,
    highest_category: highestCategory,
    input_snapshot: {
      transport_mode:       transportMode,
      transport_km:         transportKm,
      electricity_kwh:      electricityKwh,
      renewable_pct:        clampNum(input.renewable_pct, 0, 100),
      water_litres_per_day: waterLitresPerDay,
      water_days:           waterDays,
      diet_type:            dietType,
      waste_kg:             wasteKg,
      recycling_pct:        clampNum(input.recycling_pct, 0, 100),
      clothing_items:       clothingItems,
      electronics_items:    electronicsItems,
      general_items:        generalItems,
      domestic_flights:     domesticFlights,
      international_flights:internationalFlights,
      train_trips:          trainTrips,
    },
  };
}

// ─────────────────────────────────────────────
// Database Operations
// ─────────────────────────────────────────────

async function saveCalculation(userId, result, accessToken) {
  const record = {
    user_id:                    userId,
    transportation_emissions:   result.breakdown.transportation,
    electricity_emissions:      result.breakdown.electricity,
    water_emissions:            result.breakdown.water,
    food_emissions:             result.breakdown.food,
    waste_emissions:            result.breakdown.waste,
    shopping_emissions:         result.breakdown.shopping,
    travel_emissions:           result.breakdown.travel,
    total_emissions:            result.total_emissions,
    eco_score:                  result.eco_score,
    input_data:                 result.input_snapshot,
  };

  const client = accessToken ? getUserClient(accessToken) : supabaseAdmin;
  const { data, error } = await client.from('carbon_calculations').insert(record).select().single();
  if (error) throw new Error(`DB insert failed: ${error.message}`);
  return data;
}

async function getCalculations(userId, accessToken, limit = 50) {
  const client = accessToken ? getUserClient(accessToken) : supabaseAdmin;
  const { data, error } = await client
    .from('carbon_calculations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

async function getCalculationById(userId, calcId, accessToken) {
  const client = accessToken ? getUserClient(accessToken) : supabaseAdmin;
  const { data, error } = await client
    .from('carbon_calculations')
    .select('*')
    .eq('id', calcId)
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}

async function deleteCalculation(userId, calcId, accessToken) {
  const client = accessToken ? getUserClient(accessToken) : supabaseAdmin;
  const { error } = await client
    .from('carbon_calculations')
    .delete()
    .eq('id', calcId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

async function deleteAllCalculations(userId, accessToken) {
  const client = accessToken ? getUserClient(accessToken) : supabaseAdmin;
  const { error } = await client
    .from('carbon_calculations')
    .delete()
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

module.exports = {
  computeEmissions,
  saveCalculation,
  getCalculations,
  getCalculationById,
  deleteCalculation,
  deleteAllCalculations,
};
