const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');

// إضافة رد على شكوى
router.post('/add', responseController.addResponse);

// جلب جميع الردود لشكوى محددة
router.get('/responses/:complaintId', responseController.getComplaintResponses);

// تغيير حالة الشكوى
router.put('/status/:complaintId', responseController.updateComplaintStatus);

// جلب سجل التاريخ لشكوى محددة
router.get('/history/:complaintId', responseController.getComplaintHistory);

// جلب الحالات المتاحة
router.get('/statuses', responseController.getAvailableStatuses);

// جلب أنواع الردود المتاحة
router.get('/response-types', responseController.getResponseTypes);

module.exports = router; 