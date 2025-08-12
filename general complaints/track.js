// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let currentComplaint = null;
let complaintHistory = [];

// مراقبة تحديثات حالة الشكاوى
function listenForStatusUpdates() {
  // مراقبة تغيير localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === 'complaintStatusUpdated') {
      const updateData = JSON.parse(e.newValue);
      if (updateData && updateData.complaintId && currentComplaint && currentComplaint.ComplaintID === updateData.complaintId) {
        console.log('تم اكتشاف تحديث حالة الشكوى في التتبع:', updateData);
        updateComplaintStatusInTracking(updateData.newStatus);
      }
    }
  });

  // مراقبة التحديثات في نفس النافذة
  setInterval(() => {
    const updateData = localStorage.getItem('complaintStatusUpdated');
    if (updateData) {
      const parsed = JSON.parse(updateData);
      const timeDiff = Date.now() - parsed.timestamp;
      
      // إذا كان التحديث حديث وللشكوى المعروضة حالياً
      if (timeDiff < 5000 && !window.complaintStatusUpdateProcessed && 
          currentComplaint && currentComplaint.ComplaintID === parsed.complaintId) {
        console.log('تم اكتشاف تحديث حالة محلي في التتبع:', parsed);
        updateComplaintStatusInTracking(parsed.newStatus);
        window.complaintStatusUpdateProcessed = true;
        
        // إزالة العلامة بعد 10 ثواني
        setTimeout(() => {
          window.complaintStatusUpdateProcessed = false;
        }, 10000);
      }
    }
  }, 1000);
}

// تحديث حالة الشكوى في صفحة التتبع
function updateComplaintStatusInTracking(newStatus) {
  if (!currentComplaint) return;

  const oldStatus = currentComplaint.CurrentStatus;
  
  // تحديث البيانات
  currentComplaint.CurrentStatus = newStatus;

  // تحديث العرض في الواجهة
  const statusElement = document.getElementById('complaintStatus');
  if (statusElement) {
    statusElement.textContent = newStatus;
    statusElement.setAttribute('data-ar', newStatus);
    statusElement.setAttribute('data-en', newStatus);
    statusElement.className = `status-badge ${getStatusClass(newStatus)}`;
  }

  // تحديث آخر تحديث
  updateLastUpdateTime();

  // تحديث timeline status
  updateTimelineStatus(newStatus);

  // تحديث معلومات الموظف المعتمد
  const approvedByElement = document.getElementById('approvedByEmployee');
  if (approvedByElement) {
    if (currentComplaint.EmployeeName && currentComplaint.EmployeeName.trim() !== '') {
      const approvedText = `الموظف المعتمد: ${currentComplaint.EmployeeName}`;
      approvedByElement.textContent = approvedText;
      approvedByElement.setAttribute('data-ar', approvedText);
      approvedByElement.style.display = 'block';
    } else {
      approvedByElement.style.display = 'none';
    }
  }

  // تحديث localStorage
  localStorage.setItem("selectedComplaint", JSON.stringify(currentComplaint));

  // تحديث الملاحظات (قد تكون تحدثت بناءً على التغيير)
  updateStatusNotes();

  // إظهار رسالة تنبيه للمستخدم
  showStatusUpdateNotification(oldStatus, newStatus);

  console.log(`تم تحديث حالة الشكوى في صفحة التتبع من "${oldStatus}" إلى "${newStatus}"`);
}

// تحديث وقت آخر تحديث
function updateLastUpdateTime() {
  const now = new Date();
  const formattedDateTime = now.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) + ' - الساعة ' + now.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // تحديث جميع عناصر آخر تحديث
  const lastUpdateElements = document.querySelectorAll('.last-update, .timestamp');
  lastUpdateElements.forEach(element => {
    element.textContent = `آخر تحديث: ${formattedDateTime}`;
    element.setAttribute('data-ar', `آخر تحديث: ${formattedDateTime}`);
  });
}

// بناء timeline بمراحل منطقية ثابتة
function buildDynamicTimeline() {
  const timelineContainer = document.getElementById('timelineSteps');
  if (!timelineContainer) return;

  // تحديد المراحل المنطقية للشكوى
  const logicalStages = [
    { stage: 'تم تقديم الشكوى', icon: '/icon/Done 1.png' },
    { stage: 'تم الرد', icon: '/icon/FRAME (1).png' },
    { stage: 'تم الحل', icon: '/icon/FRAME (1).png' },
    { stage: 'مغلقة', icon: '/icon/FRAME 3.png' }
  ];

  // جمع المراحل الموجودة فعلياً من التاريخ والحالة الحالية
  let achievedStages = new Set(['تم تقديم الشكوى']); // دائماً موجود
  
  // إضافة المراحل من سجل التاريخ
  if (complaintHistory && complaintHistory.length > 0) {
    complaintHistory.forEach(historyItem => {
      // تطبيع أسماء المراحل
      const normalizedStage = normalizeStage(historyItem.Stage);
      if (normalizedStage) {
        achievedStages.add(normalizedStage);
      }
    });
  }
  
  // إضافة الحالة الحالية
  const currentStatus = currentComplaint.CurrentStatus || 'جديدة';
  const normalizedCurrentStatus = normalizeStage(currentStatus);
  if (normalizedCurrentStatus) {
    achievedStages.add(normalizedCurrentStatus);
  }

  // تحديد آخر مرحلة تم تحقيقها
  let lastAchievedIndex = -1;
  logicalStages.forEach((stage, index) => {
    if (achievedStages.has(stage.stage)) {
      lastAchievedIndex = index;
    }
  });

  // بناء HTML للـ timeline
  let timelineHTML = '';
  logicalStages.forEach((stage, index) => {
    const isLast = index === logicalStages.length - 1;
    let status = '';
    
    if (index < lastAchievedIndex) {
      status = 'done';
    } else if (index === lastAchievedIndex) {
      status = stage.stage === 'مغلقة' ? 'done' : 'active';
    }
    // المراحل التي لم تتحقق بعد تبقى فارغة
    
    timelineHTML += `
      <div class="step-icon ${status}">
        <img src="${stage.icon}" alt="${stage.stage}" />
        <p data-ar="${stage.stage}" data-en="${stage.stage}">${stage.stage}</p>
      </div>
    `;
    
    // إضافة خط الربط إذا لم تكن الخطوة الأخيرة
    if (!isLast) {
      const lineClass = status === 'done' ? 'active' : '';
      timelineHTML += `<div class="step-line ${lineClass}"></div>`;
    }
  });

  timelineContainer.innerHTML = timelineHTML;
}

// تطبيع أسماء المراحل للتوافق مع المراحل المنطقية
function normalizeStage(stage) {
  const stageMap = {
    'جديدة': null, // لا نعرضها في timeline لأن "تقديم الشكوى" يكفي
    'قيد المراجعة': null, // مرحلة وسطية
    'قيد المعالجة': null, // مرحلة وسطية
    'تم الرد': 'تم الرد',
    'تم الحل': 'تم الحل',
    'مغلقة': 'مغلقة'
  };
  
  return stageMap[stage] || null;
}

// الحصول على أيقونة مناسبة لكل مرحلة
function getIconForStage(stage) {
  const stageIcons = {
    'جديدة': '/icon/Done 1.png',
    'قيد المراجعة': '/icon/FRAME (2).png',
    'قيد المعالجة': '/icon/FRAME (2).png',
    'تم الرد': '/icon/FRAME (1).png',
    'تم الحل': '/icon/FRAME (1).png',
    'مغلقة': '/icon/FRAME 3.png',
    'تحديث الحالة': '/icon/FRAME (2).png'
  };
  
  return stageIcons[stage] || '/icon/FRAME (2).png';
}

// تحديث timeline (دالة مبسطة للتوافق مع الكود الموجود)
function updateTimelineStatus(status) {
  // إعادة بناء الـ timeline بالكامل
  buildDynamicTimeline();
}

// تحديث ملاحظات الحالة من سجل التاريخ
function updateStatusNotes() {
  const statusNotesElement = document.getElementById('statusNotes');
  if (!statusNotesElement) return;

  // البحث عن آخر ملاحظة في سجل التاريخ
  if (complaintHistory && complaintHistory.length > 0) {
    // البحث عن آخر إدخال له ملاحظات
    const latestEntryWithRemarks = complaintHistory.find(entry => 
      entry.Remarks && entry.Remarks.trim() !== '' && entry.Remarks !== 'لا توجد تفاصيل إضافية'
    );
    
    if (latestEntryWithRemarks) {
      statusNotesElement.textContent = latestEntryWithRemarks.Remarks;
      statusNotesElement.setAttribute('data-ar', latestEntryWithRemarks.Remarks);
      statusNotesElement.style.display = 'block';
    } else {
      // إخفاء العنصر إذا لم تكن هناك ملاحظات
      statusNotesElement.style.display = 'none';
    }
  } else {
    // إخفاء العنصر إذا لم يكن هناك سجل تاريخ
    statusNotesElement.style.display = 'none';
  }
}

// إظهار رسالة تنبيه عن تحديث الحالة
function showStatusUpdateNotification(oldStatus, newStatus) {
  // إنشاء رسالة تنبيه مؤقتة
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 9999;
    font-family: 'Tajawal', sans-serif;
    font-size: 14px;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;
  
  notification.innerHTML = `
    <strong>تم تحديث حالة الشكوى</strong><br>
    من: ${oldStatus}<br>
    إلى: <strong>${newStatus}</strong>
  `;

  // إضافة CSS للرسوم المتحركة
  if (!document.getElementById('notification-style')) {
    const style = document.createElement('style');
    style.id = 'notification-style';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // إزالة الرسالة بعد 4 ثواني
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// تحميل بيانات الشكوى والتاريخ
async function loadComplaintData() {
  try {
    console.log('بدء تحميل بيانات الشكوى...'); // إضافة رسالة تصحيح
    
    const selectedComplaint = localStorage.getItem("selectedComplaint");
    if (!selectedComplaint) {
      alert("لا توجد بيانات شكوى متاحة");
      goBack();
      return;
    }

    const complaintFromStorage = JSON.parse(selectedComplaint);
    console.log('بيانات الشكوى من localStorage:', complaintFromStorage);

    // جلب البيانات الكاملة من API للحصول على EmployeeName
    try {
      const response = await fetch(`${API_BASE_URL}/complaints/details/${complaintFromStorage.ComplaintID}`);
      const data = await response.json();
      
      if (data.success) {
        currentComplaint = data.data.complaint;
        console.log('بيانات الشكوى الكاملة من API:', currentComplaint);
        
        // تحديث localStorage بالبيانات الكاملة
        localStorage.setItem("selectedComplaint", JSON.stringify(currentComplaint));
      } else {
        console.log('فشل API، استخدام البيانات من localStorage');
        currentComplaint = complaintFromStorage;
      }
    } catch (apiError) {
      console.error('خطأ في API، استخدام البيانات من localStorage:', apiError);
      currentComplaint = complaintFromStorage;
    }

    // تحميل سجل التاريخ
    console.log('بدء تحميل سجل التاريخ...'); // إضافة رسالة تصحيح
    await loadComplaintHistory();

    // عرض بيانات الشكوى
    console.log('بدء عرض بيانات الشكوى...'); // إضافة رسالة تصحيح
    displayComplaintInfo();

    console.log('تم تحميل البيانات بنجاح'); // إضافة رسالة تصحيح

  } catch (error) {
    console.error('خطأ في تحميل بيانات الشكوى:', error);
    alert("خطأ في تحميل بيانات الشكوى");
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

  const complaintNumber2Element = document.getElementById('complaintNumber2');
  if (complaintNumber2Element) {
    complaintNumber2Element.textContent = `#${complaintNumber}`;
  }

  // عرض حالة الشكوى
  const statusElement = document.getElementById('complaintStatus');
  if (statusElement) {
    const status = currentComplaint.CurrentStatus || 'جديدة';
    statusElement.textContent = status;
    statusElement.setAttribute('data-ar', status);
    statusElement.setAttribute('data-en', status);
    statusElement.className = `status-badge ${getStatusClass(currentComplaint.CurrentStatus)}`;
  }

  // بناء timeline إذا لم يتم بناؤه من التاريخ بعد
  if (!document.querySelector('#timelineSteps .step-icon')) {
    buildDynamicTimeline();
  }

  // عرض تفاصيل الشكوى
  const detailsElement = document.getElementById('complaintDetails');
  if (detailsElement) {
    detailsElement.textContent = currentComplaint.ComplaintDetails || 'لا توجد تفاصيل';
  }

  // عرض معلومات المريض
  const patientNameElement = document.getElementById('patientName');
  if (patientNameElement) {
    patientNameElement.textContent = currentComplaint.PatientName || 'غير محدد';
  }

  const patientIdElement = document.getElementById('patientId');
  if (patientIdElement) {
    patientIdElement.textContent = currentComplaint.NationalID_Iqama || 'غير محدد';
  }

  const medicalFileElement = document.getElementById('medicalFileNumber');
  if (medicalFileElement) {
    medicalFileElement.textContent = currentComplaint.NationalID_Iqama || 'غير محدد';
  }

  const mobileElement = document.getElementById('mobileNumber');
  if (mobileElement) {
    mobileElement.textContent = currentComplaint.ContactNumber || 'غير محدد';
  }

  const departmentElement = document.getElementById('departmentName');
  if (departmentElement) {
    departmentElement.textContent = currentComplaint.DepartmentName || 'غير محدد';
  }

  // عرض الموظف المسؤول
  const responsibleEmployeeElement = document.getElementById('responsibleEmployee');
  if (responsibleEmployeeElement) {
    responsibleEmployeeElement.textContent = currentComplaint.EmployeeName || 'غير محدد';
  }

  // عرض تاريخ إنشاء الشكوى مع تحسين التنسيق
  const creationDateElement = document.getElementById('creationDate');
  if (creationDateElement && currentComplaint.ComplaintDate) {
    const creationDate = new Date(currentComplaint.ComplaintDate);
    const formattedDate = creationDate.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = creationDate.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const fullDateTime = `${formattedDate} - الساعة ${formattedTime}`;
    creationDateElement.textContent = fullDateTime;
  }

  // عرض تصنيف ونوع الشكوى
  const categoryElement = document.getElementById('complaintCategory');
  if (categoryElement) {
    if (currentComplaint.SubTypeName && currentComplaint.SubTypeName.trim() !== '') {
      const categoryText = `التصنيف: ${currentComplaint.SubTypeName}`;
      categoryElement.textContent = categoryText;
      categoryElement.setAttribute('data-ar', categoryText);
      categoryElement.style.display = 'inline';
    } else {
      categoryElement.style.display = 'none';
    }
  }

  const typeElement = document.getElementById('complaintType');
  if (typeElement) {
    if (currentComplaint.ComplaintTypeName && currentComplaint.ComplaintTypeName.trim() !== '') {
      const typeText = `نوع الشكوى: ${currentComplaint.ComplaintTypeName}`;
      typeElement.textContent = typeText;
      typeElement.setAttribute('data-ar', typeText);
      typeElement.style.display = 'inline';
    } else {
      typeElement.style.display = 'none';
    }
  }

  // عرض معلومات الحالة الحالية
  const approvedByElement = document.getElementById('approvedByEmployee');
  if (approvedByElement) {
    if (currentComplaint.EmployeeName && currentComplaint.EmployeeName.trim() !== '') {
      const approvedText = `الموظف المعتمد: ${currentComplaint.EmployeeName}`;
      approvedByElement.textContent = approvedText;
      approvedByElement.setAttribute('data-ar', approvedText);
      approvedByElement.style.display = 'block';
    } else {
      approvedByElement.style.display = 'none';
    }
  }

  // عرض آخر ملاحظة من سجل التاريخ
  updateStatusNotes();

  // تحديث آخر تحديث بالوقت الحالي
  updateLastUpdateTime();
}

// تحميل سجل التاريخ
async function loadComplaintHistory() {
  try {
    console.log('جلب التاريخ للشكوى:', currentComplaint.ComplaintID); // إضافة رسالة تصحيح
    
    // استخدام endpoint الصحيح والتعامل مع عدم وجود جدول التاريخ
    const response = await fetch(`${API_BASE_URL}/complaints/details/${currentComplaint.ComplaintID}`);
    const data = await response.json();
    
    console.log('استجابة التاريخ:', data); // إضافة رسالة تصحيح
    
    if (data.success && data.data.complaint.history) {
      complaintHistory = data.data.complaint.history;
      console.log('عدد سجلات التاريخ:', complaintHistory.length); // إضافة رسالة تصحيح
      displayComplaintHistory();
    } else {
      console.log('لا يوجد سجل تاريخ أو جدول التاريخ غير موجود');
      complaintHistory = [];
      displayComplaintHistory();
    }
  } catch (error) {
    console.error('خطأ في تحميل سجل التاريخ:', error);
    complaintHistory = [];
    displayComplaintHistory();
  }
}

// عرض سجل التاريخ
function displayComplaintHistory() {
  console.log('بدء عرض سجل التاريخ...'); // إضافة رسالة تصحيح
  
  const historyContainer = document.getElementById('historyContainer');
  if (!historyContainer) {
    console.error('لم يتم العثور على حاوية التاريخ'); // إضافة رسالة تصحيح
    return;
  }

  console.log('عدد سجلات التاريخ للعرض:', complaintHistory.length); // إضافة رسالة تصحيح

  if (complaintHistory.length === 0) {
    console.log('لا توجد سجلات تاريخ للعرض'); // إضافة رسالة تصحيح
    historyContainer.innerHTML = '<tr><td colspan="4" class="no-history">لا يوجد سجل تاريخ لهذه الشكوى</td></tr>';
    
    // بناء timeline حتى لو لم يكن هناك تاريخ (فقط خطوة تقديم الشكوى)
    buildDynamicTimeline();
    updateStatusNotes();
    return;
  }

  const historyHTML = complaintHistory.map(history => {
    const actionDate = new Date(history.Timestamp);
    const formattedDate = actionDate.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = actionDate.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const fullDateTime = `${formattedDate}<br><small style="color: #666;">${formattedTime}</small>`;

    console.log('إنشاء صف للتاريخ:', history.Stage); // إضافة رسالة تصحيح

    return `
      <tr>
        <td>${history.Remarks || 'لا توجد تفاصيل إضافية'}</td>
        <td>${history.EmployeeName || 'غير محدد'}</td>
        <td>${fullDateTime}</td>
        <td><strong>${history.Stage}</strong>
            ${history.OldStatus && history.NewStatus ? 
              `<br><small style="color: #666;">${history.OldStatus} → ${history.NewStatus}</small>` : 
              ''
            }
        </td>
      </tr>
    `;
  }).join('');

  console.log('تم إنشاء HTML للتاريخ'); // إضافة رسالة تصحيح
  historyContainer.innerHTML = historyHTML;
  console.log('تم عرض سجل التاريخ بنجاح'); // إضافة رسالة تصحيح
  
  // بناء الـ timeline الديناميكي
  buildDynamicTimeline();
  
  // تحديث ملاحظات الحالة بعد تحميل التاريخ
  updateStatusNotes();
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

// طباعة الصفحة
function printPage() {
  window.print();
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

  // بدء مراقبة تحديثات الحالة
  listenForStatusUpdates();

  loadComplaintData();
});





