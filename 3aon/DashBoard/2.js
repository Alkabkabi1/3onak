let currentLang = localStorage.getItem('lang') || 'ar';

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

    // الاتجاه واللغة
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';

  document.querySelectorAll('[data-ar]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });

  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  }

  document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";

  updateFlatpickrLang();
  renderChart(currentLang);

  // ✅ تحديث جملة التاريخ عند تغيير اللغة
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const rangeText = document.getElementById("dateRangeText");

  if (from && to && rangeText) {
    rangeText.textContent = currentLang === 'ar'
      ? `من تاريخ: ${from} إلى تاريخ: ${to}`
      : `From Date: ${from} To Date: ${to}`;
  }
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

// ✅ تقويم Flatpickr متعدد اللغة
let fromDatePicker, toDatePicker;

function updateFlatpickrLang() {
  const locale = currentLang === 'ar' ? 'ar' : 'default';

  if (fromDatePicker) fromDatePicker.destroy();
  if (toDatePicker) toDatePicker.destroy();

  fromDatePicker = flatpickr("#fromDate", {
    dateFormat: "Y-m-d",
    locale: locale,
    allowInput: false,
    clickOpens: true
  });

  toDatePicker = flatpickr("#toDate", {
    dateFormat: "Y-m-d",
    locale: locale,
    allowInput: false,
    clickOpens: true
  });
}

// ✅ رسم الرسم البياني متعدد اللغة
let chartInstance;

function renderChart(lang) {
  const ctx = document.getElementById('complaintChart').getContext('2d');

  const labels = lang === 'en'
    ? ['Emergency Dept.', 'Women Surgery', 'Pharmacy', 'ICU']
    : ['قسم الطوارئ', 'قسم الجراحة نساء', 'قسم الصيدلية', 'قسم العناية المركزة'];

  const roles = lang === 'en'
    ? ['Doctor', 'Healthcare Practitioner', 'Nurse']
    : ['طبيب', 'ممارس صحي', 'ممرض/ة'];

  const title = lang === 'en'
    ? 'Misconduct Reports by Department and Role'
    : 'عدد بلاغات سوء التعامل حسب القسم و التخصص المهني';

  const yLabel = lang === 'en' ? 'Number of Reports' : 'عدد البلاغات';
  const xLabel = lang === 'en' ? 'Departments' : 'الأقسام';

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: roles[0],
          data: [4, 0, 1, 1],
          backgroundColor: '#0056d2'
        },
        {
          label: roles[1],
          data: [1, 1, 0, 1],
          backgroundColor: '#3399ff'
        },
        {
          label: roles[2],
          data: [1, 0, 1, 1],
          backgroundColor: '#99ccff'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 14 }
          }
        },
        title: {
          display: true,
          text: title,
          font: { size: 16 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: yLabel
          },
          ticks: { stepSize: 1 }
        },
        x: {
          title: {
            display: true,
            text: xLabel
          }
        }
      }
    }
  });
}

// ✅ زر الفلترة
document.getElementById("applyDateFilter").addEventListener("click", function () {
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const rangeText = document.getElementById("dateRangeText");

  // ✅ إذا التاريخين غير محددين
  if (!from || !to) {
    const warningMsg = currentLang === 'ar'
      ? 'يرجى اختيار التاريخين.'
      : 'Please select both dates.';
    alert(warningMsg);
    rangeText.textContent = '';
    return;
  }

  // ✅ نص التواريخ في الفقرة
  rangeText.textContent = currentLang === 'ar'
    ? `من تاريخ: ${from} إلى تاريخ: ${to}`
    : `From Date: ${from} To Date: ${to}`;

  // ✅ رسالة التأكيد
  const confirmMsg = currentLang === 'ar'
    ? `تم تطبيق الفلترة من: ${from} إلى: ${to}`
    : `Filter applied from: ${from} to: ${to}`;

  alert(confirmMsg);
});

