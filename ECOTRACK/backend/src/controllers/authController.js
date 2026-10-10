'use strict';
const { supabaseAdmin, getUserClient } = require('../config/supabase');

// POST /api/v1/auth/signup
async function signup(req, res, next) {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, error: 'email, password, and full_name are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      email_confirm: false,
    });
    if (error) return res.status(400).json({ success: false, error: error.message });

    // Ensure profile row exists
    await supabaseAdmin.from('profiles').upsert({
      id:         data.user.id,
      full_name,
      role:       'user',
      is_active:  true,
    }, { onConflict: 'id' });

    return res.status(201).json({ success: true, message: 'Account created. Please sign in.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/auth/login — handled client-side via Supabase SDK; backend returns profile
async function getMe(req, res, next) {
  try {
    const user    = req.user;
    const profile = req.profile;
    return res.json({ success: true, user: { id: user.id, email: user.email }, profile });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/auth/forgot-password
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });
    // We acknowledge regardless to prevent user enumeration
    return res.json({ success: true, message: 'If that email exists, a password reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, getMe, forgotPassword };
