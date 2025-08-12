// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// وظيفة لتوليد رقم الشكوى
function generateComplaintNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${randomNum}-${year}`;
}

// وظيفة لتنسيق التاريخ
function formatSubmissionDate() {
  const now = new Date();
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return now.toLocaleDateString('ar-SA', options);
}

// وظيفة لجلب اسم القسم من ID
async function getDepartmentName(departmentID) {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/departments`);
    const data = await response.json();
    
    if (data.success) {
      const department = data.data.find(dept => dept.DepartmentID == departmentID);
      return department ? department.DepartmentName : 'غير محدد';
    }
  } catch (error) {
    console.error('خطأ في جلب اسم القسم:', error);
  }
  return 'غير محدد';
}

// وظيفة لجلب اسم نوع الشكوى من ID
async function getComplaintTypeName(typeID) {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/types`);
    const data = await response.json();
    
    if (data.success) {
      const type = data.data.find(t => t.ComplaintTypeID == typeID);
      return type ? type.TypeName : 'غير محدد';
    }
  } catch (error) {
    console.error('خطأ في جلب نوع الشكوى:', error);
  }
  return 'غير محدد';
}

// وظيفة لجلب اسم التصنيف الفرعي من ID
async function getSubTypeName(subTypeID, complaintTypeID) {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/subtypes/${complaintTypeID}`);
    const data = await response.json();
    
    if (data.success) {
      const subType = data.data.find(st => st.SubTypeID == subTypeID);
      return subType ? subType.SubTypeName : 'غير محدد';
    }
  } catch (error) {
    console.error('خطأ في جلب التصنيف الفرعي:', error);
  }
  return 'غير محدد';
}

// وظيفة لتعبئة البيانات في الصفحة
async function populateComplaintData() {
  const data = JSON.parse(localStorage.getItem("complaint"));

  if (!data) {
    console.log('لا توجد بيانات شكوى');
    return;
  }

  // تعبئة رقم الشكوى وتاريخ الإرسال
  const complaintNumber = document.getElementById('complaint-number');
  const submissionDate = document.getElementById('submission-date');
  
  if (complaintNumber) {
    // استخدام رقم الشكوى الفعلي من قاعدة البيانات إذا كان متوفراً
    if (data.complaintID) {
      complaintNumber.textContent = `COMP-${data.complaintID.toString().padStart(5, '0')}`;
    } else {
      complaintNumber.textContent = generateComplaintNumber();
    }
  }
  
  if (submissionDate) {
    submissionDate.textContent = formatSubmissionDate();
  }

  // جلب الأسماء الفعلية من قاعدة البيانات
  const departmentName = await getDepartmentName(data.dept);
  const complaintTypeName = await getComplaintTypeName(data.mainType);
  const subTypeName = await getSubTypeName(data.subType, data.mainType);

  // تعبئة بيانات المريض
  const patientInfo = document.querySelector('.section-box');
  if (patientInfo) {
    patientInfo.innerHTML = `
      <div class="row"><span data-ar="الاسم:" data-en="Name:">الاسم:</span> ${data.name}</div>
      <div class="row"><span data-ar="رقم الهوية:" data-en="ID Number:">رقم الهوية:</span> ${data.id}</div>
      <div class="row"><span data-ar="الجنس:" data-en="Gender:">الجنس:</span> ${data.gender}</div>
      <div class="row"><span data-ar="رقم الجوال:" data-en="Mobile Number:">رقم الجوال:</span> ${data.mobile}</div>
    `;
  }

  // تعبئة تفاصيل الشكوى
  const complaintInfo = document.querySelectorAll('.section-box')[1];
  if (complaintInfo) {
    complaintInfo.innerHTML = `
      <div class="row"><span data-ar="القسم المتعلق:" data-en="Related Department:">القسم المتعلق:</span> ${departmentName}</div>
      <div class="row"><span data-ar="نوع الشكوى الرئيسي:" data-en="Main Complaint Type:">نوع الشكوى الرئيسي:</span> ${complaintTypeName}</div>
      <div class="row"><span data-ar="التصنيف الفرعي:" data-en="Subcategory:">التصنيف الفرعي:</span> ${subTypeName}</div>
      <div class="row"><span data-ar="تاريخ الزيارة:" data-en="Visit Date:">تاريخ الزيارة:</span> ${data.date}</div>
      <div class="row"><span data-ar="الوصف:" data-en="Description:">الوصف:</span> ${data.desc}</div>
    `;
  }

  // تعبئة المرفقات
  const attachmentBox = document.querySelector('.attachment-box');
  if (attachmentBox && data.attachments && data.attachments.length > 0) {
    const attachmentsHTML = data.attachments.map(attachment => {
      const isImage = attachment.type && attachment.type.startsWith('image/');
      return `
        <img src="/icon/${isImage ? 'image.png' : 'doc.png'}" alt="مرفق">
        ${attachment.name} - <a href="#" data-ar="تحميل الملف" data-en="Download">تحميل الملف</a>
      `;
    }).join('<br>');
    
    attachmentBox.innerHTML = attachmentsHTML;
  } else if (attachmentBox) {
    attachmentBox.innerHTML = `
      <img src="/icon/doc.png" alt="مرفق">
      لا توجد مرفقات - <a href="#" data-ar="تحميل الملف" data-en="Download">تحميل الملف</a>
    `;
  }

  // تعبئة حالة الشكوى
  const statusBox = document.querySelector('.status-box');
  if (statusBox) {
    const statusText = data.savedInDatabase ? 'قيد المعالجة' : 'جديدة';
    statusBox.innerHTML = `
      <div class="row"><span data-ar="الجهة المستلمة:" data-en="Receiving Department:">الجهة المستلمة:</span> إدارة الشكاوى - تجربة المريض</div>
      <div class="row"><span data-ar="تم التوجيه إلى:" data-en="Forwarded To:">تم التوجيه إلى:</span> ${departmentName}</div>
      <div class="row"><span data-ar="الرد:" data-en="Response:">الرد:</span> ${data.savedInDatabase ? 'تم حفظ الشكوى في قاعدة البيانات' : 'جديدة - بانتظار التقييم'}</div>
      <div class="row"><span data-ar="الحالة الحالية:" data-en="Current Status:">الحالة الحالية:</span> 
        <span class="badge" data-ar="${statusText}" data-en="${statusText}">${statusText}</span>
      </div>
    `;
  }

  // تحديث اللغة للعناصر الجديدة
  applyLanguage(currentLang);
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

// وظائف إضافية
function printPage() {
  window.print();
}

function goHome() {
  window.location.href = "/login/home.html";
}

function followUp() {
  const data = JSON.parse(localStorage.getItem("complaint"));
  if (data && data.id) {
    // حفظ رقم الهوية في localStorage للوصول إليه في صفحة المتابعة
    localStorage.setItem("patientNationalId", data.id);
    window.location.href = "/Complaints-followup/all-Complaints.html";
  } else {
    alert("لا توجد بيانات شكوى متاحة للمتابعة");
  }
}

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  applyLanguage(currentLang);

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }

  // تعبئة بيانات الشكوى
  populateComplaintData();
});
