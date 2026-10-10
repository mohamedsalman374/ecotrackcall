'use strict';
const { supabaseAdmin, getUserClient } = require('../config/supabase');
const { uploadToStorage } = require('../services/exportService');
const { v4: uuidv4 } = require('uuid');

const SCREENSHOT_BUCKET = 'feedback-images';

// POST /api/v1/feedback
async function submitFeedback(req, res, next) {
  try {
    const { category, rating, subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, error: 'subject and message are required.' });
    }

    const validCategories = ['general', 'bug_report', 'feature_request', 'emission_accuracy', 'ui_ux'];
    const cat  = validCategories.includes(category) ? category : 'general';
    const rate = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

    let screenshot_url = null;
    if (req.file) {
      const ext  = req.file.mimetype.split('/')[1] || 'png';
      const path = `${req.user.id}/feedback_${uuidv4()}.${ext}`;
      screenshot_url = await uploadToStorage(SCREENSHOT_BUCKET, path, req.file.buffer, req.file.mimetype);
    }

    const record = {
      user_id:        req.user.id,
      category:       cat,
      rating:         rate,
      subject:        subject.slice(0, 200),
      message:        message.slice(0, 2000),
      screenshot_url,
      status:         'pending',
    };

    const { data, error } = await supabaseAdmin.from('feedback').insert(record).select().single();
    if (error) throw new Error(error.message);

    return res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/feedback/my
async function getMyFeedback(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .select('id, category, rating, subject, message, screenshot_url, status, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/feedback/:id
async function deleteFeedback(req, res, next) {
  try {
    // Ensure user owns this feedback
    const { data: existing } = await supabaseAdmin
      .from('feedback').select('user_id').eq('id', req.params.id).single();

    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Feedback not found.' });
    }

    await supabaseAdmin.from('feedback').delete().eq('id', req.params.id);
    return res.json({ success: true, message: 'Feedback deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitFeedback, getMyFeedback, deleteFeedback };
