const express = require('express');
const router = express.Router();
const generalComplaintsController = require('../controllers/generalComplaintsController');

// جلب إحصائيات الشكاوى العامة
router.get('/stats', generalComplaintsController.getGeneralComplaintsStats);

// تصدير بيانات الشكاوى العامة
router.get('/export-data', generalComplaintsController.exportGeneralComplaintsData);

module.exports = router; 