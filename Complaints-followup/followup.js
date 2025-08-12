
function goBack() {
  window.history.back();
}

// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

async function handleSubmit(e) {
  e.preventDefault();

  const name = document.querySelector('input[data-ar-placeholder="ادخل اسم المريض الكامل"]').value;
  const id = document.querySelector('input[data-ar-placeholder="رقم الهوية / الإقامة"]').value;

  if (!name || !id) {
    alert("يرجى تعبئة جميع الحقول المطلوبة");
    return;
  }

  // إظهار رسالة تحميل
  const submitBtn = document.querySelector('.submit-btn');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "جاري التحقق...";
  submitBtn.disabled = true;

  try {
    // التحقق من هوية المريض عبر API الجديد
    const verifyResponse = await fetch(`${API_BASE_URL}/complaints/verify-patient/${id}`);
    const verifyData = await verifyResponse.json();

    if (verifyData.success) {
      // التحقق من تطابق الاسم
      const patientName = verifyData.data.patient.name.toLowerCase().trim();
      const enteredName = name.toLowerCase().trim();
      
      if (patientName === enteredName || patientName.includes(enteredName) || enteredName.includes(patientName)) {
        // تخزين البيانات في localStorage
        localStorage.setItem('patientName', verifyData.data.patient.name);
        localStorage.setItem('patientId', id);
        localStorage.setItem('patientNationalId', id);
        
        // التحقق من وجود شكاوى
        if (verifyData.data.totalComplaints > 0) {
          // الانتقال إلى صفحة الشكاوى
          window.location.href = "/Complaints-followup/all-complaints.html";
        } else {
          alert("لا توجد شكاوى مسجلة لهذا المريض حتى الآن.");
        }
      } else {
        alert("الاسم المدخل لا يتطابق مع البيانات المسجلة. يرجى التأكد من صحة الاسم ورقم الهوية.");
      }
    } else {
      alert("لا يوجد مريض مسجل بهذا الرقم أو البيانات غير صحيحة");
    }
  } catch (error) {
    console.error('خطأ في التحقق من هوية المريض:', error);
    alert("حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
  } finally {
    // إعادة تفعيل الزر
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
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

