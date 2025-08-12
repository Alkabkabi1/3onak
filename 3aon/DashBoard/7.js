let currentLang = localStorage.getItem('lang') || 'ar';
let generalRequestsChart;
let activeFilter = null;

const allChartData = {
  executed: [2, 3, 1, 2],
  notExecuted: [1, 2, 3, 2]
};

const labelsByLang = {
  ar: ['الشؤون الهندسية', 'العلاقات العامة', 'الخدمات التمريضية', 'الخدمات الطبية'],
  en: ['Engineering Affairs', 'Public Relations', 'Nursing Services', 'Medical Services']
};

const filterLabels = {
  executed: { ar: 'منفذة', en: 'Executed', color: 'green' },
  notExecuted: { ar: 'غير منفذة', en: 'Not Executed', color: 'red' }
};

function getFont() {
  return currentLang === 'ar' ? 'Tajawal' : 'serif';
}

function updateChartData() {
  const labels = labelsByLang[currentLang];
  const font = getFont();
  const datasets = [];

  if (!activeFilter || activeFilter === 'executed') {
    datasets.push({
      label: filterLabels.executed[currentLang],
      data: allChartData.executed,
      backgroundColor: '#4CAF50',
      borderColor: '#388e3c',
      borderWidth: 1,
      borderRadius: 5
    });
  }

  if (!activeFilter || activeFilter === 'notExecuted') {
    datasets.push({
      label: filterLabels.notExecuted[currentLang],
      data: allChartData.notExecuted,
      backgroundColor: '#F44336',
      borderColor: '#cc3636',
      borderWidth: 1,
      borderRadius: 5
    });
  }

  generalRequestsChart.data.labels = labels;
  generalRequestsChart.data.datasets = datasets;

  generalRequestsChart.options.plugins.tooltip.rtl = currentLang === 'ar';
  generalRequestsChart.options.plugins.tooltip.bodyFont.family = font;
  generalRequestsChart.options.plugins.tooltip.titleFont.family = font;

  generalRequestsChart.options.plugins.datalabels.font.family = font;
  generalRequestsChart.options.scales.x.ticks.font.family = font;
  generalRequestsChart.options.scales.y.ticks.font.family = font;

  generalRequestsChart.update();
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.remove('lang-ar', 'lang-en');
  document.body.classList.add(lang === 'ar' ? 'lang-ar' : 'lang-en');

  document.querySelectorAll('[data-ar]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  updateChartData();
}

document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('generalRequestsChart');

  // تحميل المكتبة المساعدة إذا موجودة
  if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
  }

  // إنشاء الرسم البياني
  generalRequestsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labelsByLang[currentLang],
      datasets: [] // سيتم تعبئتها في updateChartData
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: {
          rtl: currentLang === 'ar',
          bodyFont: { family: getFont() },
          titleFont: { family: getFont() }
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          color: '#fff',
          font: {
            weight: 'bold',
            size: 14,
            family: getFont()
          },
          formatter: value => (value > 0 ? value : '')
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 4,
          ticks: {
            stepSize: 1,
            font: { family: getFont() }
          },
          grid: {
            drawBorder: false,
            color: 'rgba(0, 0, 0, 0.08)'
          }
        },
        x: {
          ticks: {
            font: { family: getFont() }
          },
          grid: { display: false },
          barPercentage: 0.8,
          categoryPercentage: 0.8
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  updateChartData(); // رسم البيانات الابتدائية




  
  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }

  applyLanguage(currentLang); // تعيين اللغة المبدئية
});