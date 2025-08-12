// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let currentComplaint = null;
let availableStatuses = [];

// تحميل بيانات الشكوى
async function loadComplaintData() {
  try {
    const selectedComplaint = localStorage.getItem("selectedComplaint");
    if (!selectedComplaint) {
      alert("لا توجد بيانات شكوى متاحة");
      goBack();
      return;
    }

    currentComplaint = JSON.parse(selectedComplaint);
    console.log('بيانات الشكوى:', currentComplaint);

    // عرض بيانات الشكوى
    displayComplaintInfo();

  } catch (error) {
    console.error('خطأ في تحميل بيانات الشكوى:', error);
    alert("خطأ في تحميل بيانات الشكوى");
    goBack();
  }
}

// عرض معلومات الشكوى
function displayComplaintInfo() {
  if (!currentComplaint) return;

  // تنسيق رقم الشكوى مع padding
  const complaintNumber = String(currentComplaint.ComplaintID).padStart(6, '0');
  
  // عرض رقم الشكوى
  const complaintNumberElement = document.getElementById('complaintNumber');
  if (complaintNumberElement) {
    complaintNumberElement.textContent = `#${complaintNumber}`;
  }

  // عرض الحالة الحالية
  const currentStatusElement = document.getElementById('currentStatus');
  if (currentStatusElement) {
    currentStatusElement.value = currentComplaint.CurrentStatus || 'جديدة';
  }

  // إزالة الحالة الحالية من قائمة الخيارات
  updateStatusOptions();
}

// تحديث خيارات الحالة المتاحة
function updateStatusOptions() {
  const statusSelect = document.getElementById('newStatus');
  if (!statusSelect || !currentComplaint) return;

  // قائمة جميع الحالات المتاحة
  const allStatuses = [
    { value: 'جديدة', text: 'جديدة' },
    { value: 'قيد المراجعة', text: 'قيد المراجعة' },
    { value: 'قيد المعالجة', text: 'قيد المعالجة' },
    { value: 'تم الحل', text: 'تم الحل' },
    { value: 'مغلقة', text: 'مغلقة' }
  ];

  // مسح الخيارات الحالية
  statusSelect.innerHTML = '<option value="">اختر الحالة الجديدة</option>';

  // إضافة الحالات المتاحة (إزالة الحالة الحالية)
  allStatuses.forEach(status => {
    if (status.value !== currentComplaint.CurrentStatus) {
      const option = document.createElement('option');
      option.value = status.value;
      option.textContent = status.text;
      option.setAttribute('data-ar', status.text);
      option.setAttribute('data-en', status.text); // يمكن إضافة الترجمة الإنجليزية لاحقاً
      statusSelect.appendChild(option);
    }
  });
}

// تحديث حالة الشكوى
async function updateComplaintStatus() {
  try {
    const newStatus = document.getElementById('newStatus').value;
    const notes = document.getElementById('notes').value.trim();

    if (!newStatus) {
      alert('يرجى اختيار الحالة الجديدة');
      return;
    }

    if (newStatus === currentComplaint.CurrentStatus) {
      alert('الحالة المختارة هي نفس الحالة الحالية');
      return;
    }

    // تأكيد التغيير
    if (!confirm(`هل أنت متأكد من تغيير حالة الشكوى إلى "${newStatus}"؟`)) {
      return;
    }

    // إظهار رسالة التحميل
    const saveBtn = document.querySelector('.save-btn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'جاري الحفظ...';
    saveBtn.disabled = true;

    const response = await fetch(`${API_BASE_URL}/complaints/update-status/${currentComplaint.ComplaintID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newStatus: newStatus,
        notes: notes,
        employeeId: 1 // سيتم تحديثه لاحقاً حسب المستخدم المسجل دخوله
      })
    });

    const data = await response.json();

    if (data.success) {
      alert('تم تحديث حالة الشكوى بنجاح');
      
      // تحديث الحالة في الشكوى الحالية
      currentComplaint.CurrentStatus = newStatus;
      document.getElementById('currentStatus').value = newStatus;
      
      // تحديث البيانات في localStorage
      localStorage.setItem("selectedComplaint", JSON.stringify(currentComplaint));
      
      // تحديث قائمة الشكاوى في localStorage (إذا كانت موجودة)
      updateComplaintsListInStorage(currentComplaint.ComplaintID, newStatus);
      
      // إرسال إشعار للصفحات الأخرى عن التحديث
      localStorage.setItem('complaintStatusUpdated', JSON.stringify({
        complaintId: currentComplaint.ComplaintID,
        newStatus: newStatus,
        timestamp: Date.now()
      }));
      
      // مسح النموذج
      document.getElementById('newStatus').value = '';
      document.getElementById('notes').value = '';
      
      // إعادة ملء الحالات المتاحة
      updateStatusOptions();
      
      // العودة للصفحة السابقة بعد 2 ثانية
      setTimeout(() => {
        goBack();
      }, 2000);
      
    } else {
      alert('خطأ في تحديث الحالة: ' + (data.message || 'خطأ غير معروف'));
    }

  } catch (error) {
    console.error('خطأ في تحديث الحالة:', error);
    alert('حدث خطأ في الاتصال بالخادم');
  } finally {
    // إعادة تفعيل الزر
    const saveBtn = document.querySelector('.save-btn');
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }
}

// تحديث قائمة الشكاوى في localStorage
function updateComplaintsListInStorage(complaintId, newStatus) {
  try {
    // تحديث قائمة الشكاوى العامة (من general-complaints.js)
    const complaintsData = localStorage.getItem('complaintsData');
    if (complaintsData) {
      const complaints = JSON.parse(complaintsData);
      const updatedComplaints = complaints.map(complaint => {
        if (complaint.ComplaintID === complaintId) {
          return { ...complaint, CurrentStatus: newStatus };
        }
        return complaint;
      });
      localStorage.setItem('complaintsData', JSON.stringify(updatedComplaints));
    }

    // تحديث قائمة شكاوى المريض (من all-complaints.js)
    const patientComplaints = localStorage.getItem('patientComplaints');
    if (patientComplaints) {
      const complaints = JSON.parse(patientComplaints);
      const updatedComplaints = complaints.map(complaint => {
        if (complaint.ComplaintID === complaintId) {
          return { ...complaint, CurrentStatus: newStatus };
        }
        return complaint;
      });
      localStorage.setItem('patientComplaints', JSON.stringify(updatedComplaints));
    }
  } catch (error) {
    console.error('خطأ في تحديث قوائم الشكاوى:', error);
  }
}

// الحصول على كلاس CSS للحالة
function getStatusClass(status) {
  switch (status) {
    case 'جديدة':
      return 'blue';
    case 'قيد المراجعة':
    case 'قيد المعالجة':
      return 'yellow';
    case 'تم الرد':
    case 'تم الحل':
      return 'green';
    case 'مغلقة':
      return 'gray';
    default:
      return 'blue';
  }
}

// الذهاب للخلف
function goBack() {
  window.history.back();
}

// إضافة دعم اللغة
let currentLang = localStorage.getItem('lang') || 'ar';

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // الاتجاه واللغة
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

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

// تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }

  loadComplaintData();
});




