    // تأثير تحديد البطاقات عند الضغط
    document.querySelectorAll(".service-box").forEach(service => {
        service.addEventListener("click", function() {
            document.querySelectorAll(".service-box").forEach(s => s.classList.remove("selected"));
            this.classList.add("selected");

            // التنقل إلى الصفحة المحددة في data-url
            const url = this.getAttribute("data-url"); // ✅ تصحيح الخطأ هنا
            if (url) {
                window.location.href = url;
            }
        });
    });
        // تقليل عدد الإشعارات عند الضغط
    let notifBtn = document.getElementById("notif-btn");
    let notifCount = document.getElementById("notif-count");

    if (notifBtn && notifCount) {
        notifBtn.addEventListener("click", function() {
            let count = parseInt(notifCount.textContent) || 0;

            if (count > 0) {
                count--;
                notifCount.textContent = count;

                if (count === 0) {
                    notifCount.style.display = "none";
                }
            }
        });
    }
;
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

// فحص صلاحيات المستخدم وإظهار البطاقات المناسبة
function checkUserPermissions() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      // إذا لم يكن هناك مستخدم مسجل، توجيه إلى صفحة تسجيل الدخول
      window.location.href = 'login.html';
      return;
    }

    const userRole = user.RoleName || '';
    const roleID = user.RoleID || 2;
    const username = user.Username || '';
    
    // إذا كان المستخدم أدمن (بالاسم أو الدور)
    if (roleID === 1 || username.toLowerCase() === 'admin' || userRole.includes('مدير')) {
      // المدير: إظهار جميع البطاقات
      const adminCards = document.querySelectorAll('.admin-only');
      adminCards.forEach(card => {
        card.style.display = 'block';
      });
    }
    // المستخدم العادي لا يحتاج لتغيير شيء، البطاقات المخفية ستبقى مخفية
    
  } catch (error) {
    console.error('خطأ في فحص الصلاحيات:', error);
    // في حالة وجود خطأ، إعادة توجيه لصفحة تسجيل الدخول
    window.location.href = 'login.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);
  checkUserPermissions(); // فحص صلاحيات المستخدم عند تحميل الصفحة

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }
});
