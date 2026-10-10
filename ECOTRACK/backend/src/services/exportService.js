'use strict';
const { supabaseAdmin, getUserClient } = require('../config/supabase');
const { stringify } = require('csv-stringify/sync');
const PDFDocument = require('pdfkit');

// ─────────────────────────────────────────────
// CSV Export
// ─────────────────────────────────────────────

function toCsvBuffer(records) {
  const rows = records.map(r => ({
    Date:          r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
    'Total (kg)':  r.total_emissions ?? 0,
    'Eco Score':   r.eco_score ?? 0,
    Transport:     r.transportation_emissions ?? 0,
    Electricity:   r.electricity_emissions ?? 0,
    Water:         r.water_emissions ?? 0,
    Food:          r.food_emissions ?? 0,
    Waste:         r.waste_emissions ?? 0,
    Shopping:      r.shopping_emissions ?? 0,
    Travel:        r.travel_emissions ?? 0,
  }));

  return Buffer.from(
    stringify(rows, { header: true, cast: { number: v => v.toFixed(2) } })
  );
}

// ─────────────────────────────────────────────
// PDF Export
// ─────────────────────────────────────────────

function toPdfBuffer(records) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(18).fillColor('#10b981').text('EcoTrack — Carbon Footprint History', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1.5);

    if (records.length === 0) {
      doc.fontSize(12).fillColor('#333').text('No calculation records found.');
    } else {
      records.forEach((r, i) => {
        doc.fontSize(12).fillColor('#1e293b')
          .text(`#${i + 1}  ${r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'}`, { underline: true });

        doc.fontSize(10).fillColor('#334155')
          .text(`Total Emissions: ${Number(r.total_emissions ?? 0).toFixed(2)} kg CO₂e  |  Eco Score: ${r.eco_score ?? 'N/A'}/100`);

        const cats = [
          ['Transportation', r.transportation_emissions],
          ['Electricity',    r.electricity_emissions],
          ['Water',          r.water_emissions],
          ['Food',           r.food_emissions],
          ['Waste',          r.waste_emissions],
          ['Shopping',       r.shopping_emissions],
          ['Travel',         r.travel_emissions],
        ];
        cats.forEach(([k, v]) => {
          doc.fontSize(9).fillColor('#475569').text(`  • ${k}: ${Number(v ?? 0).toFixed(2)} kg`);
        });
        doc.moveDown(0.8);
      });
    }

    doc.end();
  });
}

// ─────────────────────────────────────────────
// Supabase Storage Helpers
// ─────────────────────────────────────────────

async function uploadToStorage(bucket, path, buffer, mimeType, accessToken) {
  const client = accessToken ? getUserClient(accessToken) : supabaseAdmin;
  const { data, error } = await client.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: { publicUrl } } = client.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

async function deleteFromStorage(bucket, path, accessToken) {
  const client = accessToken ? getUserClient(accessToken) : supabaseAdmin;
  const { error } = await client.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}

module.exports = { toCsvBuffer, toPdfBuffer, uploadToStorage, deleteFromStorage };
