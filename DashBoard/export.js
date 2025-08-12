// export.js

// ✅ تغيير تنسيق التقرير
const formatRadios = document.querySelectorAll('input[name="format"]');
const formatTypeElement = document.getElementById('formatType');
let selectedFormat = 'Excel';

formatRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    selectedFormat = radio.value;
    formatTypeElement.textContent = selectedFormat;
  });
});

// ✅ التعامل مع أزرار الفترات الزمنية
const dateButtons = document.querySelectorAll('.date-button button');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const dateSummary = document.getElementById('selected-period');

function formatDate(date) {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('ar', { month: 'long' });
  return `${day} ${month}`;
}

function updateDateRange(days) {
  const now = new Date();
  const fromDate = new Date();
  fromDate.setDate(now.getDate() - days + 1);

  const fromStr = fromDate.toISOString().split('T')[0];
  const toStr = now.toISOString().split('T')[0];

  dateFrom.value = fromStr;
  dateTo.value = toStr;

  dateSummary.textContent = `${formatDate(fromStr)} - ${formatDate(toStr)}`;
  
  // تحديث الإحصائيات عند تغيير التاريخ
  loadReportStats();
}

// ✅ تفعيل الزر المختار وتحديث التاريخ
function selectTime(selectedButton) {
  dateButtons.forEach(btn => btn.classList.remove('active'));
  selectedButton.classList.add('active');

  // تحديث الفترة تلقائيًا بناءً على الزر
  if (selectedButton.textContent.includes("اليوم")) {
    updateDateRange(1);
  } else if (selectedButton.textContent.includes("7")) {
    updateDateRange(7);
  } else if (selectedButton.textContent.includes("شهر")) {
    updateDateRange(30);
  }
}

// ✅ جلب إحصائيات التقرير من الباك إند
async function loadReportStats() {
  try {
    // إظهار حالة التحميل في الملخص
    document.getElementById('totalComplaints').textContent = 'جاري التحميل...';
    document.getElementById('repeatedCount').textContent = 'جاري التحميل...';
    document.getElementById('closedCount').textContent = 'جاري التحميل...';
    
    const fromDate = dateFrom.value;
    const toDate = dateTo.value;
    const includePatientData = document.getElementById('includePatientData').checked;
    const includeEmployeeData = document.getElementById('includeEmployeeData').checked;

    const params = new URLSearchParams({
      fromDate,
      toDate,
      includePatientData: includePatientData.toString(),
      includeEmployeeData: includeEmployeeData.toString()
    });

    const response = await fetch(`http://localhost:3001/api/reports/stats?${params}`);
    const result = await response.json();

    if (result.success) {
      updateSummaryStats(result.data);
    } else {
      console.error('خطأ في جلب الإحصائيات:', result.message);
      // إظهار رسالة خطأ
      document.getElementById('totalComplaints').textContent = 'خطأ';
      document.getElementById('repeatedCount').textContent = 'خطأ';
      document.getElementById('closedCount').textContent = 'خطأ';
    }
  } catch (error) {
    console.error('خطأ في الاتصال بالخادم:', error);
    // إظهار رسالة خطأ
    document.getElementById('totalComplaints').textContent = 'خطأ';
    document.getElementById('repeatedCount').textContent = 'خطأ';
    document.getElementById('closedCount').textContent = 'خطأ';
  }
}

// ✅ تحديث إحصائيات الملخص
function updateSummaryStats(data) {
  document.getElementById('totalComplaints').textContent = data.general.totalComplaints || 0;
  document.getElementById('repeatedCount').textContent = data.repeated.repeatedCount || 0;
  document.getElementById('closedCount').textContent = data.general.closedComplaints || 0;
}

// ✅ تفعيل الزر الافتراضي عند فتح الصفحة
window.onload = () => {
  if (dateButtons.length) selectTime(dateButtons[0]);
  
  // إضافة event listeners للـ checkboxes
  document.getElementById('includePatientData').addEventListener('change', loadReportStats);
  document.getElementById('includeEmployeeData').addEventListener('change', loadReportStats);
  
  // إضافة event listeners لأنواع البيانات
  const dataTypeCheckboxes = [
    'allComplaints',
    'repeatedComplaints', 
    'closedComplaints',
    'unansweredComplaints',
    'analysisSuggestions',
    'complaintAttachments'
  ];
  
  dataTypeCheckboxes.forEach(id => {
    document.getElementById(id).addEventListener('change', function() {
      if (id === 'allComplaints' && this.checked) {
        // إلغاء جميع الخيارات الأخرى عند اختيار "جميع الشكاوى"
        dataTypeCheckboxes.forEach(otherId => {
          if (otherId !== id) {
            document.getElementById(otherId).checked = false;
          }
        });
      } else if (id !== 'allComplaints' && this.checked) {
        // إلغاء "جميع الشكاوى" عند اختيار خيار آخر
        document.getElementById('allComplaints').checked = false;
      }
    });
  });
  
  // إضافة event listeners للتواريخ المخصصة
  dateFrom.addEventListener('change', function() {
    // إلغاء الأزرار المختارة عند تغيير التاريخ المخصص
    dateButtons.forEach(btn => btn.classList.remove('active'));
    loadReportStats();
  });
  
  dateTo.addEventListener('change', function() {
    // إلغاء الأزرار المختارة عند تغيير التاريخ المخصص
    dateButtons.forEach(btn => btn.classList.remove('active'));
    loadReportStats();
  });
};

// ✅ تنفيذ التصدير حسب التنسيق المختار
async function exportReport() {
  try {
    // التحقق من صحة البيانات
    if (!dateFrom.value || !dateTo.value) {
      alert('يرجى تحديد الفترة الزمنية');
      return;
    }
    
    if (new Date(dateFrom.value) > new Date(dateTo.value)) {
      alert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return;
    }
    
    // التحقق من اختيار نوع البيانات
    const selectedDataTypes = [];
    if (document.getElementById('allComplaints').checked) selectedDataTypes.push('all');
    if (document.getElementById('repeatedComplaints').checked) selectedDataTypes.push('repeated');
    if (document.getElementById('closedComplaints').checked) selectedDataTypes.push('closed');
    if (document.getElementById('unansweredComplaints').checked) selectedDataTypes.push('unanswered');
    if (document.getElementById('analysisSuggestions').checked) selectedDataTypes.push('analysis');
    if (document.getElementById('complaintAttachments').checked) selectedDataTypes.push('attachments');
    
    if (selectedDataTypes.length === 0) {
      alert('يرجى اختيار نوع البيانات المطلوب تصديرها');
      return;
    }
    
    // إظهار حالة التحميل
    const exportButton = document.querySelector('.export-button button');
    const originalText = exportButton.innerHTML;
    exportButton.innerHTML = '<img src="/icon/time.png" alt=""> جاري التصدير...';
    exportButton.disabled = true;
    
    // جمع إعدادات التقرير
    const reportSettings = {
      fromDate: dateFrom.value,
      toDate: dateTo.value,
      includePatientData: document.getElementById('includePatientData').checked,
      includeEmployeeData: document.getElementById('includeEmployeeData').checked,
      dataTypes: []
    };

    // جمع أنواع البيانات المطلوبة
    reportSettings.dataTypes = selectedDataTypes;

    // جلب البيانات من الباك إند
    const params = new URLSearchParams({
      fromDate: reportSettings.fromDate,
      toDate: reportSettings.toDate,
      includePatientData: reportSettings.includePatientData.toString(),
      includeEmployeeData: reportSettings.includeEmployeeData.toString(),
      dataTypes: reportSettings.dataTypes.join(',')
    });

    const response = await fetch(`http://localhost:3001/api/reports/export-data?${params}`);
    const result = await response.json();

    // جلب التحليل والاقتراحات إذا كانت مطلوبة
    let analysisData = null;
    if (reportSettings.dataTypes.includes('analysis')) {
      const analysisParams = new URLSearchParams({
        fromDate: reportSettings.fromDate,
        toDate: reportSettings.toDate
      });
      
      const analysisResponse = await fetch(`http://localhost:3001/api/reports/analysis?${analysisParams}`);
      const analysisResult = await analysisResponse.json();
      
      if (analysisResult.success) {
        analysisData = analysisResult.data;
      }
    }

    if (!result.success) {
      alert('خطأ في جلب بيانات التصدير: ' + result.message);
      return;
    }

    const fileName = `تقرير_${new Date().toLocaleDateString('ar-EG')}`;

    if (selectedFormat === 'PDF') {
      generatePDF(result.data, fileName, analysisData);
    } else {
      generateExcel(result.data, fileName, analysisData);
    }

    // رسالة نجاح
    alert(`تم تصدير التقرير بنجاح!\nاسم الملف: ${fileName}.${selectedFormat.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx'}`);

  } catch (error) {
    console.error('خطأ في التصدير:', error);
    alert('حدث خطأ أثناء التصدير');
  } finally {
    // إعادة الزر لحالته الأصلية
    const exportButton = document.querySelector('.export-button button');
    exportButton.innerHTML = '<img src="/icon/savew.png" alt=""> تصدير التقرير';
    exportButton.disabled = false;
  }
}

// ✅ إنشاء ملف PDF
function generatePDF(data, fileName, analysisData = null) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // إعداد الخط العربي
  doc.setFont('Arial');
  doc.setFontSize(16);
  
  // العنوان
  doc.text('تقرير تجربة المريض', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`الفترة: ${dateSummary.textContent}`, 20, 40);
  doc.text(`التنسيق: ${selectedFormat}`, 20, 50);
  doc.text(`عدد الشكاوى: ${data.complaints.length}`, 20, 60);
  
  // جدول الشكاوى
  if (data.complaints.length > 0) {
    let y = 80;
    doc.setFontSize(10);
    
    data.complaints.slice(0, 20).forEach((complaint, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(`شكوى ${index + 1}: ${complaint.ComplaintID}`, 20, y);
      doc.text(`الحالة: ${complaint.CurrentStatus}`, 20, y + 5);
      doc.text(`القسم: ${complaint.DepartmentName}`, 20, y + 10);
      y += 20;
    });
  }
  
  // إضافة التحليل والاقتراحات إذا كانت متوفرة
  if (analysisData && analysisData.suggestions) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('التحليل والاقتراحات', 105, 20, { align: 'center' });
    
    let y = 40;
    doc.setFontSize(10);
    
    analysisData.suggestions.forEach((suggestion, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(`${index + 1}. ${suggestion.title}`, 20, y);
      doc.text(suggestion.description, 20, y + 5);
      y += 15;
    });
  }
  
  doc.save(`${fileName}.pdf`);
}

// ✅ إنشاء ملف Excel
function generateExcel(data, fileName, analysisData = null) {
  const wb = XLSX.utils.book_new();
  
  // ورقة الشكاوى
  if (data.complaints.length > 0) {
    const complaintsData = data.complaints.map(complaint => [
      complaint.ComplaintID,
      complaint.ComplaintDate,
      complaint.CurrentStatus,
      complaint.DepartmentName,
      complaint.ComplaintType,
      complaint.ComplaintDetails?.substring(0, 100) || '',
      complaint.PatientName || '',
      complaint.NationalID || ''
    ]);
    
    complaintsData.unshift([
      'رقم الشكوى',
      'تاريخ التقديم',
      'الحالة',
      'القسم',
      'نوع الشكوى',
      'تفاصيل الشكوى',
      'اسم المريض',
      'الرقم الوطني'
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet(complaintsData);
    XLSX.utils.book_append_sheet(wb, ws, 'الشكاوى');
  }
  
  // ورقة الردود
  if (data.responses && data.responses.length > 0) {
    const responsesData = data.responses.map(response => [
      response.ComplaintID,
      response.ResponseDate,
      response.ResponseType,
      response.ResponseText?.substring(0, 100) || '',
      response.EmployeeName || ''
    ]);
    
    responsesData.unshift([
      'رقم الشكوى',
      'تاريخ الرد',
      'نوع الرد',
      'نص الرد',
      'اسم الموظف'
      ]);
    
    const ws = XLSX.utils.aoa_to_sheet(responsesData);
    XLSX.utils.book_append_sheet(wb, ws, 'الردود');
  }
  
  // ورقة المرفقات
  if (data.attachments && data.attachments.length > 0) {
    const attachmentsData = data.attachments.map(attachment => [
      attachment.ComplaintID,
      attachment.FileName,
      attachment.FileType,
      attachment.FileSize,
      attachment.FilePath
    ]);
    
    attachmentsData.unshift([
      'رقم الشكوى',
      'اسم الملف',
      'نوع الملف',
      'حجم الملف',
      'مسار الملف'
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet(attachmentsData);
    XLSX.utils.book_append_sheet(wb, ws, 'المرفقات');
  }
  
  // ورقة التحليل والاقتراحات
  if (analysisData && analysisData.suggestions) {
    const analysisDataArray = analysisData.suggestions.map(suggestion => [
      suggestion.title,
      suggestion.description,
      suggestion.priority,
      suggestion.type
    ]);
    
    analysisDataArray.unshift([
      'العنوان',
      'الوصف',
      'الأولوية',
      'النوع'
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet(analysisDataArray);
    XLSX.utils.book_append_sheet(wb, ws, 'التحليل والاقتراحات');
  }
  
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
