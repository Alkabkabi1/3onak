const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');

// جلب جميع الشكاوى (مع التحقق من الصلاحيات)
router.get('/all', complaintController.checkUserPermissions, complaintController.getAllComplaints);

// جلب شكاوى المستخدم الشخصية (للمستخدمين العاديين فقط)
router.get('/my-complaints', complaintController.checkUserPermissions, complaintController.getUserComplaints);

// جلب جميع الأقسام
router.get('/departments', complaintController.getDepartments);

// جلب أنواع الشكاوى الرئيسية
router.get('/types', complaintController.getComplaintTypes);

// جلب التصنيفات الفرعية حسب النوع الرئيسي
router.get('/subtypes/:complaintTypeID', complaintController.getSubTypes);

// جلب جميع شكاوى المريض
router.get('/patient/:nationalId', complaintController.getPatientComplaints);

// التحقق من هوية المريض
router.get('/verify-patient/:nationalId', complaintController.verifyPatientIdentity);

// جلب تفاصيل شكوى محددة
router.get('/details/:complaintId', complaintController.getComplaintDetails);

// حفظ شكوى جديدة مع المرفقات
router.post('/submit', complaintController.checkUserPermissions, complaintController.upload.array('attachments', 5), complaintController.submitComplaint);

// تحديث حالة الشكوى
router.put('/update-status/:complaintId', complaintController.updateComplaintStatus);

module.exports = router; 