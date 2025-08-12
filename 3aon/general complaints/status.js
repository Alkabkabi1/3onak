const saveBtn = document.querySelector(".save-btn");
const successMessage = document.getElementById("successMessage");
const modalContainer = document.querySelector(".modal-container"); // لتطبيق الفيد آوت

saveBtn.addEventListener("click", async () => {
  const complaintId = document.querySelector(".complaint-id").textContent.replace("#", "");
  const newStatus = document.getElementById("new-status").value;
  const notes = document.getElementById("notes").value;

  try {
    const response = await fetch("/api/updateComplaintStatus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        complaintId,
        newStatus,
        notes
      })
    });

    const result = await response.json();

    if (result.success) {
      successMessage.classList.remove("hidden");

      setTimeout(() => {
        // تطبيق التأثير البصري
        modalContainer.classList.add("fade-out");

        // الانتقال بعد الانميشن
        setTimeout(() => {
          window.location.href = "general-complaints.html";
        }, 800); // نفس مدة الـ transition
      }, 2500); // بعد عرض الرسالة
    } else {
      alert("حدث خطأ أثناء التحديث. حاول مجددًا.");
    }

  } catch (error) {
    console.error("Error:", error);
    alert("فشل الاتصال بالسيرفر.");
  }
});



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
