const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');

// تطبيق middleware للتحقق من الصلاحيات على جميع routes
router.use(logsController.checkUserPermissions);
router.use(logsController.checkAdminPermissions);

// جلب جميع السجلات مع الفلاتر والتصفح
router.get('/', logsController.getAllLogs);

// تصدير السجلات
router.get('/export', logsController.exportLogs);

// حذف السجلات القديمة
router.delete('/old', logsController.deleteOldLogs);

// حذف سجل محدد
router.delete('/:logId', logsController.deleteLog);

module.exports = router; 