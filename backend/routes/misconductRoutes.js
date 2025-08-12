const express = require('express');
const router = express.Router();
const misconductController = require('../controllers/misconductController');

// جلب إحصائيات بلاغات سوء التعامل
router.get('/stats', misconductController.getMisconductStats);

// تصدير بيانات بلاغات سوء التعامل كملف Excel
router.get('/export-data', misconductController.exportMisconductData);

module.exports = router; 