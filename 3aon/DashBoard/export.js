// export.js

// ✅ تغيير تنسيق التقرير
const formatRadios = document.querySelectorAll('input[name="format"]');
const formatTypeElement = document.getElementById('formatType');
let selectedFormat = 'Excel';

formatRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    selectedFormat = radio.nextElementSibling.alt;
    formatTypeElement.textContent = selectedFormat;
  });
});

// ✅ التعامل مع أزرار الفترات الزمنية
const dateButtons = document.querySelectorAll('.date-button button');
const dateFrom = document.querySelector('input[type="date"]:first-of-type');
const dateTo = document.querySelector('input[type="date"]:last-of-type');
const dateSummary = document.getElementById('selected-period'); // تم تغييره لتطابق العنصر الصحيح

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

// ✅ تفعيل الزر الافتراضي عند فتح الصفحة
window.onload = () => {
  if (dateButtons.length) selectTime(dateButtons[0]);
};

// ✅ تنفيذ التصدير حسب التنسيق المختار
function exportReport() {
  const fileName = `تقرير_${new Date().toLocaleDateString('ar-EG')}`;

  if (selectedFormat === 'PDF') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("تقرير تجربة المريض", 10, 10);
    doc.text(`الفترة: ${dateSummary.textContent}`, 10, 20);
    doc.text(`التنسيق: ${selectedFormat}`, 10, 30);
    doc.save(`${fileName}.pdf`);
  } else {
    const wb = XLSX.utils.book_new();
    const wsData = [["التنسيق", selectedFormat], ["الفترة", dateSummary.textContent]];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }
}
