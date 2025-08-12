

 document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("complaint"));

  if (!data) return;

  // تعبئة الحقول
  document.getElementById("c-name").textContent = data.name;
  document.getElementById("c-id").textContent = data.id;
  document.getElementById("c-gender").textContent = data.gender;
  document.getElementById("c-mobile").textContent = data.mobile;
  document.getElementById("c-dept").textContent = data.dept;
  document.getElementById("c-date").textContent = data.date;
  document.getElementById("c-main").textContent = data.mainType;
  document.getElementById("c-sub").textContent = data.subType;
  document.getElementById("c-desc").textContent = data.desc;
  document.getElementById("c-file").textContent = data.fileName;
});


   let lang = localStorage.getItem("lang") || "ar";

function applyLang(lang) {
  document.documentElement.lang = lang;
  document.body.dir = lang === "ar" ? "rtl" : "ltr";
  document.body.classList.toggle("lang-en", lang === "en");
  document.body.classList.toggle("lang-ar", lang === "ar");

  // نترجم كل العناصر اللي فيها data-ar و data-en
  document.querySelectorAll("[data-ar]").forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  // تحديث نص زر اللغة
  const langText = document.getElementById("langText");
  if (langText) {
    langText.textContent = lang === "ar" ? "العربية | English" : "English | العربية";
  }

  // تثبيت اتجاه الهيدر (دائمًا من اليمين لليسار)
  const header = document.querySelector("header.header");
  if (header) {
    header.style.direction = "rtl";
  }

  localStorage.setItem("lang", lang);
}

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  applyLang(lang);

  const toggle = document.getElementById("langToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      lang = lang === "ar" ? "en" : "ar";
      applyLang(lang);
    });
  }

  // تعبئة بيانات الشكوى من localStorage
  const data = JSON.parse(localStorage.getItem("complaint"));
  if (data) {
    document.getElementById("c-name").textContent = data.name;
    document.getElementById("c-id").textContent = data.id;
    document.getElementById("c-gender").textContent = data.gender;
    document.getElementById("c-mobile").textContent = data.mobile;
    document.getElementById("c-dept").textContent = data.dept;
    document.getElementById("c-date").textContent = data.date;
    document.getElementById("c-main").textContent = data.mainType;
    document.getElementById("c-sub").textContent = data.subType;
    document.getElementById("c-desc").textContent = data.desc;
    document.getElementById("c-file").textContent = data.fileName;
  }
});

// وظائف إضافية
function printPage() {
  window.print();
}

function goHome() {
  window.location.href = "/login/home.html";
}

function followUp() {
  window.location.href = "/Complaints-followup/all-Complaints.html";
}
