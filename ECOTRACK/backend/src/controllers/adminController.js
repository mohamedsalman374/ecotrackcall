'use strict';
const { supabaseAdmin } = require('../config/supabase');
const { toCsvBuffer } = require('../services/exportService');

// GET /api/v1/admin/stats
async function getStats(req, res, next) {
  try {
    const [usersRes, calcsRes, feedbackRes, co2Res] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('carbon_calculations').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('feedback').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('carbon_calculations').select('total_emissions'),
    ]);

    const totalCo2 = (co2Res.data || []).reduce((s, r) => s + Number(r.total_emissions || 0), 0);

    return res.json({
      success: true,
      total_users:        usersRes.count || 0,
      total_calculations: calcsRes.count || 0,
      total_feedback:     feedbackRes.count || 0,
      total_co2_kg:       +totalCo2.toFixed(2),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/users
async function getUsers(req, res, next) {
  try {
    const search = req.query.search || '';
    let query = supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, is_active, profile_image_url, created_at')
      .order('created_at', { ascending: false });

    if (search) query = query.ilike('full_name', `%${search}%`);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Fetch emails from auth.users
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailMap = Object.fromEntries((authUsers?.users || []).map(u => [u.id, u.email]));

    const merged = (data || []).map(p => ({ ...p, email: emailMap[p.id] || '' }));
    return res.json({ success: true, users: merged });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/admin/users/:id/role
async function setUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: "role must be 'user' or 'admin'." });
    }
    // Prevent self-demotion
    if (id === req.user.id && role !== 'admin') {
      return res.status(400).json({ success: false, error: 'You cannot change your own admin role.' });
    }
    const { error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', id);
    if (error) throw new Error(error.message);
    return res.json({ success: true, message: `User role updated to '${role}'.` });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/admin/users/:id/status
async function setUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const is_active = req.body.is_active === true || req.body.is_active === 'true';
    const { error } = await supabaseAdmin.from('profiles').update({ is_active }).eq('id', id);
    if (error) throw new Error(error.message);
    return res.json({ success: true, message: `Account ${is_active ? 'activated' : 'suspended'}.` });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/calculations
async function getCalculations(req, res, next) {
  try {
    const page  = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const from  = (page - 1) * limit;

    const { data, count, error } = await supabaseAdmin
      .from('carbon_calculations')
      .select('*, profiles(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);
    return res.json({ success: true, data: data || [], total: count || 0, page, limit });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/feedback
async function getFeedback(req, res, next) {
  try {
    const status = req.query.status;
    let query = supabaseAdmin
      .from('feedback')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });

    if (status && ['pending', 'reviewed', 'resolved'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/admin/feedback/:id/status
async function updateFeedbackStatus(req, res, next) {
  try {
    const valid = ['pending', 'reviewed', 'resolved'];
    const { status } = req.body;
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of: ${valid.join(', ')}.` });
    }
    const { error } = await supabaseAdmin.from('feedback').update({ status }).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    return res.json({ success: true, message: `Feedback status updated to '${status}'.` });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/export/analytics
async function exportAnalytics(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('carbon_calculations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const buf = toCsvBuffer(data || []);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="ecotrack_platform_analytics_${new Date().toISOString().slice(0,10)}.csv"`,
    });
    return res.send(buf);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats, getUsers, setUserRole, setUserStatus,
  getCalculations, getFeedback, updateFeedbackStatus, exportAnalytics,
};
