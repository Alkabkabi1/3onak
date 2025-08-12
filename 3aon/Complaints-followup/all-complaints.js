document.addEventListener('DOMContentLoaded', () => {
    // Basic functionality for "Apply Filters" button (for demonstration)
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            alert('Applying filters... (This would trigger data fetching in a real app)');
            // In a real application, you would collect filter values (date, department, type, search term)
            // and make an AJAX request to your backend to fetch filtered data.
            // Then, you would update the table tbody with the new data.
        });
    }

    // Basic functionality for pagination buttons (for demonstration)
    const paginationButtons = document.querySelectorAll('.pagination-btn');
    paginationButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'active' class from all buttons
            paginationButtons.forEach(btn => btn.classList.remove('active'));

            // Add 'active' class to the clicked button, unless it's a chevron
            if (!button.querySelector('.fas')) { // Check if it's not an icon (chevron)
                button.classList.add('active');
            }

            // In a real application, clicking a page number would fetch data for that page.
            if (button.textContent.trim() === '1') {
                console.log('Navigating to page 1');
            } else if (button.textContent.trim() === '2') {
                console.log('Navigating to page 2');
            } else if (button.textContent.trim() === '3') {
                console.log('Navigating to page 3');
            } else if (button.querySelector('.fa-chevron-right')) {
                console.log('Navigating to previous page');
            } else if (button.querySelector('.fa-chevron-left')) {
                console.log('Navigating to next page');
            }
        });
    });

    // Export Results functionality (for demonstration)
    const exportResults = document.querySelector('.export-results');
    if (exportResults) {
        exportResults.addEventListener('click', () => {
            alert('Exporting results... (In a real app, this would generate a CSV/Excel file)');
            // You would typically make an API call to your backend to generate and download the report.
        });
    }

});

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // إعداد اللغة والاتجاه
  document.documentElement.lang = lang;
  document.body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  document.body.classList.toggle('lang-ar', lang === 'ar');
  document.body.classList.toggle('lang-en', lang === 'en');

  // تغيير النصوص
  document.querySelectorAll('[data-ar]').forEach(el => {
    if (el.tagName === 'INPUT') {
      el.placeholder = el.getAttribute(`data-${lang}-placeholder`) || el.getAttribute(`data-${lang}`);
    } else {
      el.textContent = el.getAttribute(`data-${lang}`);
    }
  });

  // تغيير خاصية placeholder بشكل منفصل
  document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });

  // زر اللغة
  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  }

  // تغيير الخط
  document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";
  
  // إعادة ترتيب العناصر عند التبديل
  rearrangeForRTL(lang);
}
function rearrangeForRTL(lang) {
  // لحقل البحث
  const searchGroup = document.querySelector('.search-input-group');
  if (searchGroup) {
    searchGroup.style.direction = lang === 'ar' ? 'rtl' : 'ltr';
    searchGroup.style.textAlign = lang === 'ar' ? 'right' : 'left';
  }

  // لعناصر التفاصيل
  document.querySelectorAll('.details-link').forEach(link => {
    link.style.display = 'inline-block';
    link.style.margin = lang === 'ar' ? '0 0 0 10px' : '0 10px 0 0';
  });
}
document.addEventListener('DOMContentLoaded', () => {
  // استرجاع اللغة المحفوظة أو استخدام العربية افتراضياً
  const savedLang = localStorage.getItem('lang') || 'ar';
  applyLanguage(savedLang);

  // تعريف زر التبديل
  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }
});



function goBack() {
  window.history.back();
}

