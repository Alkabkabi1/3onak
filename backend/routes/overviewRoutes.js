const express = require('express');
const router = express.Router();
const overviewController = require('../controllers/overviewController');

// جلب إحصائيات النظرة العامة
router.get('/stats', overviewController.getOverviewStats);

// تصدير بيانات النظرة العامة
router.get('/export-data', overviewController.exportOverviewData);

module.exports = router; 