const pool = require('../config/database');

// إضافة رد على شكوى
const addResponse = async (req, res) => {
  try {
    const { complaintId, responseText, employeeId = 1, responseType = 'رد رسمي' } = req.body;

    if (!complaintId || !responseText) {
      return res.status(400).json({
        success: false,
        message: 'معرف الشكوى ونص الرد مطلوبان'
      });
    }

    // التحقق من وجود الشكوى
    const [complaintCheck] = await pool.execute(
      'SELECT ComplaintID, CurrentStatus FROM Complaints WHERE ComplaintID = ?',
      [complaintId]
    );

    if (complaintCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الشكوى غير موجودة'
      });
    }

    // إضافة الرد إلى جدول ComplaintResponses
    const [responseResult] = await pool.execute(
      `INSERT INTO ComplaintResponses (ComplaintID, EmployeeID, ResponseText, ResponseType, ResponseDate) 
       VALUES (?, ?, ?, ?, NOW())`,
      [complaintId, employeeId, responseText, responseType]
    );

    // تحديث حالة الشكوى
    const newStatus = responseType === 'رد رسمي' ? 'تم الرد' : 'قيد المعالجة';
    await pool.execute(
      'UPDATE Complaints SET CurrentStatus = ? WHERE ComplaintID = ?',
      [newStatus, complaintId]
    );

    // إضافة سجل في التاريخ
    await pool.execute(
      `INSERT INTO ComplaintHistory (ComplaintID, EmployeeID, Stage, Timestamp, Remarks, OldStatus, NewStatus) 
       VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
      [complaintId, employeeId, 'إضافة رد', `تم إضافة رد: ${responseText.substring(0, 50)}...`, complaintCheck[0].CurrentStatus, newStatus]
    );

    res.status(201).json({
      success: true,
      message: 'تم إضافة الرد بنجاح',
      data: {
        responseId: responseResult.insertId,
        complaintId: complaintId,
        status: newStatus
      }
    });

  } catch (error) {
    console.error('خطأ في إضافة الرد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب جميع الردود لشكوى محددة
const getComplaintResponses = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const [responses] = await pool.execute(
      `SELECT 
        cr.ResponseID,
        cr.ResponseText,
        cr.ResponseType,
        cr.ResponseDate,
        e.FullName as EmployeeName,
        e.EmployeeID
       FROM ComplaintResponses cr
       JOIN Employees e ON cr.EmployeeID = e.EmployeeID
       WHERE cr.ComplaintID = ?
       ORDER BY cr.ResponseDate DESC`,
      [complaintId]
    );

    res.json({
      success: true,
      data: responses
    });

  } catch (error) {
    console.error('خطأ في جلب الردود:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// تغيير حالة الشكوى
const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { newStatus, employeeId = 1, notes = '' } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: 'الحالة الجديدة مطلوبة'
      });
    }

    // التحقق من وجود الشكوى
    const [complaintCheck] = await pool.execute(
      'SELECT ComplaintID, CurrentStatus FROM Complaints WHERE ComplaintID = ?',
      [complaintId]
    );

    if (complaintCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الشكوى غير موجودة'
      });
    }

    const oldStatus = complaintCheck[0].CurrentStatus;

    // تحديث حالة الشكوى
    await pool.execute(
      'UPDATE Complaints SET CurrentStatus = ? WHERE ComplaintID = ?',
      [newStatus, complaintId]
    );

    // إضافة سجل في التاريخ
    await pool.execute(
      `INSERT INTO ComplaintHistory (ComplaintID, EmployeeID, Stage, Timestamp, Remarks, OldStatus, NewStatus) 
       VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
      [complaintId, employeeId, 'تغيير الحالة', `تم تغيير الحالة من "${oldStatus}" إلى "${newStatus}"${notes ? ` - ملاحظات: ${notes}` : ''}`, oldStatus, newStatus]
    );

    res.json({
      success: true,
      message: 'تم تحديث حالة الشكوى بنجاح',
      data: {
        complaintId: complaintId,
        oldStatus: oldStatus,
        newStatus: newStatus
      }
    });

  } catch (error) {
    console.error('خطأ في تحديث حالة الشكوى:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب سجل التاريخ لشكوى محددة
const getComplaintHistory = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const [history] = await pool.execute(
      `SELECT 
        ch.HistoryID,
        ch.Stage as Action,
        ch.Timestamp as ActionDate,
        ch.Remarks as Details,
        e.FullName as EmployeeName,
        e.EmployeeID
       FROM ComplaintHistory ch
       JOIN Employees e ON ch.EmployeeID = e.EmployeeID
       WHERE ch.ComplaintID = ?
       ORDER BY ch.Timestamp DESC`,
      [complaintId]
    );

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('خطأ في جلب سجل التاريخ:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب الحالات المتاحة
const getAvailableStatuses = async (req, res) => {
  try {
    const statuses = [
      { id: 'جديدة', name: 'جديدة', color: 'blue' },
      { id: 'قيد المراجعة', name: 'قيد المراجعة', color: 'yellow' },
      { id: 'قيد المعالجة', name: 'قيد المعالجة', color: 'orange' },
      { id: 'تم الرد', name: 'تم الرد', color: 'green' },
      { id: 'مغلقة', name: 'مغلقة', color: 'gray' },
      { id: 'تم الحل', name: 'تم الحل', color: 'green' }
    ];

    res.json({
      success: true,
      data: statuses
    });

  } catch (error) {
    console.error('خطأ في جلب الحالات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب أنواع الردود المتاحة
const getResponseTypes = async (req, res) => {
  try {
    const responseTypes = [
      { id: 'رد رسمي', name: 'رد رسمي' },
      { id: 'توضيح', name: 'توضيح' },
      { id: 'طلب معلومات إضافية', name: 'طلب معلومات إضافية' },
      { id: 'اعتذار', name: 'اعتذار' },
      { id: 'حل المشكلة', name: 'حل المشكلة' }
    ];

    res.json({
      success: true,
      data: responseTypes
    });

  } catch (error) {
    console.error('خطأ في جلب أنواع الردود:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

module.exports = {
  addResponse,
  getComplaintResponses,
  updateComplaintStatus,
  getComplaintHistory,
  getAvailableStatuses,
  getResponseTypes
}; 