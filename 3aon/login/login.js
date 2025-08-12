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
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("يرجى إدخال البريد وكلمة المرور.");
    return;
  }

  // حفظ الدخول
  localStorage.setItem("userEmail", email);

  // سجل المستخدمين
  let users = JSON.parse(localStorage.getItem("loggedUsers")) || [];
  users.push({ email, time: new Date().toLocaleString() });
  localStorage.setItem("loggedUsers", JSON.stringify(users));

  // سجل الأنشطة
  let logs = JSON.parse(localStorage.getItem("activityLogs")) || [];
  logs.push({
    time: new Date().toLocaleString(),
    action: "Login",
    details: `User with email ${email} logged in.`
  });
  localStorage.setItem("activityLogs", JSON.stringify(logs));

  setTimeout(() => {
    window.location.href = "home.html";
  }, 1500);
}

// التسجيل الجديد
function register() {
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const id = document.getElementById("regID").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const pass = document.getElementById("regPass").value;
  const confirm = document.getElementById("regConfirmPass").value;

  if (!name || !phone || !id || !email || !pass || !confirm) {
    alert("يرجى تعبئة جميع الحقول.");
    return;
  }

  if (pass !== confirm) {
    alert("كلمتا المرور غير متطابقتين.");
    return;
  }

  localStorage.setItem("userEmail", email);

  // إضافة المستخدم إلى قائمة المسجلين
  let users = JSON.parse(localStorage.getItem("registeredUsers")) || [];
  users.push({ name, phone, id, email, time: new Date().toLocaleString() });
  localStorage.setItem("registeredUsers", JSON.stringify(users));

  // تسجيل في الأنشطة
  let logs = JSON.parse(localStorage.getItem("activityLogs")) || [];
  logs.push({
    time: new Date().toLocaleString(),
    action: "Register",
    details: `User ${name} registered with email ${email}.`
  });
  localStorage.setItem("activityLogs", JSON.stringify(logs));

  setTimeout(() => {
    window.location.href = "home.html";
  }, 1500);
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

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }
});
