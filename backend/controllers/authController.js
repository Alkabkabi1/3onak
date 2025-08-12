const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { logActivity } = require('./logsController');

// تسجيل موظف جديد
const register = async (req, res) => {
  try {
    const { 
      fullName, 
      username, 
      password, 
      email, 
      phoneNumber, 
      roleID, 
      specialty 
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!fullName || !username || !password || !roleID) {
      return res.status(400).json({ 
        success: false, 
        message: 'جميع الحقول المطلوبة يجب أن تكون مملوءة' 
      });
    }

    // التحقق من أن اسم المستخدم غير موجود
    const [existingUsers] = await pool.execute(
      'SELECT EmployeeID FROM Employees WHERE Username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'اسم المستخدم موجود مسبقاً' 
      });
    }

    // تشفير كلمة المرور
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // إدخال الموظف الجديد
    const [result] = await pool.execute(
      `INSERT INTO Employees (FullName, Username, PasswordHash, Email, PhoneNumber, RoleID, Specialty) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [fullName, username, passwordHash, email, phoneNumber, roleID, specialty]
    );

    // الحصول على بيانات الموظف المحدثة
    const [newEmployee] = await pool.execute(
      `SELECT e.EmployeeID, e.FullName, e.Username, e.Email, e.PhoneNumber, 
              e.Specialty, e.JoinDate, r.RoleName, r.RoleID
       FROM Employees e 
       JOIN Roles r ON e.RoleID = r.RoleID 
       WHERE e.EmployeeID = ?`,
      [result.insertId]
    );

    if (newEmployee.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'حدث خطأ أثناء إنشاء الحساب' 
      });
    }

    // إنشاء توكن
    const token = jwt.sign(
      { 
        employeeID: newEmployee[0].EmployeeID,
        username: newEmployee[0].Username,
        roleID: newEmployee[0].RoleID,
        roleName: newEmployee[0].RoleName
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // تسجيل نشاط التسجيل
    await logActivity(
      newEmployee[0].EmployeeID,
      newEmployee[0].Username,
      'register',
      `تم إنشاء حساب جديد: ${fullName} (${newEmployee[0].RoleName})`,
      req.ip,
      req.get('User-Agent')
    );

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        employee: newEmployee[0],
        token
      }
    });

  } catch (error) {
    console.error('خطأ في التسجيل:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// تسجيل الدخول
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // التحقق من البيانات المطلوبة
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'اسم المستخدم وكلمة المرور مطلوبان' 
      });
    }

    // البحث عن المستخدم
    const [employees] = await pool.execute(
      `SELECT e.EmployeeID, e.FullName, e.Username, e.PasswordHash, e.Email, 
              e.PhoneNumber, e.Specialty, e.JoinDate, r.RoleName, r.RoleID
       FROM Employees e 
       JOIN Roles r ON e.RoleID = r.RoleID 
       WHERE e.Username = ?`,
      [username]
    );

    if (employees.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة' 
      });
    }

    const employee = employees[0];

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, employee.PasswordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة' 
      });
    }

    // إنشاء توكن
    const token = jwt.sign(
      { 
        employeeID: employee.EmployeeID,
        username: employee.Username,
        roleID: employee.RoleID,
        roleName: employee.RoleName
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // إزالة كلمة المرور من الاستجابة
    delete employee.PasswordHash;

    // تسجيل نشاط تسجيل الدخول
    await logActivity(
      employee.EmployeeID,
      employee.Username,
      'login',
      `تم تسجيل الدخول بنجاح`,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        employee,
        token
      }
    });

  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// الحصول على معلومات المستخدم الحالي (بدون middleware)
const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'التوكن مطلوب' 
      });
    }

    // التحقق من التوكن مع معالجة الأخطاء
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (jwtError) {
      console.error('خطأ في التحقق من التوكن:', jwtError.message);
      return res.status(401).json({ 
        success: false, 
        message: 'التوكن غير صالح أو منتهي الصلاحية' 
      });
    }

    const employeeID = decoded.employeeID;

    const [employees] = await pool.execute(
      `SELECT e.EmployeeID, e.FullName, e.Username, e.Email, e.PhoneNumber, 
              e.Specialty, e.JoinDate, r.RoleName, r.RoleID
       FROM Employees e 
       JOIN Roles r ON e.RoleID = r.RoleID 
       WHERE e.EmployeeID = ?`,
      [employeeID]
    );

    if (employees.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'المستخدم غير موجود' 
      });
    }

    res.json({
      success: true,
      data: employees[0]
    });

  } catch (error) {
    console.error('خطأ في الحصول على معلومات المستخدم:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// الحصول على جميع الأدوار
const getRoles = async (req, res) => {
  try {
    const [roles] = await pool.execute('SELECT * FROM Roles ORDER BY RoleName');
    
    res.json({
      success: true,
      data: roles
    });

  } catch (error) {
    console.error('خطأ في الحصول على الأدوار:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  getRoles
}; 