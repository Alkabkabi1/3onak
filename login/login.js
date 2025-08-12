// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api/auth';

// وظيفة لإظهار رسائل الخطأ
function showError(message) {
  alert(message);
}

// وظيفة لإظهار رسائل النجاح
function showSuccess(message) {
  alert(message);
}

// وظيفة للتحقق من صحة البيانات
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone) {
  const re = /^[0-9]{10,15}$/;
  return re.test(phone);
}

// فحص إدخال admin وإخفاء الحقول
function checkAdminInput() {
  const username = document.getElementById("regName").value.toLowerCase();
  const phoneField = document.getElementById("regPhone");
  const idField = document.getElementById("regID");
  
  if (username === "admin") {
    // إخفاء حقل الهاتف ورقم الموظف للأدمن
    phoneField.style.display = "none";
    idField.style.display = "none";
    phoneField.removeAttribute("required");
    idField.removeAttribute("required");
  } else {
    // إظهار الحقول للمستخدمين العاديين
    phoneField.style.display = "block";
    idField.style.display = "block";
    phoneField.setAttribute("required", "required");
    idField.setAttribute("required", "required");
  }
}

function showTab(tab) {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (tab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
  }
}

// تسجيل الدخول
async function login() {
  const username = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    showError("يرجى إدخال اسم المستخدم وكلمة المرور.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    if (data.success) {
      // حفظ التوكن وبيانات المستخدم
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.employee));
      localStorage.setItem("userEmail", data.data.employee.Email || username);

      // سجل الأنشطة
      let logs = JSON.parse(localStorage.getItem("activityLogs")) || [];
      logs.push({
        time: new Date().toLocaleString(),
        action: "Login",
        details: `User ${data.data.employee.FullName} logged in successfully.`
      });
      localStorage.setItem("activityLogs", JSON.stringify(logs));

      showSuccess("تم تسجيل الدخول بنجاح!");
      
      setTimeout(() => {
        window.location.href = "home.html";
      }, 1500);
    } else {
      showError(data.message || "حدث خطأ في تسجيل الدخول");
    }
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    showError("حدث خطأ في الاتصال بالخادم");
  }
}

// التسجيل الجديد
async function register() {
  const fullName = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPass").value;
  const confirmPassword = document.getElementById("regConfirmPass").value;
  
  let username, phoneNumber, roleID;
  
  if (fullName.toLowerCase() === "admin") {
    // للمدير: قيم افتراضية
    username = "admin";
    phoneNumber = "";
    roleID = 1; // مدير
    
    // التحقق من البيانات الأساسية للمدير
    if (!fullName || !email || !password || !confirmPassword) {
      showError("يرجى تعبئة جميع الحقول المطلوبة.");
      return;
    }
  } else {
    // للمستخدم العادي: جميع الحقول مطلوبة
    username = document.getElementById("regID").value.trim();
    phoneNumber = document.getElementById("regPhone").value.trim();
    roleID = 2; // موظف عادي
    
    // التحقق من البيانات
    if (!fullName || !phoneNumber || !username || !email || !password || !confirmPassword) {
      showError("يرجى تعبئة جميع الحقول.");
      return;
    }
    
    if (!validatePhone(phoneNumber)) {
      showError("يرجى إدخال رقم هاتف صحيح.");
      return;
    }
  }

  if (password !== confirmPassword) {
    showError("كلمتا المرور غير متطابقتين.");
    return;
  }

  if (!validateEmail(email)) {
    showError("يرجى إدخال بريد إلكتروني صحيح.");
    return;
  }

  if (password.length < 6) {
    showError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName,
        username,
        password,
        email,
        phoneNumber,
        roleID,
        specialty: ''
      })
    });

    const data = await response.json();

    if (data.success) {
      // حفظ التوكن وبيانات المستخدم
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.employee));
      localStorage.setItem("userEmail", data.data.employee.Email || email);

      // إضافة المستخدم إلى قائمة المسجلين
      let users = JSON.parse(localStorage.getItem("registeredUsers")) || [];
      users.push({ 
        name: fullName, 
        phone: phoneNumber, 
        id: username, 
        email, 
        time: new Date().toLocaleString() 
      });
      localStorage.setItem("registeredUsers", JSON.stringify(users));

      // تسجيل في الأنشطة
      let logs = JSON.parse(localStorage.getItem("activityLogs")) || [];
      logs.push({
        time: new Date().toLocaleString(),
        action: "Register",
        details: `User ${fullName} registered successfully with email ${email}.`
      });
      localStorage.setItem("activityLogs", JSON.stringify(logs));

      showSuccess("تم التسجيل بنجاح!");
      
      setTimeout(() => {
        window.location.href = "home.html";
      }, 1500);
    } else {
      showError(data.message || "حدث خطأ في التسجيل");
    }
  } catch (error) {
    console.error('خطأ في التسجيل:', error);
    showError("حدث خطأ في الاتصال بالخادم");
  }
}

// وظيفة للتحقق من حالة تسجيل الدخول
function checkAuthStatus() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    // التحقق من صحة التوكن
    fetch(`${API_BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        // التوكن غير صالح، حذف البيانات المحلية
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log('تم حذف التوكن غير الصالح');
      }
    })
    .catch(error => {
      console.error('خطأ في التحقق من التوكن:', error);
      // حذف البيانات المحلية في حالة الخطأ
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
  }
}

let currentLang = localStorage.getItem('lang') || 'ar';

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // الاتجاه واللغة
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';

  // تغيير النصوص بناءً على اللغة
  document.querySelectorAll('[data-ar]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  // تغيير placeholder بناءً على اللغة
  document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });

  // زر اللغة نفسه
  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  }

  // تغيير الخط
  document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";
}

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);
  checkAuthStatus();

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }
});
