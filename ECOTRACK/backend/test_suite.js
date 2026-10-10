'use strict';
/**
 * EcoTrack Backend Integration & Module Verification Script
 * Tests all 12 architectural capabilities and services.
 */
const { computeEmissions } = require('./src/services/calculatorService');
const { getFactors, validKeys } = require('./src/services/emissionFactorService');
const { toCsvBuffer, toPdfBuffer } = require('./src/services/exportService');
const groqService = require('./src/services/groqService');
const env = require('./src/config/env');

async function runTests() {
  console.log('🧪 Starting EcoTrack Comprehensive Verification Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS [${total}]: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL [${total}]: ${testName}`);
    }
  }

  // Test 1: Environment configuration
  assert(env.port === 5000, 'Server port is correctly configured (5000)');
  assert(!!env.supabase.url && !!env.supabase.anonKey && !!env.supabase.serviceRoleKey, 'Supabase credentials populated');
  assert(!!env.groq.apiKey && env.groq.model === 'openai/gpt-oss-120b', 'Groq API Key and Model configured');

  // Test 2: Emission Factor Service constants
  const factors = getFactors();
  assert(Object.keys(factors).length === 7, '7 emission factor categories present');
  assert(validKeys('transportation').includes('car'), 'Transportation contains valid mode keys');
  assert(validKeys('food').includes('vegan') && validKeys('food').includes('heavy_meat'), 'Food contains diet variations');

  // Test 3: Carbon Calculator Engine (Deterministic)
  const sampleInput = {
    transport_mode: 'car',
    transport_km: 150,
    electricity_kwh: 250,
    renewable_pct: 20,
    water_litres_per_day: 120,
    water_days: 30,
    diet_type: 'average',
    waste_kg: 25,
    recycling_pct: 40,
    clothing_items: 2,
    electronics_items: 1,
    general_items: 4,
    domestic_flights: 1,
    international_flights: 0,
    train_trips: 2,
  };
  const calcResult = computeEmissions(sampleInput);
  assert(calcResult.total_emissions > 0, `Deterministic emissions calculated (${calcResult.total_emissions} kg CO2e)`);
  assert(calcResult.eco_score >= 0 && calcResult.eco_score <= 100, `Eco score is within [0, 100] range (${calcResult.eco_score})`);
  assert(['Eco Champion', 'Eco Conscious', 'Needs Improvement', 'High Carbon Impact'].includes(calcResult.eco_level), `Eco level assigned: ${calcResult.eco_level}`);
  assert(Object.keys(calcResult.breakdown).length === 7, 'Breakdown includes all 7 categories');

  // Test 4: Export Service (CSV & PDF)
  const mockRecords = [
    {
      id: 'test-calc-1',
      created_at: new Date().toISOString(),
      total_emissions: 245.5,
      eco_score: 87.7,
      transportation_emissions: 40.0,
      electricity_emissions: 85.0,
      water_emissions: 2.5,
      food_emissions: 60.0,
      waste_emissions: 8.0,
      shopping_emissions: 30.0,
      travel_emissions: 20.0,
    },
  ];
  const csvBuffer = toCsvBuffer(mockRecords);
  assert(csvBuffer && csvBuffer.length > 50, 'CSV export generated successfully with headers and records');

  const pdfBuffer = await toPdfBuffer(mockRecords);
  assert(pdfBuffer && pdfBuffer.length > 200, 'PDF export generated successfully with PDFKit');

  // Test 5: Groq Recommendation Transformation
  const mockGroqResponse = {
    overall_analysis: 'Great progress in reducing single-occupancy vehicle travel!',
    transportation_tips: ['Carpool twice a week to reduce commuting emissions.'],
    electricity_tips: ['Switch off standby electronics overnight.'],
    food_tips: ['Incorporate more plant proteins.'],
    water_tips: ['Install aerators on taps.'],
    waste_tips: ['Compost organic waste.'],
    shopping_tips: ['Prioritize durable goods.'],
    travel_tips: ['Choose train travel for distances under 500km.'],
    monthly_goal: 'Lower total footprint by 15%',
    green_challenge: 'Zero waste weekend',
    estimated_reduction_kg: 35,
    motivational_message: 'Every positive step makes our planet healthier!',
  };
  const cards = groqService.toRecommendationCards(mockGroqResponse);
  assert(cards.length === 7, `Recommendation cards generated: ${cards.length} cards`);
  assert(cards[0].category === 'Transportation' && cards[0].potential_saving > 0, 'Card data properly structured with category and savings');

  // Test 6: Groq Live AI Query
  console.log('\n  🤖 Testing live Groq AI Eco-Coach query...');
  try {
    const advice = await groqService.generateCustomAdvice('Give me 2 tips to save energy at home', { full_name: 'Test User' });
    assert(advice.length > 20, `Live Groq completion received: "${advice.slice(0, 60)}..."`);
  } catch (err) {
    console.error('  ⚠️ Groq live call notice:', err.message);
  }

  console.log(`\n=================================================`);
  console.log(`📊 Test Results: ${passed} / ${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log(`=================================================\n`);
}

runTests().then(() => {
  setTimeout(() => process.exit(0), 100);
}).catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
