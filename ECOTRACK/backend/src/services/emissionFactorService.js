'use strict';

/**
 * Deterministic Emission Factor Service (JavaScript port of the Python implementation).
 * Sources: EPA, DEFRA, and IPCC baseline values.
 * Units are specified per category.
 *
 * CRITICAL: These are the authoritative emission constants.
 * Groq AI must NOT recalculate these values — only the backend engine does.
 */

const FACTORS = {
  transportation: {
    // kg CO2e per km
    car:         { value: 0.192, desc: 'Average Petrol/Gasoline Car' },
    diesel_car:  { value: 0.171, desc: 'Average Diesel Car' },
    hybrid_car:  { value: 0.110, desc: 'Hybrid Vehicle' },
    electric_car:{ value: 0.053, desc: 'Electric Vehicle (grid average)' },
    motorcycle:  { value: 0.103, desc: 'Motorcycle / Scooter' },
    bus:         { value: 0.089, desc: 'Local Public Bus' },
    train:       { value: 0.041, desc: 'Transit / Commuter Train' },
    bicycle:     { value: 0.000, desc: 'Bicycle (zero emission)' },
    walking:     { value: 0.000, desc: 'Walking (zero emission)' },
  },
  electricity: {
    // kg CO2e per kWh
    grid_average: { value: 0.475, desc: 'Global average grid electricity' },
  },
  water: {
    // kg CO2e per litre
    tap_water: { value: 0.0003, desc: 'Municipal tap water supply' },
  },
  food: {
    // kg CO2e per day
    vegan:       { value: 1.5, desc: 'Vegan — 100% plant-based' },
    vegetarian:  { value: 1.7, desc: 'Vegetarian — dairy/eggs included' },
    pescatarian: { value: 1.9, desc: 'Pescatarian — fish, no meat' },
    low_meat:    { value: 2.1, desc: 'Low meat — 1-2 times/week' },
    average:     { value: 2.5, desc: 'Average mixed omnivore diet' },
    heavy_meat:  { value: 3.3, desc: 'Heavy meat — daily/multiple meals' },
  },
  waste: {
    // kg CO2e per kg of waste
    landfill: { value: 0.5, desc: 'General waste sent to landfill' },
    recycled:  { value: 0.1, desc: 'Recycled or composted waste' },
  },
  shopping: {
    // kg CO2e per item purchased
    clothing:    { value: 15.0, desc: 'Average clothing item' },
    electronics: { value: 50.0, desc: 'Average consumer electronic device' },
    general:     { value: 10.0, desc: 'General consumer goods' },
  },
  travel: {
    // kg CO2e per trip (round-trip)
    domestic_flight:     { value: 250.0,  desc: 'Short-haul domestic flight' },
    international_flight:{ value: 1000.0, desc: 'Long-haul international flight' },
    train_trip:          { value: 50.0,   desc: 'Intercity train journey' },
  },
};

/**
 * Retrieve a single factor value safely.
 * Returns 0 if category/key is not found.
 */
function getFactor(category, key) {
  const cat = FACTORS[category];
  if (!cat) return 0;
  const entry = cat[key];
  return entry ? entry.value : 0;
}

/**
 * Return entire factor table for a given category (or all).
 */
function getFactors(category) {
  if (category) return FACTORS[category] || {};
  return FACTORS;
}

/**
 * Return the valid key list for a category (for input validation).
 */
function validKeys(category) {
  return Object.keys(FACTORS[category] || {});
}

module.exports = { FACTORS, getFactor, getFactors, validKeys };
