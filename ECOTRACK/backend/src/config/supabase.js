'use strict';
const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

// Anon client — for user-scoped requests (respects RLS)
const supabaseAnon = createClient(env.supabase.url, env.supabase.anonKey);

// Service-role client — for privileged server-side operations (bypasses RLS)
const supabaseAdmin = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Returns a Supabase client authenticated as the calling user.
 * The access token is the user's JWT from Supabase Auth.
 */
function getUserClient(accessToken) {
  const client = createClient(env.supabase.url, env.supabase.anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

module.exports = { supabaseAnon, supabaseAdmin, getUserClient };
