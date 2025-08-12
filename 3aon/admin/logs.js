// =====================
// 🔍 البحث داخل الجدول
// =====================
const searchInput = document.querySelector('.table-search input');
searchInput.addEventListener('input', function () {
  const value = this.value.toLowerCase();
  document.querySelectorAll('table tbody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(value) ? '' : 'none';
  });
});

// =====================
// 📤 تصدير PDF باستخدام html2pdf
// =====================
document.querySelector('.export-btn').addEventListener('click', () => {
  const element = document.querySelector('table'); // تصدير الجدول فقط
  const opt = {
    margin: 0.5,
    filename: 'شكاوى.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
});

// =====================
// 📝 تصدير Word باستخدام html-docx + FileSaver
// =====================
document.querySelector('.export-word').addEventListener('click', () => {
  const table = document.querySelector('table').outerHTML;
  const doc = window.htmlDocx.asBlob('<html><body>' + table + '</body></html>');
  saveAs(doc, 'شكاوى.docx');
});

// =====================
// 🗑️ حذف كل السجلات
// =====================
document.querySelector('.delete-btn').addEventListener('click', () => {
  const confirmDelete = confirm("هل تريد حذف جميع السجلات؟");
  if (confirmDelete) {
    document.querySelector('table tbody').innerHTML = '';
    alert("✅ تم حذف السجلات");
  }
});

// =====================
// ✅ زر الفلترة التجريبي
// =====================
document.querySelector('.filter-btn').addEventListener('click', () => {
  alert("⚠️ وظيفة الفلتر تجريبية فقط، اربطها بباكند لاحقًا");
});

// =====================
// 📄 ترقيم الصفحات (Pagination)
// =====================

const rowsPerPage = 5; // عدد السجلات لكل صفحة
const rows = Array.from(document.querySelectorAll('table tbody tr'));
const pagination = document.querySelector('.pages');
let currentPage = 1;

// عرض الصفحة الحالية
function displayPage(page) {
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  rows.forEach((row, index) => {
    row.style.display = index >= start && index < end ? '' : 'none';
  });
}

// بناء أزرار الترقيم
function setupPagination() {
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  pagination.innerHTML = '';

  // زر السابق
  const prev = document.createElement('button');
  prev.textContent = 'السابق';
  prev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      displayPage(currentPage);
      setupPagination();
    }
  };
  pagination.appendChild(prev);

  // أزرار الأرقام
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === currentPage) btn.classList.add('active');
    btn.onclick = () => {
      currentPage = i;
      displayPage(currentPage);
      setupPagination();
    };
    pagination.appendChild(btn);
  }

  // زر التالي
  const next = document.createElement('button');
  next.textContent = 'التالي';
  next.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayPage(currentPage);
      setupPagination();
    }
  };
  pagination.appendChild(next);
}

// تشغيل عند تحميل الصفحة
displayPage(currentPage);
setupPagination();
