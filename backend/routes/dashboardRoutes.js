const express = require('express');

const verifyToken = require('../middleware/verifyToken');
const { getDashboardSummary } = require('../controllers/dashboardController');
const { getDashboardAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/summary', verifyToken, getDashboardSummary);
router.get('/analytics', verifyToken, getDashboardAnalytics);

module.exports = router;

