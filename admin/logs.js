// متغيرات عامة
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let currentFilters = {};
let currentLang = 'ar';

// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthentication();
  await loadInitialData();
  setupEventListeners();
  applyLanguage(currentLang);
});

// التحقق من المصادقة والصلاحيات
async function checkAuthentication() {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user) {
      window.location.href = '/login/login.html';
      return;
    }

    // التحقق من صلاحيات المدير
    if (user.RoleID !== 1 && user.Username?.toLowerCase() !== 'admin') {
      alert('ليس لديك صلاحية للوصول لهذه الصفحة');
      window.location.href = '/login/home.html';
      return;
    }

  } catch (error) {
    console.error('خطأ في التحقق من المصادقة:', error);
    window.location.href = '/login/login.html';
  }
}

// تحميل البيانات الأولية
async function loadInitialData() {
  showLoading();
  try {
    await Promise.all([
      loadLogs(),
      loadStats()
    ]);
  } catch (error) {
    console.error('خطأ في تحميل البيانات:', error);
    showError('حدث خطأ في تحميل البيانات');
  } finally {
    hideLoading();
  }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
  // البحث
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.search = e.target.value;
        currentPage = 1;
        loadLogs();
      }, 500);
    });
  }

  // تبديل اللغة
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(currentLang);
    });
  }

  // تاريخ من وإلى (تعيين القيم الافتراضية)
  const dateFrom = document.getElementById('dateFrom');
  const dateTo = document.getElementById('dateTo');
  if (dateFrom && dateTo) {
    // تعيين آخر 30 يوم كافتراضي
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    dateFrom.value = thirtyDaysAgo.toISOString().split('T')[0];
    dateTo.value = today.toISOString().split('T')[0];
  }
}

// تحميل السجلات
async function loadLogs() {
  if (isLoading) return;
  isLoading = true;

  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page: currentPage,
      limit: 10,
      ...currentFilters
    });

    const response = await fetch(`${API_BASE_URL}/logs?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'خطأ في تحميل السجلات');
    }

    if (result.success) {
      displayLogs(result.data.logs);
      updatePagination(result.data.pagination);
      updateLogsInfo(result.data.pagination);
    } else {
      throw new Error(result.message || 'خطأ في تحميل السجلات');
    }

  } catch (error) {
    console.error('خطأ في تحميل السجلات:', error);
    showError('حدث خطأ في تحميل السجلات: ' + error.message);
    displayEmptyState();
  } finally {
    isLoading = false;
  }
}

// تحميل الإحصائيات
async function loadStats() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/logs?page=1&limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      updateStatsCards(result.data.stats);
    }

  } catch (error) {
    console.error('خطأ في تحميل الإحصائيات:', error);
  }
}

// عرض السجلات
function displayLogs(logs) {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;

  if (!logs || logs.length === 0) {
    displayEmptyState();
    return;
  }

  tbody.innerHTML = logs.map((log, index) => `
    <tr>
      <td>${((currentPage - 1) * 10) + index + 1}</td>
      <td>
        <div class="user-info">
          <strong>${escapeHtml(log.EmployeeName || log.Username || 'غير محدد')}</strong>
          ${log.Username ? `<br><small>@${escapeHtml(log.Username)}</small>` : ''}
        </div>
      </td>
      <td>
        <span class="activity-tag ${getActivityClass(log.ActivityType)}">
          ${getActivityTypeText(log.ActivityType)}
        </span>
      </td>
      <td class="description-cell">
        <span title="${escapeHtml(log.Description)}">
          ${truncateText(escapeHtml(log.Description), 100)}
        </span>
      </td>
      <td>${formatDateTime(log.CreatedAt)}</td>
    </tr>
  `).join('');
}

// عرض حالة فارغة
function displayEmptyState() {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr class="empty-state">
      <td colspan="5">
        <div style="padding: 40px; text-align: center; color: #6c757d;">
          <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
          <h3>لا توجد سجلات</h3>
          <p>لم يتم العثور على أي سجلات بناءً على المعايير المحددة</p>
        </div>
      </td>
    </tr>
  `;
}

// تحديث بطاقات الإحصائيات
function updateStatsCards(stats) {
  const elements = {
    totalLogs: document.getElementById('totalLogs'),
    todayLogs: document.getElementById('todayLogs')
  };

  if (elements.totalLogs) elements.totalLogs.textContent = formatNumber(stats.totalLogs || 0);
  if (elements.todayLogs) elements.todayLogs.textContent = formatNumber(stats.todayLogs || 0);
}

// تحديث معلومات السجلات
function updateLogsInfo(pagination) {
  const logsCount = document.getElementById('logsCount');
  const paginationInfo = document.getElementById('paginationInfo');
  
  if (!pagination) return;

  const start = ((pagination.currentPage - 1) * pagination.logsPerPage) + 1;
  const end = Math.min(pagination.currentPage * pagination.logsPerPage, pagination.totalLogs);
  const infoText = `عرض ${start}-${end} من ${pagination.totalLogs} سجل`;
  
  if (logsCount) logsCount.textContent = infoText;
  if (paginationInfo) paginationInfo.textContent = infoText;
}

// تحديث الترقيم
function updatePagination(pagination) {
  if (!pagination) return;

  currentPage = pagination.currentPage;
  totalPages = pagination.totalPages;

  // تحديث أزرار السابق والتالي
  const prevBtn = document.querySelector('.pagination-btn[onclick="previousPage()"]');
  const nextBtn = document.querySelector('.pagination-btn[onclick="nextPage()"]');
  
  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
  }
  
  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages;
  }

  // تحديث أرقام الصفحات
  const pageNumbers = document.getElementById('pageNumbers');
  if (pageNumbers) {
    pageNumbers.innerHTML = generatePageNumbers();
  }
}

// توليد أرقام الصفحات
function generatePageNumbers() {
  let pages = [];
  const maxVisible = 5;
  
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 3) {
      pages = [1, 2, 3, 4, 5];
    } else if (currentPage >= totalPages - 2) {
      pages = [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
    }
  }

  return pages.map(page => `
    <button class="page-number ${page === currentPage ? 'active' : ''}" 
            onclick="goToPage(${page})">
      ${page}
    </button>
  `).join('');
}

// تطبيق الفلاتر
function applyFilters() {
  const dateFrom = document.getElementById('dateFrom')?.value;
  const dateTo = document.getElementById('dateTo')?.value;
  const activityType = document.getElementById('activityType')?.value;
  const userFilter = document.getElementById('userFilter')?.value;

  currentFilters = {
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(activityType && { activityType }),
    ...(userFilter && { userFilter })
  };

  currentPage = 1;
  loadLogs();
}

// مسح الفلاتر
function clearFilters() {
  document.getElementById('dateFrom').value = '';
  document.getElementById('dateTo').value = '';
  document.getElementById('activityType').value = '';
  document.getElementById('userFilter').value = '';
  document.getElementById('searchInput').value = '';

  currentFilters = {};
  currentPage = 1;
  loadLogs();
}

// تبديل عرض الفلاتر
function toggleFilters() {
  const filtersContent = document.querySelector('.filters-content');
  const collapseBtn = document.querySelector('.collapse-btn i');
  
  if (filtersContent && collapseBtn) {
    const isVisible = filtersContent.style.display !== 'none';
    filtersContent.style.display = isVisible ? 'none' : 'block';
    collapseBtn.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
  }
}

// الانتقال لصفحة محددة
function goToPage(page) {
  if (page >= 1 && page <= totalPages && page !== currentPage) {
    currentPage = page;
    loadLogs();
  }
}

// الصفحة السابقة
function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    loadLogs();
  }
}

// الصفحة التالية
function nextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    loadLogs();
  }
}



// حذف السجلات القديمة
async function deleteLogs() {
  const days = prompt('كم يوم تريد الاحتفاظ بالسجلات؟ (سيتم حذف السجلات الأقدم)', '90');
  
  if (!days || isNaN(days) || days < 1) {
    return;
  }

  if (!confirm(`سيتم حذف جميع السجلات الأقدم من ${days} يوم. هل أنت متأكد؟`)) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/logs/old`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ days: parseInt(days) })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showSuccess(`تم حذف ${result.deletedCount} سجل قديم بنجاح`);
      loadLogs();
      loadStats();
    } else {
      throw new Error(result.message || 'خطأ في حذف السجلات');
    }

  } catch (error) {
    console.error('خطأ في حذف السجلات القديمة:', error);
    showError('حدث خطأ في حذف السجلات القديمة: ' + error.message);
  }
}

// تصدير إلى PDF
async function exportToPDF() {
  await exportLogs('pdf');
}

// تصدير إلى Excel
async function exportToExcel() {
  await exportLogs('csv');
}

// تصدير السجلات
async function exportLogs(format) {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      format,
      ...currentFilters
    });

    const response = await fetch(`${API_BASE_URL}/logs/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (format === 'csv') {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      const result = await response.json();
      if (result.success) {
        // يمكن إضافة تحويل إلى PDF هنا
        showSuccess('تم تصدير السجلات بنجاح');
      }
    }

  } catch (error) {
    console.error('خطأ في تصدير السجلات:', error);
    showError('حدث خطأ في تصدير السجلات');
  }
}

// وظائف مساعدة
function getActivityClass(activityType) {
  const typeMap = {
    'login': 'login',
    'logout': 'logout',
    'register': 'register',
    'complaint_submit': 'complaint',
    'complaint_update': 'update',
    'complaint_view': 'view',
    'export': 'export',
    'export_logs': 'export',
    'delete_logs': 'error',
    'delete_log': 'error',
    'user_management': 'update'
  };
  return typeMap[activityType] || 'view';
}

function getActivityTypeText(activityType) {
  const typeMap = {
    'login': 'تسجيل دخول',
    'logout': 'تسجيل خروج',
    'register': 'تسجيل جديد',
    'complaint_submit': 'تقديم شكوى',
    'complaint_update': 'تحديث شكوى',
    'complaint_view': 'عرض شكوى',
    'export': 'تصدير تقرير',
    'export_logs': 'تصدير سجلات',
    'delete_logs': 'حذف سجلات قديمة',
    'delete_log': 'حذف سجل',
    'user_management': 'إدارة المستخدمين'
  };
  return typeMap[activityType] || activityType;
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return 'اليوم ' + date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (days === 1) {
    return 'أمس ' + date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (days < 7) {
    return `منذ ${days} أيام`;
  } else {
    return date.toLocaleDateString('ar-SA') + ' ' + 
           date.toLocaleTimeString('ar-SA', { 
             hour: '2-digit', 
             minute: '2-digit' 
           });
  }
}

function formatNumber(num) {
  return new Intl.NumberFormat('ar-SA').format(num);
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading() {
  // يمكن إضافة loading spinner
}

function hideLoading() {
  // إخفاء loading spinner
}

function showError(message) {
  alert('خطأ: ' + message);
}

function showSuccess(message) {
  alert('نجح: ' + message);
}

function goBack() {
  window.history.back();
}

// تطبيق اللغة
function applyLanguage(lang) {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  
  const elements = document.querySelectorAll('[data-ar][data-en]');
  elements.forEach(element => {
    element.textContent = element.getAttribute(`data-${lang}`);
  });

  const inputs = document.querySelectorAll('input[data-ar-placeholder][data-en-placeholder]');
  inputs.forEach(input => {
    input.placeholder = input.getAttribute(`data-${lang}-placeholder`);
  });

  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'العربية | English';
  }
} 