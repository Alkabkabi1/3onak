// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let departments = [];
let complaintTypes = [];
let subTypes = [];

// جلب الأقسام من الباك إند
async function loadDepartments() {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/departments`);
    const data = await response.json();
    
    if (data.success) {
      departments = data.data;
      populateDepartmentSelect();
    } else {
      console.error('خطأ في جلب الأقسام:', data.message);
    }
  } catch (error) {
    console.error('خطأ في الاتصال بالخادم:', error);
  }
}

// جلب أنواع الشكاوى من الباك إند
async function loadComplaintTypes() {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/types`);
    const data = await response.json();
    
    if (data.success) {
      complaintTypes = data.data;
      populateComplaintTypeSelect();
    } else {
      console.error('خطأ في جلب أنواع الشكاوى:', data.message);
    }
  } catch (error) {
    console.error('خطأ في الاتصال بالخادم:', error);
  }
}

// جلب التصنيفات الفرعية
async function loadSubTypes(complaintTypeID) {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/subtypes/${complaintTypeID}`);
    const data = await response.json();
    
    if (data.success) {
      subTypes = data.data;
      populateSubTypeSelect();
    } else {
      console.error('خطأ في جلب التصنيفات الفرعية:', data.message);
    }
  } catch (error) {
    console.error('خطأ في الاتصال بالخادم:', error);
  }
}

// ملء قائمة الأقسام
function populateDepartmentSelect() {
  const departmentSelect = document.getElementById("department");
  departmentSelect.innerHTML = '<option disabled selected data-ar="اختر القسم" data-en="Select Department">اختر القسم</option>';
  
  departments.forEach(dept => {
    const option = document.createElement("option");
    option.value = dept.DepartmentID;
    option.textContent = dept.DepartmentName;
    departmentSelect.appendChild(option);
  });
}

// ملء قائمة أنواع الشكاوى
function populateComplaintTypeSelect() {
  const mainTypeSelect = document.getElementById("mainType");
  mainTypeSelect.innerHTML = '<option disabled selected data-ar="اختر نوع الشكوى" data-en="Select Complaint Type">اختر نوع الشكوى</option>';
  
  complaintTypes.forEach(type => {
    const option = document.createElement("option");
    option.value = type.ComplaintTypeID;
    option.textContent = type.TypeName;
    mainTypeSelect.appendChild(option);
  });
}

// ملء قائمة التصنيفات الفرعية
function populateSubTypeSelect() {
  const subTypeSelect = document.getElementById("subType");
  subTypeSelect.innerHTML = '<option disabled selected data-ar="اختر التصنيف الفرعي" data-en="Select Subcategory">اختر التصنيف الفرعي</option>';
  
  subTypes.forEach(subType => {
    const option = document.createElement("option");
    option.value = subType.SubTypeID;
    option.textContent = subType.SubTypeName;
    subTypeSelect.appendChild(option);
  });
}

// عند تغيير نوع الشكوى الرئيسي
function onMainTypeChange() {
  const mainTypeSelect = document.getElementById("mainType");
  const selectedTypeID = mainTypeSelect.value;
  
  if (selectedTypeID) {
    loadSubTypes(selectedTypeID);
  } else {
    // إعادة تعيين التصنيف الفرعي
    const subTypeSelect = document.getElementById("subType");
    subTypeSelect.innerHTML = '<option disabled selected data-ar="اختر التصنيف الفرعي" data-en="Select Subcategory">اختر التصنيف الفرعي</option>';
  }
}

// إرسال الشكوى إلى الباك إند
async function submitComplaint() {
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

  try {
    // إنشاء FormData لإرسال البيانات مع المرفقات
    const formData = new FormData();
    
    // إضافة البيانات النصية
    formData.append('patientName', name);
    formData.append('nationalId', id);
    formData.append('gender', gender);
    formData.append('contactNumber', mobile);
    formData.append('departmentID', dept);
    formData.append('visitDate', date);
    formData.append('complaintTypeID', mainType);
    formData.append('subTypeID', subType);
    formData.append('complaintDetails', desc);

    // إضافة المرفقات
    const attachmentsInput = document.getElementById("attachments");
    if (attachmentsInput.files.length > 0) {
      for (let i = 0; i < attachmentsInput.files.length; i++) {
        formData.append('attachments', attachmentsInput.files[i]);
      }
    }

    // إرسال البيانات إلى الباك إند
    const response = await fetch(`${API_BASE_URL}/complaints/submit`, {
      method: 'POST',
      body: formData // لا نحتاج لـ Content-Type مع FormData
    });

    const data = await response.json();

    if (data.success) {
      // حفظ البيانات في localStorage مع ID الشكوى والمرفقات
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
        complaintID: data.data.complaintID,
        attachments: data.data.attachments || [],
        savedInDatabase: true
      };

      localStorage.setItem("complaint", JSON.stringify(complaintData));

      alert("تم إرسال الشكوى بنجاح!");
      
      // الانتقال إلى صفحة التأكيد
      window.location.href = "confirmation.html";
    } else {
      alert("خطأ في إرسال الشكوى: " + data.message);
    }
  } catch (error) {
    console.error('خطأ في إرسال الشكوى:', error);
    alert("حدث خطأ في الاتصال بالخادم");
  }
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

function goBack() {
  window.history.back();
}

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }

  // تحميل الأقسام وأنواع الشكاوى
  loadDepartments();
  loadComplaintTypes();

  // إضافة مستمع لتغيير نوع الشكوى الرئيسي
  const mainTypeSelect = document.getElementById("mainType");
  if (mainTypeSelect) {
    mainTypeSelect.addEventListener('change', onMainTypeChange);
  }
});
