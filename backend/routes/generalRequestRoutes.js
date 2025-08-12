const express = require('express');
const router = express.Router();
const generalRequestController = require('../controllers/generalRequestController');

// فحص البيانات الموجودة
router.get('/check-data', generalRequestController.checkExistingData);

// جلب إحصائيات الطلبات العامة
router.get('/stats', generalRequestController.getGeneralRequestStats);

// جلب أنواع الطلبات المتاحة
router.get('/request-types', generalRequestController.getAvailableRequestTypes);

// جلب بيانات الطلبات العامة للتصدير
router.get('/export-data', generalRequestController.getGeneralRequestsForExport);

// جلب التحليل والاقتراحات
router.get('/analysis', generalRequestController.getGeneralRequestAnalysis);

// إضافة طلب جديد
router.post('/add', generalRequestController.addGeneralRequest);

// تحديث حالة الطلب
router.put('/:RequestID/status', generalRequestController.updateRequestStatus);

module.exports = router; 