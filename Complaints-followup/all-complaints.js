// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// التحقق من تسجيل الدخول
function checkAuthentication() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    alert('يجب تسجيل الدخول أولاً');
    window.location.href = '/login/login.html';
    return false;
  }
  
  return true;
}

// متغيرات عامة
let patientData = null;
let complaintsData = [];

// جلب شكاوى المريض أو الموظف حسب الصلاحيات
async function loadPatientComplaints() {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    let url, headers = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // تحديد المسار حسب نوع المستخدم
    if (user.roleID === 1 || user.username === 'admin') {
      // المدير: جلب جميع الشكاوي
      url = `${API_BASE_URL}/complaints/all`;
    } else {
      // المستخدم العادي: جلب شكاوى المريض
      const nationalId = localStorage.getItem("patientNationalId") || localStorage.getItem("patientId");
      
      if (!nationalId) {
        alert("لا يوجد رقم هوية للمريض");
        window.location.href = "/Complaints-followup/followup.html";
        return;
      }
      
      url = `${API_BASE_URL}/complaints/patient/${nationalId}`;
    }

    const response = await fetch(url, { headers });
    const data = await response.json();
    
    if (data.success) {
      // تحديد نوع البيانات حسب الاستجابة
      if (data.data && data.data.patient) {
        // استجابة شكاوى مريض محدد
        patientData = data.data.patient;
        complaintsData = data.data.complaints;
        updatePatientInfo();
      } else if (Array.isArray(data.data)) {
        // استجابة جميع الشكاوي (للمدير)
        patientData = { name: 'جميع المرضى', nationalId: 'المدير' };
        complaintsData = data.data;
        updatePatientInfoForAdmin();
      }
      
      // تحديث قائمة الشكاوى
      updateComplaintsTable();
      
    } else {
      alert("لا توجد شكاوى لعرضها");
      window.location.href = "/Complaints-followup/followup.html";
    }
  } catch (error) {
    console.error('خطأ في جلب شكاوى المريض:', error);
    alert("حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
    // إعادة توجيه لصفحة المتابعة في حالة الخطأ
    window.location.href = "/Complaints-followup/followup.html";
  }
}

// تحديث معلومات المريض للمدير
function updatePatientInfoForAdmin() {
  const patientNameEl = document.getElementById('patient-name');
  const patientIdEl = document.getElementById('patient-id');
  const complaintsCountEl = document.getElementById('complaints-count');
  
  if (patientNameEl) patientNameEl.textContent = 'جميع الشكاوي';
  if (patientIdEl) patientIdEl.textContent = 'جميع المرضى';
  if (complaintsCountEl) complaintsCountEl.textContent = complaintsData.length;
}

// تحديث معلومات المريض
function updatePatientInfo() {
  if (!patientData) return;

  // تحديث اسم المريض
  const patientNameElement = document.getElementById('patientName');
  if (patientNameElement) {
    patientNameElement.textContent = patientData.name;
  }

  // تحديث رقم الملف (رقم الهوية)
  const fileNumberElement = document.getElementById('patientId');
  if (fileNumberElement) {
    fileNumberElement.textContent = patientData.nationalId;
  }

  // تحديث عدد الشكاوى
  const complaintsCountElement = document.getElementById('complaintsCount');
  if (complaintsCountElement) {
    complaintsCountElement.textContent = complaintsData.length;
  }
}

// تحديث جدول الشكاوى
function updateComplaintsTable() {
  const tbody = document.querySelector('.complaint-list table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (complaintsData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
          <span data-ar="لا توجد شكاوى مسجلة" data-en="No complaints found">لا توجد شكاوى مسجلة</span>
        </td>
      </tr>
    `;
    return;
  }

  complaintsData.forEach(complaint => {
    const row = document.createElement('tr');
    
    // تنسيق رقم الشكوى مع padding
    const complaintNumber = String(complaint.ComplaintID).padStart(6, '0');
    
    // تنسيق التاريخ والوقت
    const complaintDate = new Date(complaint.ComplaintDate);
    const formattedDate = complaintDate.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const formattedTime = complaintDate.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const fullDateTime = `${formattedDate}<br><small style="color: #666;">${formattedTime}</small>`;
    
    // تنسيق حالة الشكوى
    const statusClass = getStatusClass(complaint.CurrentStatus);
    const statusText = getStatusText(complaint.CurrentStatus);
    
    row.innerHTML = `
      <td><strong>#${complaintNumber}</strong></td>
      <td>${complaint.ComplaintTypeName}</td>
      <td>${complaint.DepartmentName}</td>
      <td>${fullDateTime}</td>
      <td><span class="status-tag ${statusClass}" data-ar="${statusText}" data-en="${statusText}">${statusText}</span></td>
      <td>
        <a href="#" onclick="viewComplaintDetails(${complaint.ComplaintID})" class="details-link" data-ar="عرض التفاصيل" data-en="View Details">عرض التفاصيل</a>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// الحصول على كلاس CSS للحالة
function getStatusClass(status) {
  switch (status) {
    case 'جديدة':
      return 'status-new';
    case 'قيد المراجعة':
    case 'قيد المعالجة':
      return 'status-under-review';
    case 'مغلقة':
    case 'تم الحل':
      return 'status-closed';
    default:
      return 'status-new';
  }
}

// الحصول على نص الحالة
function getStatusText(status) {
  return status || 'جديدة';
}

// عرض تفاصيل الشكوى
function viewComplaintDetails(complaintId) {
  const complaint = complaintsData.find(c => c.ComplaintID === complaintId);
  if (complaint) {
    console.log('بيانات الشكوى المحددة:', complaint);
    // حفظ بيانات الشكوى في localStorage للوصول إليها في صفحة التفاصيل
    localStorage.setItem("selectedComplaint", JSON.stringify(complaint));
    console.log('تم حفظ البيانات في localStorage');
    window.location.href = "/general complaints/details.html";
  } else {
    console.log('لم يتم العثور على الشكوى:', complaintId);
  }
}

// تطبيق التصفية
function applyFilters() {
  const dateFilter = document.querySelector('input[type="date"]').value;
  const departmentFilter = document.querySelector('select').value;
  const complaintTypeFilter = document.querySelectorAll('select')[1].value;
  const searchFilter = document.getElementById('searchComplaint').value;

  let filteredComplaints = complaintsData;

  // تصفية حسب التاريخ
  if (dateFilter) {
    const filterDate = new Date(dateFilter);
    filteredComplaints = filteredComplaints.filter(complaint => {
      const complaintDate = new Date(complaint.ComplaintDate);
      return complaintDate.toDateString() === filterDate.toDateString();
    });
  }

  // تصفية حسب القسم
  if (departmentFilter && departmentFilter !== 'Department') {
    filteredComplaints = filteredComplaints.filter(complaint => 
      complaint.DepartmentName.includes(departmentFilter)
    );
  }

  // تصفية حسب نوع الشكوى
  if (complaintTypeFilter && complaintTypeFilter !== 'Complaint Type') {
    filteredComplaints = filteredComplaints.filter(complaint => 
      complaint.ComplaintTypeName.includes(complaintTypeFilter)
    );
  }

  // تصفية حسب البحث
  if (searchFilter) {
    filteredComplaints = filteredComplaints.filter(complaint => 
      complaint.ComplaintID.toString().includes(searchFilter)
    );
  }

  // تحديث الجدول بالبيانات المصفاة
  updateComplaintsTableWithData(filteredComplaints);
}

// تحديث الجدول ببيانات محددة
function updateComplaintsTableWithData(complaints) {
  const tbody = document.querySelector('.complaint-list table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (complaints.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
          <span data-ar="لا توجد نتائج مطابقة للبحث" data-en="No matching results found">لا توجد نتائج مطابقة للبحث</span>
        </td>
      </tr>
    `;
    return;
  }

  complaints.forEach(complaint => {
    const row = document.createElement('tr');
    
    // تنسيق رقم الشكوى مع padding
    const complaintNumber = String(complaint.ComplaintID).padStart(6, '0');
    
    // تنسيق التاريخ والوقت
    const complaintDate = new Date(complaint.ComplaintDate);
    const formattedDate = complaintDate.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const formattedTime = complaintDate.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const fullDateTime = `${formattedDate}<br><small style="color: #666;">${formattedTime}</small>`;
    
    const statusClass = getStatusClass(complaint.CurrentStatus);
    const statusText = getStatusText(complaint.CurrentStatus);
    
    row.innerHTML = `
      <td><strong>#${complaintNumber}</strong></td>
      <td>${complaint.ComplaintTypeName}</td>
      <td>${complaint.DepartmentName}</td>
      <td>${fullDateTime}</td>
      <td><span class="status-tag ${statusClass}" data-ar="${statusText}" data-en="${statusText}">${statusText}</span></td>
      <td>
        <a href="#" onclick="viewComplaintDetails(${complaint.ComplaintID})" class="details-link" data-ar="عرض التفاصيل" data-en="View Details">عرض التفاصيل</a>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// تصدير النتائج
function exportResults() {
  if (complaintsData.length === 0) {
    alert("لا توجد بيانات للتصدير");
    return;
  }

  // إنشاء ملف CSV
  let csvContent = "رقم الشكوى,نوع الشكوى,القسم,التاريخ,الوقت,الحالة\n";
  
  complaintsData.forEach(complaint => {
    // تنسيق رقم الشكوى
    const complaintNumber = String(complaint.ComplaintID).padStart(6, '0');
    
    // تنسيق التاريخ والوقت
    const complaintDate = new Date(complaint.ComplaintDate);
    const formattedDate = complaintDate.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const formattedTime = complaintDate.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    csvContent += `#${complaintNumber},${complaint.ComplaintTypeName},${complaint.DepartmentName},${formattedDate},${formattedTime},${complaint.CurrentStatus}\n`;
  });

  // تحميل الملف
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `شكاوى_المريض_${patientData?.name || 'غير_محدد'}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// العودة للصفحة السابقة
function goBack() {
  window.history.back();
}

// تطبيق اللغة
// مراقبة تحديثات حالة الشكاوى
function listenForStatusUpdates() {
  // مراقبة تغيير localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === 'complaintStatusUpdated') {
      const updateData = JSON.parse(e.newValue);
      if (updateData && updateData.complaintId) {
        console.log('تم اكتشاف تحديث حالة الشكوى:', updateData);
        updateComplaintStatusInUI(updateData.complaintId, updateData.newStatus);
      }
    }
  });

  // مراقبة التحديثات في نفس النافذة
  setInterval(() => {
    const updateData = localStorage.getItem('complaintStatusUpdated');
    if (updateData) {
      const parsed = JSON.parse(updateData);
      const timeDiff = Date.now() - parsed.timestamp;
      
      // إذا كان التحديث حديث (أقل من 5 ثواني) وليس من نفس الصفحة
      if (timeDiff < 5000 && !window.complaintStatusUpdateProcessed) {
        console.log('تم اكتشاف تحديث حالة محلي:', parsed);
        updateComplaintStatusInUI(parsed.complaintId, parsed.newStatus);
        window.complaintStatusUpdateProcessed = true;
        
        // إزالة العلامة بعد 10 ثواني
        setTimeout(() => {
          window.complaintStatusUpdateProcessed = false;
        }, 10000);
      }
    }
  }, 1000);
}

// تحديث حالة الشكوى في الواجهة
function updateComplaintStatusInUI(complaintId, newStatus) {
  // البحث عن الشكوى في البيانات المحملة
  const complaintIndex = complaintsData.findIndex(c => c.ComplaintID === complaintId);
  if (complaintIndex !== -1) {
    // تحديث البيانات
    complaintsData[complaintIndex].CurrentStatus = newStatus;
    
    // إعادة عرض الشكاوى لتظهر التحديثات
    updateComplaintsTable();
    
    console.log(`تم تحديث حالة الشكوى ${complaintId} إلى ${newStatus} في صفحة المريض`);
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

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  // التحقق من تسجيل الدخول أولاً
  if (!checkAuthentication()) {
    return;
  }
  
  applyLanguage(currentLang);

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }

  // إضافة مستمع لزر تطبيق التصفية
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', applyFilters);
  }

  // بدء مراقبة تحديثات الحالة
  listenForStatusUpdates();

  // تحميل شكاوى المريض
  loadPatientComplaints();
});

