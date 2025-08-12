const pool = require('../config/database');
const jwt = require('jsonwebtoken');

// التحقق من صلاحيات المستخدم
const checkUserPermissions = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'لا يوجد رمز مصادقة' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const [userResult] = await pool.execute(
      `SELECT e.EmployeeID, e.Username, e.FullName, e.RoleID, r.RoleName 
       FROM Employees e 
       LEFT JOIN Roles r ON e.RoleID = r.RoleID 
       WHERE e.EmployeeID = ?`,
      [decoded.employeeID]
    );

    if (userResult.length === 0) {
      return res.status(401).json({ message: 'المستخدم غير موجود' });
    }

    req.user = {
      employeeID: userResult[0].EmployeeID,
      username: userResult[0].Username,
      fullName: userResult[0].FullName,
      roleID: userResult[0].RoleID,
      roleName: userResult[0].RoleName
    };

    next();
  } catch (error) {
    console.error('خطأ في التحقق من الصلاحيات:', error);
    res.status(401).json({ message: 'رمز المصادقة غير صالح' });
  }
};

// التحقق من صلاحيات المدير
const checkAdminPermissions = async (req, res, next) => {
  try {
    if (req.user.roleID !== 1 && req.user.username.toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'ليس لديك صلاحية للوصول لهذه الميزة' });
    }
    next();
  } catch (error) {
    console.error('خطأ في التحقق من صلاحيات المدير:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

// إنشاء جدول ActivityLogs
const createActivityLogsTable = async () => {
  try {
    console.log('🔧 التحقق من وجود جدول ActivityLogs...');
    
    const createTable = `
      CREATE TABLE IF NOT EXISTS ActivityLogs (
        LogID INT AUTO_INCREMENT PRIMARY KEY,
        EmployeeID INT,
        Username VARCHAR(50),
        ActivityType VARCHAR(50) NOT NULL,
        Description TEXT NOT NULL,
        IPAddress VARCHAR(45),
        UserAgent TEXT,
        RelatedID INT,
        RelatedType VARCHAR(50),
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID) ON DELETE SET NULL,
        INDEX idx_employee_id (EmployeeID),
        INDEX idx_activity_type (ActivityType),
        INDEX idx_created_at (CreatedAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await pool.execute(createTable);
    console.log('✅ جدول ActivityLogs جاهز');
    
    // إضافة بعض السجلات التجريبية إذا كان الجدول فارغ
    const [existingLogs] = await pool.execute('SELECT COUNT(*) as count FROM ActivityLogs');
    if (existingLogs[0].count === 0) {
      console.log('🔄 إضافة سجلات تجريبية...');
      
      const sampleLogs = [
        [null, 'system', 'system_startup', 'بدء تشغيل النظام', '127.0.0.1', 'System', null, null],
        [null, 'admin', 'login', 'تسجيل دخول المدير', '127.0.0.1', 'Mozilla/5.0', null, null],
        [null, 'admin', 'view_logs', 'عرض سجل الأنشطة', '127.0.0.1', 'Mozilla/5.0', null, null],
      ];
      
      for (const log of sampleLogs) {
        await pool.execute(
          `INSERT INTO ActivityLogs (EmployeeID, Username, ActivityType, Description, IPAddress, UserAgent, RelatedID, RelatedType) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          log
        );
      }
      
      console.log('✅ تم إضافة السجلات التجريبية');
    }
  } catch (error) {
    console.error('❌ خطأ في إنشاء جدول ActivityLogs:', error);
  }
};

// تسجيل نشاط جديد
const logActivity = async (employeeID, username, activityType, description, ipAddress = null, userAgent = null, relatedID = null, relatedType = null) => {
  try {
    await pool.execute(
      `INSERT INTO ActivityLogs (EmployeeID, Username, ActivityType, Description, IPAddress, UserAgent, RelatedID, RelatedType) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employeeID, username, activityType, description, ipAddress, userAgent, relatedID, relatedType]
    );
  } catch (error) {
    console.error('خطأ في تسجيل النشاط:', error);
  }
};

// جلب جميع السجلات (للمدير فقط)
const getAllLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // بناء استعلام بسيط أولاً
    const countQuery = `SELECT COUNT(*) as total FROM ActivityLogs`;
    const [countResult] = await pool.query(countQuery);
    const totalLogs = countResult[0].total;

    // استعلام السجلات باستخدام query بدلاً من execute
    const logsQuery = `
      SELECT al.LogID, al.Username, al.ActivityType, al.Description, 
             al.CreatedAt, e.FullName as EmployeeName
      FROM ActivityLogs al
      LEFT JOIN Employees e ON al.EmployeeID = e.EmployeeID
      ORDER BY al.CreatedAt DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const [logs] = await pool.query(logsQuery);

    // جلب إحصائيات سريعة
    const [todayStats] = await pool.query(
      `SELECT COUNT(*) as todayLogs FROM ActivityLogs WHERE DATE(CreatedAt) = CURDATE()`
    );

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalLogs / limit),
          totalLogs,
          logsPerPage: limit
        },
        stats: {
          totalLogs,
          todayLogs: todayStats[0].todayLogs
        }
      }
    });

  } catch (error) {
    console.error('خطأ في جلب السجلات:', error);
    res.status(500).json({ message: 'خطأ في جلب السجلات' });
  }
};

// حذف السجلات القديمة (للمدير فقط)
const deleteOldLogs = async (req, res) => {
  try {
    const { days = 90 } = req.body; // حذف السجلات الأقدم من 90 يوم افتراضياً

    const [result] = await pool.execute(
      `DELETE FROM ActivityLogs WHERE CreatedAt < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    // تسجيل هذا النشاط
    await logActivity(
      req.user.employeeID,
      req.user.username,
      'delete_logs',
      `تم حذف ${result.affectedRows} سجل قديم (أقدم من ${days} يوم)`,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: `تم حذف ${result.affectedRows} سجل قديم بنجاح`,
      deletedCount: result.affectedRows
    });

  } catch (error) {
    console.error('خطأ في حذف السجلات القديمة:', error);
    res.status(500).json({ message: 'خطأ في حذف السجلات القديمة' });
  }
};

// حذف سجل واحد (للمدير فقط)
const deleteLog = async (req, res) => {
  try {
    const { logId } = req.params;

    // التحقق من وجود السجل
    const [logCheck] = await pool.execute(
      `SELECT * FROM ActivityLogs WHERE LogID = ?`,
      [logId]
    );

    if (logCheck.length === 0) {
      return res.status(404).json({ message: 'السجل غير موجود' });
    }

    // حذف السجل
    await pool.execute(
      `DELETE FROM ActivityLogs WHERE LogID = ?`,
      [logId]
    );

    // تسجيل هذا النشاط
    await logActivity(
      req.user.employeeID,
      req.user.username,
      'delete_log',
      `تم حذف سجل النشاط رقم ${logId}`,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'تم حذف السجل بنجاح'
    });

  } catch (error) {
    console.error('خطأ في حذف السجل:', error);
    res.status(500).json({ message: 'خطأ في حذف السجل' });
  }
};

// تصدير السجلات (للمدير فقط)
const exportLogs = async (req, res) => {
  try {
    const { format = 'json', dateFrom, dateTo, activityType } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (dateFrom) {
      whereConditions.push(`DATE(al.CreatedAt) >= ?`);
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push(`DATE(al.CreatedAt) <= ?`);
      queryParams.push(dateTo);
    }

    if (activityType) {
      whereConditions.push(`al.ActivityType = ?`);
      queryParams.push(activityType);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [logs] = await pool.execute(
      `SELECT al.LogID, al.Username, e.FullName as EmployeeName, al.ActivityType, 
              al.Description, al.IPAddress, al.CreatedAt
       FROM ActivityLogs al
       LEFT JOIN Employees e ON al.EmployeeID = e.EmployeeID
       ${whereClause}
       ORDER BY al.CreatedAt DESC`,
      queryParams
    );

    // تسجيل نشاط التصدير
    await logActivity(
      req.user.employeeID,
      req.user.username,
      'export_logs',
      `تم تصدير ${logs.length} سجل بصيغة ${format}`,
      req.ip,
      req.get('User-Agent')
    );

    if (format === 'csv') {
      // تصدير CSV
      const csv = convertToCSV(logs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity-logs.csv');
      res.send(csv);
    } else {
      // تصدير JSON
      res.json({
        success: true,
        data: logs,
        exportDate: new Date().toISOString(),
        totalRecords: logs.length
      });
    }

  } catch (error) {
    console.error('خطأ في تصدير السجلات:', error);
    res.status(500).json({ message: 'خطأ في تصدير السجلات' });
  }
};

// تحويل البيانات إلى CSV
const convertToCSV = (data) => {
  if (data.length === 0) return '';

  const headers = ['رقم السجل', 'اسم المستخدم', 'اسم الموظف', 'نوع النشاط', 'الوصف', 'عنوان IP', 'تاريخ الإنشاء'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.LogID,
      `"${row.Username || ''}"`,
      `"${row.EmployeeName || ''}"`,
      `"${row.ActivityType || ''}"`,
      `"${row.Description || ''}"`,
      `"${row.IPAddress || ''}"`,
      `"${row.CreatedAt || ''}"`
    ].join(','))
  ].join('\n');

  return csvContent;
};

// تهيئة جدول ActivityLogs عند بدء التشغيل
createActivityLogsTable();

module.exports = {
  checkUserPermissions,
  checkAdminPermissions,
  logActivity,
  getAllLogs,
  deleteOldLogs,
  deleteLog,
  exportLogs
}; 