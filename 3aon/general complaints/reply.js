const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');

attachBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  fileList.innerHTML = '';
  Array.from(fileInput.files).forEach((file, idx) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <img src="https://img.icons8.com/ios-filled/50/000000/pdf.png" class="icon" alt="pdf">
      <div class="name">${file.name}</div>
      <button class="remove" data-index="${idx}">&times;</button>
    `;
    fileList.appendChild(item);
  });
});

fileList.addEventListener('click', e => {
  if (e.target.classList.contains('remove')) {
    const idx = e.target.getAttribute('data-index');
    const dt = new DataTransfer();
    const files = Array.from(fileInput.files);
    files.splice(idx, 1);
    files.forEach(f => dt.items.add(f));
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event('change'));
  }
});

document.getElementById('sendBtn').addEventListener('click', () => {
  const reply = document.getElementById('replyText').value.trim();
  if (!reply) {
    alert('يرجى كتابة نص الرد قبل الإرسال.');
    return;
  }
  // تنفيذ إرسال البيانات إلى الخادم
  alert('تم إرسال الرد بنجاح!');
});

document.getElementById('cancelBtn').addEventListener('click', () => {
  if (confirm('هل أنت متأكد من إلغاء العملية؟')) {
    window.history.back();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const sendBtn = document.getElementById('sendBtn');

  sendBtn.addEventListener('click', () => {
    const replyText = document.getElementById('replyText').value.trim();

    if (!replyText) {
      alert("يرجى كتابة نص الرد قبل الإرسال.");
      return;
    }

    // (اختياري) يمكنك هنا حفظ البيانات في localStorage أو إرسالها إلى السيرفر

    // إعادة التوجيه بعد الإرسال
    window.location.href = 'general-complaints.html';
  });

  // زر الإلغاء يرجع خطوة للخلف
  const cancelBtn = document.getElementById('cancelBtn');
  cancelBtn.addEventListener('click', () => {
    window.history.back();
  });
});




/*let currentLang = localStorage.getItem('lang') || 'ar';

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

  // النصوص
  document.querySelectorAll('[data-ar]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  // الـ placeholder
  document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
    el.setAttribute('placeholder', el.getAttribute(`data-${lang}-placeholder`));
  });

  // زر اللغة
  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  }
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
});*/


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







function goBack() {
  window.history.back();
}

