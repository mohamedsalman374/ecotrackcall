'use strict';
const { supabaseAdmin, getUserClient } = require('../config/supabase');
const { uploadToStorage, deleteFromStorage } = require('../services/exportService');
const { v4: uuidv4 } = require('uuid');

const AVATAR_BUCKET = 'profile-images';

// GET /api/v1/profile
async function getProfile(req, res, next) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);

    // Return sensible default if profile not yet created
    const out = profile || { id: req.user.id, full_name: '', role: 'user', is_active: true };
    return res.json({ success: true, profile: out });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/profile
async function updateProfile(req, res, next) {
  try {
    const allowed = ['full_name', 'dietary_preference', 'primary_transport', 'theme', 'language',
                     'email_notifications', 'weekly_reminder', 'monthly_reminder'];
    const updates = {};
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k];
    }

    // Prevent role/is_active changes via this endpoint
    delete updates.role;
    delete updates.is_active;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: req.user.id, ...updates }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return res.json({ success: true, profile: data });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/profile/avatar  (multipart/form-data, field: avatar)
async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image file provided.' });

    const ext      = req.file.mimetype.split('/')[1] || 'jpg';
    const filename = `${req.user.id}/avatar_${uuidv4()}.${ext}`;

    // Delete old avatar if stored
    const { data: existing } = await supabaseAdmin
      .from('profiles').select('profile_image_url').eq('id', req.user.id).single();
    if (existing?.profile_image_url) {
      try {
        const oldPath = existing.profile_image_url.split(`${AVATAR_BUCKET}/`)[1];
        if (oldPath) await deleteFromStorage(AVATAR_BUCKET, oldPath);
      } catch { /* ignore old file deletion failure */ }
    }

    const publicUrl = await uploadToStorage(AVATAR_BUCKET, filename, req.file.buffer, req.file.mimetype);

    await supabaseAdmin
      .from('profiles')
      .update({ profile_image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', req.user.id);

    return res.json({ success: true, avatar_url: publicUrl });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/profile/avatar
async function deleteAvatar(req, res, next) {
  try {
    const { data: existing } = await supabaseAdmin
      .from('profiles').select('profile_image_url').eq('id', req.user.id).single();

    if (existing?.profile_image_url) {
      const oldPath = existing.profile_image_url.split(`${AVATAR_BUCKET}/`)[1];
      if (oldPath) await deleteFromStorage(AVATAR_BUCKET, oldPath);
    }

    await supabaseAdmin
      .from('profiles')
      .update({ profile_image_url: null, updated_at: new Date().toISOString() })
      .eq('id', req.user.id);

    return res.json({ success: true, message: 'Avatar removed.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/profile/change-password
async function changePassword(req, res, next) {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ success: false, error: 'new_password must be at least 6 characters.' });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
      password: new_password,
    });
    if (error) throw new Error(error.message);

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, uploadAvatar, deleteAvatar, changePassword };
