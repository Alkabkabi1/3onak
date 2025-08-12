const departments = ["الطوارئ", "العيادات الخارجية", "المختبر", "الأشعة"]; // أضف هذا السطر أول ملف Newcomplaint.js

const departmentSelect = document.getElementById("department");

departments.forEach(dept => {
  const option = document.createElement("option");
  option.value = dept;
  option.textContent = dept;
  departmentSelect.appendChild(option);
});


function submitComplaint() {
  const name = document.getElementById("fullName").value.trim();
  const id = document.getElementById("nationalId").value.trim();
  const gender = document.getElementById("gender").value;
  const mobile = document.getElementById("mobile").value.trim();
  const dept = document.getElementById("department").value;
  const date = document.getElementById("visitDate").value;
  const mainType = document.getElementById("mainType").value;
  const subType = document.getElementById("subType").value;
  const desc = document.getElementById("details").value.trim();

  if (!name || !id || gender === "اختر الجنس" || !mobile || !dept || !date || !mainType || !subType || !desc) {
    alert("يرجى تعبئة جميع الحقول الإلزامية.");
    return;
  }

  // تخزين البيانات محليًا للعرض في صفحة التأكيد
  const complaintData = {
    name,
    id,
    gender,
    mobile,
    dept,
    date,
    mainType,
    subType,
    desc,
    fileName: "medication_issue.pdf" // مرفق وهمي كمثال
  };

  localStorage.setItem("complaint", JSON.stringify(complaintData));

  // الانتقال إلى صفحة التأكيد
  window.location.href = "confirmation.html";
}


 let uploadedFiles = [];

function triggerUpload() {
  document.getElementById("attachments").click();
}


function previewFiles(event) {
  const files = Array.from(event.target.files);
  const previewList = document.getElementById("file-preview-list");
  previewList.innerHTML = ""; // حذف المعاينات السابقة

  files.forEach((file, index) => {
    const reader = new FileReader();
    const card = document.createElement("div");
    card.className = "file-card";

    const icon = document.createElement("img");
    icon.className = "preview-icon";

    const name = document.createElement("p");
    name.textContent = file.name;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.onclick = () => {
      files.splice(index, 1);
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      document.getElementById("attachments").files = dt.files;
      previewFiles({ target: { files: dt.files } });
    };

    if (file.type.startsWith("image/")) {
      reader.onload = e => {
        icon.src = e.target.result;
        card.appendChild(icon);
        card.appendChild(name);
        card.appendChild(deleteBtn);
      };
      reader.readAsDataURL(file);
    } else {
      icon.src = "/icon/document.png"; // أيقونة المستند
      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(deleteBtn);
    }

    previewList.appendChild(card);
  });
}





/*let lang = localStorage.getItem("lang") || "ar";

function applyLang(lang) {
  document.documentElement.lang = lang;
  document.body.dir = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-ar]").forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  document.querySelectorAll("[data-ar-placeholder]").forEach(el => {
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });

  document.getElementById("langText").textContent = lang === "ar" ? "العربية | English" : "English | العربية";
  localStorage.setItem("lang", lang);
}

document.addEventListener("DOMContentLoaded", () => {
  applyLang(lang);

  document.getElementById("langToggle").addEventListener("click", () => {
    lang = lang === "ar" ? "en" : "ar";
    applyLang(lang);
  });
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
