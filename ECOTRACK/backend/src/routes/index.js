'use strict';
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { uploadAvatar } = require('../middleware/upload');
const { uploadScreenshot } = require('../middleware/upload');

const health      = require('../controllers/healthController');
const auth        = require('../controllers/authController');
const dashboard   = require('../controllers/dashboardController');
const calculator  = require('../controllers/calculatorController');
const ai          = require('../controllers/aiController');
const analytics   = require('../controllers/analyticsController');
const history     = require('../controllers/historyController');
const profile     = require('../controllers/profileController');
const feedback    = require('../controllers/feedbackController');
const admin       = require('../controllers/adminController');

// ── Health ──────────────────────────────────────────────────────────
router.get('/health', health.getHealth);

// ── Auth (mixed) ─────────────────────────────────────────────────────
router.post('/auth/signup',          auth.signup);
router.get( '/auth/me',              requireAuth, auth.getMe);
router.post('/auth/forgot-password', auth.forgotPassword);

// ── Dashboard ────────────────────────────────────────────────────────
router.get('/dashboard/summary',     requireAuth, dashboard.getSummary);

// ── Calculator ───────────────────────────────────────────────────────
router.get( '/calculator/factors',   calculator.getEmissionFactors);
router.post('/calculator/calculate', requireAuth, calculator.calculate);
router.get( '/calculator/latest',    requireAuth, calculator.getLatest);
router.get( '/calculator/:id',       requireAuth, calculator.getById);

// ── AI Recommendations ───────────────────────────────────────────────
router.get( '/ai/recommendations',         requireAuth, ai.listRecommendations);
router.get( '/ai/recommendations/latest',  requireAuth, ai.getLatestRecommendation);
router.post('/ai/recommendations/generate',requireAuth, ai.generateRecommendations);
router.post('/ai/generate',                requireAuth, ai.customAdvice);

// ── Analytics ────────────────────────────────────────────────────────
router.get('/analytics', requireAuth, analytics.getAnalytics);

// ── History ──────────────────────────────────────────────────────────
router.get(   '/history',              requireAuth, history.listHistory);
router.get(   '/history/export/csv',   requireAuth, history.exportCsv);
router.get(   '/history/export/pdf',   requireAuth, history.exportPdf);
router.post(  '/history/batch-delete', requireAuth, history.batchDeleteHistory);
router.post(  '/history/delete-all',   requireAuth, history.deleteAllHistory);
router.delete('/history/all',          requireAuth, history.deleteAllHistory);
router.get(   '/history/:id',          requireAuth, history.getHistoryItem);
router.delete('/history/:id',          requireAuth, history.deleteHistoryItem);

// ── Profile ──────────────────────────────────────────────────────────
router.get(   '/profile',                 requireAuth, profile.getProfile);
router.put(   '/profile',                 requireAuth, profile.updateProfile);
router.post(  '/profile/avatar',          requireAuth, uploadAvatar.single('avatar'), profile.uploadAvatar);
router.delete('/profile/avatar',          requireAuth, profile.deleteAvatar);
router.post(  '/profile/change-password', requireAuth, profile.changePassword);

// ── Feedback ─────────────────────────────────────────────────────────
router.post(  '/feedback',    requireAuth, uploadScreenshot.single('screenshot'), feedback.submitFeedback);
router.get(   '/feedback/my', requireAuth, feedback.getMyFeedback);
router.delete('/feedback/:id',requireAuth, feedback.deleteFeedback);

// ── Admin ────────────────────────────────────────────────────────────
router.get('/admin/stats',                    requireAuth, requireAdmin, admin.getStats);
router.get('/admin/users',                    requireAuth, requireAdmin, admin.getUsers);
router.put('/admin/users/:id/role',           requireAuth, requireAdmin, admin.setUserRole);
router.put('/admin/users/:id/status',         requireAuth, requireAdmin, admin.setUserStatus);
router.get('/admin/calculations',             requireAuth, requireAdmin, admin.getCalculations);
router.get('/admin/feedback',                 requireAuth, requireAdmin, admin.getFeedback);
router.put('/admin/feedback/:id/status',      requireAuth, requireAdmin, admin.updateFeedbackStatus);
router.get('/admin/export/analytics',         requireAuth, requireAdmin, admin.exportAnalytics);

module.exports = router;
