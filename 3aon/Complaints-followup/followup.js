
function goBack() {
  window.history.back();
}


function handleSubmit(e) {
  e.preventDefault();

  const name = document.querySelector('input[data-ar-placeholder="ادخل اسم المريض الكامل"]').value;
  const id = document.querySelector('input[data-ar-placeholder="رقم الهوية / الإقامة"]').value;

  if (name && id) {
    // تخزين البيانات في localStorage (اختياري)
    localStorage.setItem('patientName', name);
    localStorage.setItem('patientId', id);

    // الانتقال إلى الصفحة التالية
    window.location.href = "/Complaints-followup/all-Complaints.html";
  } else {
    alert("يرجى تعبئة جميع الحقول المطلوبة");
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

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }
});

