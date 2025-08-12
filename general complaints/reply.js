// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let currentComplaint = null;
let responseTypes = [];
let availableStatuses = [];

// تحميل بيانات الشكوى
async function loadComplaintData() {
  try {
    console.log('بدء تحميل بيانات الشكوى...'); // إضافة رسالة تصحيح
    
    const selectedComplaint = localStorage.getItem("selectedComplaint");
    if (!selectedComplaint) {
      alert("لا توجد بيانات شكوى متاحة");
      goBack();
      return;
    }

    currentComplaint = JSON.parse(selectedComplaint);
    console.log('بيانات الشكوى:', currentComplaint);

    // تحميل أنواع الردود
    console.log('بدء تحميل أنواع الردود...'); // إضافة رسالة تصحيح
    const responseTypesResponse = await fetch(`${API_BASE_URL}/responses/response-types`);
    const responseTypesData = await responseTypesResponse.json();
    
    if (responseTypesData.success) {
      responseTypes = responseTypesData.data;
      populateResponseTypes();
      console.log('تم تحميل أنواع الردود:', responseTypes.length); // إضافة رسالة تصحيح
    }

    // تحميل الحالات المتاحة
    console.log('بدء تحميل الحالات المتاحة...'); // إضافة رسالة تصحيح
    const statusesResponse = await fetch(`${API_BASE_URL}/responses/statuses`);
    const statusesData = await statusesResponse.json();
    
    if (statusesData.success) {
      availableStatuses = statusesData.data;
      populateStatuses();
      console.log('تم تحميل الحالات المتاحة:', availableStatuses.length); // إضافة رسالة تصحيح
    }

    // تحميل الردود السابقة
    console.log('بدء تحميل الردود السابقة...'); // إضافة رسالة تصحيح
    await loadPreviousResponses();

    // عرض بيانات الشكوى
    console.log('بدء عرض بيانات الشكوى...'); // إضافة رسالة تصحيح
    displayComplaintInfo();

    console.log('تم تحميل جميع البيانات بنجاح'); // إضافة رسالة تصحيح

  } catch (error) {
    console.error('خطأ في تحميل بيانات الشكوى:', error);
    alert("خطأ في تحميل بيانات الشكوى");
  }
}

// عرض معلومات الشكوى
function displayComplaintInfo() {
  if (!currentComplaint) return;

  console.log('عرض معلومات الشكوى:', currentComplaint); // إضافة رسالة تصحيح

  // عرض رقم الشكوى
  const complaintNumberElement = document.getElementById('complaintNumber');
  if (complaintNumberElement) {
    complaintNumberElement.textContent = `#${currentComplaint.ComplaintID}`;
  }

  // عرض حالة الشكوى
  const statusElement = document.getElementById('complaintStatus');
  if (statusElement) {
    statusElement.textContent = currentComplaint.CurrentStatus || 'جديدة';
    statusElement.className = `badge ${getStatusClass(currentComplaint.CurrentStatus)}`;
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

  const medicalFileElement = document.getElementById('medicalFileNumber');
  if (medicalFileElement) {
    medicalFileElement.textContent = currentComplaint.NationalID_Iqama || 'غير محدد';
  }

  const complaintDateElement = document.getElementById('complaintDate');
  if (complaintDateElement && currentComplaint.ComplaintDate) {
    const complaintDate = new Date(currentComplaint.ComplaintDate);
    complaintDateElement.textContent = complaintDate.toLocaleDateString('ar-SA') + ' - ' + 
                                     complaintDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  }

  const complaintTypeElement = document.getElementById('complaintTypeName');
  if (complaintTypeElement) {
    complaintTypeElement.textContent = currentComplaint.ComplaintTypeName || 'غير محدد';
  }

  console.log('تم عرض معلومات الشكوى بنجاح'); // إضافة رسالة تصحيح
}

// ملء أنواع الردود
function populateResponseTypes() {
  const responseTypeSelect = document.getElementById('responseType');
  if (responseTypeSelect) {
    responseTypeSelect.innerHTML = '<option value="">اختر نوع الرد</option>';
    
    responseTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type.id;
      option.textContent = type.name;
      responseTypeSelect.appendChild(option);
    });
    
    console.log('تم ملء أنواع الردود:', responseTypes.length); // إضافة رسالة تصحيح
  }
}

// ملء الحالات المتاحة
function populateStatuses() {
  const statusSelect = document.getElementById('newStatus');
  if (statusSelect) {
    statusSelect.innerHTML = '<option value="">اختر الحالة الجديدة</option>';
    
    availableStatuses.forEach(status => {
      const option = document.createElement('option');
      option.value = status.id;
      option.textContent = status.name;
      option.className = `status-${status.color}`;
      statusSelect.appendChild(option);
    });
    
    console.log('تم ملء الحالات المتاحة:', availableStatuses.length); // إضافة رسالة تصحيح
  }
}

// تحميل الردود السابقة
async function loadPreviousResponses() {
  try {
    console.log('جلب الردود السابقة للشكوى:', currentComplaint.ComplaintID); // إضافة رسالة تصحيح
    
    const response = await fetch(`${API_BASE_URL}/responses/responses/${currentComplaint.ComplaintID}`);
    const data = await response.json();
    
    console.log('استجابة الردود السابقة:', data); // إضافة رسالة تصحيح
    
    if (data.success) {
      displayPreviousResponses(data.data);
      console.log('عدد الردود السابقة:', data.data.length); // إضافة رسالة تصحيح
    } else {
      console.error('خطأ في جلب الردود السابقة:', data.message);
    }
  } catch (error) {
    console.error('خطأ في تحميل الردود السابقة:', error);
  }
}

// عرض الردود السابقة
function displayPreviousResponses(responses) {
  const responsesContainer = document.getElementById('previousResponses');
  if (!responsesContainer) {
    console.error('لم يتم العثور على حاوية الردود السابقة'); // إضافة رسالة تصحيح
    return;
  }

  console.log('عرض الردود السابقة:', responses.length); // إضافة رسالة تصحيح

  if (responses.length === 0) {
    console.log('لا توجد ردود سابقة للعرض'); // إضافة رسالة تصحيح
    responsesContainer.innerHTML = '<p class="no-responses">لا توجد ردود سابقة</p>';
    return;
  }

  const responsesHTML = responses.map(response => {
    const responseDate = new Date(response.ResponseDate);
    const formattedDate = responseDate.toLocaleDateString('ar-SA') + ' - ' + 
                         responseDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    console.log('إنشاء رد سابق:', response.ResponseType); // إضافة رسالة تصحيح

    return `
      <div class="response-item">
        <div class="response-header">
          <span class="response-type">${response.ResponseType}</span>
          <span class="response-date">${formattedDate}</span>
          <span class="response-employee">${response.EmployeeName}</span>
        </div>
        <div class="response-content">
          ${response.ResponseText}
        </div>
      </div>
    `;
  }).join('');

  console.log('تم إنشاء HTML للردود السابقة'); // إضافة رسالة تصحيح
  responsesContainer.innerHTML = responsesHTML;
  console.log('تم عرض الردود السابقة بنجاح'); // إضافة رسالة تصحيح
}

// إضافة رد جديد
async function addResponse() {
  try {
    console.log('بدء إضافة رد جديد...'); // إضافة رسالة تصحيح
    
    const responseText = document.getElementById('responseText').value.trim();
    const responseType = document.getElementById('responseType').value;
    const newStatus = document.getElementById('newStatus').value;
    const notes = document.getElementById('notes').value.trim();

    console.log('بيانات الرد:', { responseText, responseType, newStatus, notes }); // إضافة رسالة تصحيح

    if (!responseText) {
      alert('يرجى إدخال نص الرد');
      document.getElementById('responseText').focus();
      return;
    }

    if (!responseType) {
      alert('يرجى اختيار نوع الرد');
      document.getElementById('responseType').focus();
      return;
    }

    // إظهار رسالة تحميل
    const sendBtn = document.querySelector('.btn-send');
    const originalText = sendBtn.textContent;
    sendBtn.textContent = 'جاري الإرسال...';
    sendBtn.disabled = true;

    // إضافة الرد
    const responseData = {
      complaintId: currentComplaint.ComplaintID,
      responseText: responseText,
      responseType: responseType,
      employeeId: 1 // سيتم تحديثه لاحقاً حسب المستخدم المسجل دخوله
    };

    console.log('إرسال بيانات الرد:', responseData); // إضافة رسالة تصحيح

    const response = await fetch(`${API_BASE_URL}/responses/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseData)
    });

    const data = await response.json();

    console.log('استجابة إضافة الرد:', data); // إضافة رسالة تصحيح

    if (data.success) {
      // تحديث الحالة إذا تم اختيارها
      if (newStatus) {
        console.log('تحديث الحالة إلى:', newStatus); // إضافة رسالة تصحيح
        await updateComplaintStatus(newStatus, notes);
      }

      // إظهار رسالة نجاح
      showSuccessMessage('تم إضافة الرد بنجاح');
      
      // إعادة تحميل الردود السابقة
      console.log('إعادة تحميل الردود السابقة...'); // إضافة رسالة تصحيح
      await loadPreviousResponses();
      
      // مسح النموذج
      clearForm();
      
      console.log('تم إضافة الرد بنجاح'); // إضافة رسالة تصحيح
      
    } else {
      showErrorMessage('خطأ في إضافة الرد: ' + data.message);
    }

  } catch (error) {
    console.error('خطأ في إضافة الرد:', error);
    showErrorMessage('حدث خطأ في الخادم');
  } finally {
    // إعادة تفعيل الزر
    const sendBtn = document.querySelector('.btn-send');
    sendBtn.textContent = originalText;
    sendBtn.disabled = false;
  }
}

// تحديث حالة الشكوى
async function updateComplaintStatus(newStatus, notes = '') {
  try {
    console.log('تحديث حالة الشكوى:', { newStatus, notes }); // إضافة رسالة تصحيح
    
    const response = await fetch(`${API_BASE_URL}/responses/status/${currentComplaint.ComplaintID}`, {
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

    console.log('استجابة تحديث الحالة:', data); // إضافة رسالة تصحيح

    if (data.success) {
      console.log('تم تحديث حالة الشكوى بنجاح'); // إضافة رسالة تصحيح
      // تحديث حالة الشكوى في الواجهة
      currentComplaint.CurrentStatus = newStatus;
      if (document.getElementById('complaintStatus')) {
        document.getElementById('complaintStatus').textContent = newStatus;
        document.getElementById('complaintStatus').className = `badge ${getStatusClass(newStatus)}`;
      }
    } else {
      console.error('خطأ في تحديث الحالة:', data.message);
    }

  } catch (error) {
    console.error('خطأ في تحديث الحالة:', error);
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

// تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  console.log('تم تحميل صفحة الرد على الشكوى'); // إضافة رسالة تصحيح
  loadComplaintData();
  
  // إعداد معالجة المرفقات
  setupFileAttachments();
});

// إعداد معالجة المرفقات
function setupFileAttachments() {
  const attachBtn = document.getElementById('attachBtn');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');

  if (attachBtn && fileInput && fileList) {
    attachBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      displaySelectedFiles(files);
    });
  }
}

// عرض الملفات المحددة
function displaySelectedFiles(files) {
  const fileList = document.getElementById('fileList');
  if (!fileList) return;

  fileList.innerHTML = '';

  files.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
      <span class="file-name">${file.name}</span>
      <span class="file-size">${formatFileSize(file.size)}</span>
      <button class="remove-file" onclick="removeFile(${index})">×</button>
    `;
    fileList.appendChild(fileItem);
  });
}

// إزالة ملف
function removeFile(index) {
  const fileInput = document.getElementById('fileInput');
  const dt = new DataTransfer();
  const files = Array.from(fileInput.files);
  
  files.splice(index, 1);
  files.forEach(file => dt.items.add(file));
  
  fileInput.files = dt.files;
  displaySelectedFiles(files);
}

// تنسيق حجم الملف
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// مسح النموذج
function clearForm() {
  document.getElementById('responseText').value = '';
  document.getElementById('responseType').value = '';
  document.getElementById('newStatus').value = '';
  document.getElementById('notes').value = '';
}

// إظهار رسالة نجاح
function showSuccessMessage(message) {
  // إنشاء عنصر الرسالة
  const messageDiv = document.createElement('div');
  messageDiv.className = 'success-message';
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4caf50;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    font-weight: 600;
  `;
  
  document.body.appendChild(messageDiv);
  
  // إزالة الرسالة بعد 3 ثوان
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 3000);
}

// إظهار رسالة خطأ
function showErrorMessage(message) {
  // إنشاء عنصر الرسالة
  const messageDiv = document.createElement('div');
  messageDiv.className = 'error-message';
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f44336;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    font-weight: 600;
  `;
  
  document.body.appendChild(messageDiv);
  
  // إزالة الرسالة بعد 5 ثوان
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 5000);
}

