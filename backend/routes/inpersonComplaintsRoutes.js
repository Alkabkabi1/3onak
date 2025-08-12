const express = require('express');
const router = express.Router();
const inpersonComplaintsController = require('../controllers/inpersonComplaintsController');

// جلب إحصائيات الشكاوى الحضورية
router.get('/stats', inpersonComplaintsController.getInPersonComplaintsStats);

// تصدير بيانات الشكاوى الحضورية
router.get('/export-data', inpersonComplaintsController.exportInPersonComplaintsData);

module.exports = router; 