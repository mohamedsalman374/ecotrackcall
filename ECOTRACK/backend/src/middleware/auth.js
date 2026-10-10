'use strict';
const { supabaseAdmin } = require('../config/supabase');

/**
 * JWT Bearer token authentication middleware.
 * Validates the user's Supabase access token and attaches user + profile to req.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Missing or malformed Authorization header.' });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token is required.' });
    }

    // Verify token against Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired access token.' });
    }

    // Fetch user profile (role, is_active)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, is_active, profile_image_url')
      .eq('id', user.id)
      .single();

    if (profileErr && profileErr.code !== 'PGRST116') {
      // PGRST116 = row not found — tolerate if profile hasn't been created yet
      console.error('[auth] Profile fetch error:', profileErr.message);
    }

    if (profile && profile.is_active === false) {
      return res.status(403).json({ success: false, error: 'This account has been suspended.' });
    }

    req.user = user;
    req.token = token;
    req.profile = profile || null;
    next();
  } catch (err) {
    console.error('[auth] Unexpected error:', err.message);
    return res.status(500).json({ success: false, error: 'Authentication service error.' });
  }
}

module.exports = { requireAuth };
