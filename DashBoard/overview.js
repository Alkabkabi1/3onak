let currentLang = localStorage.getItem('lang') || 'ar';
let topComplaintsChart;

// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let overviewData = {
    mainStats: {
        transparencyRate: '0%',
        underReview: 0,
        newComplaint: 0,
        repeatedComplaints: 0,
        totalComplaints: 0
    },
    topComplaints: {
        labels: { ar: [], en: [] },
        values: []
    }
};

function getFont() {
    return currentLang === 'ar' ? 'Tajawal' : 'Merriweather';
}

// اختبار الاتصال بالباك إند
async function testBackendConnection() {
    try {
        console.log('🔍 اختبار الاتصال بالباك إند...');

        const response = await fetch(`${API_BASE_URL}/health`);
        console.log('📡 استجابة اختبار الاتصال:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ الباك إند يعمل بشكل صحيح:', data);
            return true;
        } else {
            console.log('❌ الباك إند لا يستجيب بشكل صحيح - Status:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ لا يمكن الاتصال بالباك إند:', error.message);
        return false;
    }
}

// إنشاء Canvas ديناميكياً للرسم البياني
function createChartDynamically() {
    const chartContainer = document.querySelector('.relative.w-full');
    if (!chartContainer) {
        console.error('❌ لم يتم العثور على حاوية الرسم البياني');
        return null;
    }
    
    // إزالة Canvas الموجود إن وجد
    const existingCanvas = chartContainer.querySelector('canvas');
    if (existingCanvas) {
        existingCanvas.remove();
    }
    
    // إنشاء Canvas جديد
    const canvas = document.createElement('canvas');
    canvas.id = 'topComplaintsChart';
    chartContainer.appendChild(canvas);
    
    console.log('✅ تم إنشاء Canvas جديد للرسم البياني');
    return canvas;
}

// جلب بيانات النظرة العامة من الباك إند
async function loadOverviewData() {
    console.log('🔄 بدء جلب بيانات النظرة العامة...');
    
    try {
        // جلب البيانات مباشرة بدون تعقيدات
        const response = await fetch(`${API_BASE_URL}/overview/stats`);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📊 API Response:', result);
        
        if (result.success && result.data) {
            console.log('✅ نجح جلب البيانات، تحديث الواجهة...');
            
            // تحديث البيانات مباشرة
            overviewData.mainStats = {
                transparencyRate: result.data.transparencyRate || '0%',
                underReview: result.data.underReview || 0,
                newComplaint: result.data.newComplaint || 0,
                repeatedComplaints: result.data.repeatedComplaints || 0,
                totalComplaints: result.data.totalComplaints || 0
            };
            
            console.log('📊 البيانات المحدثة:', overviewData.mainStats);
            updateMainStatsCards();
            
        } else {
            throw new Error('فشل في معالجة البيانات من الخادم');
        }
        
    } catch (error) {
        console.error('❌ خطأ في جلب البيانات:', error);
        
        // عرض بيانات تجريبية للاختبار
        const testData = {
            transparencyRate: '50%',
            underReview: 0,
            newComplaint: 2,
            repeatedComplaints: 0,
            totalComplaints: 4
        };
        overviewData.mainStats = testData;
        updateMainStatsCards();
        console.log('🔧 تم عرض البيانات التجريبية:', testData);
    }
}

// معالجة البيانات من الباك إند
function processOverviewData(data) {
    console.log('🔍 معالجة البيانات من الباك إند:', data);
    
    // معالجة الإحصائيات الرئيسية
    overviewData.mainStats = {
        transparencyRate: data.transparencyRate || '0%',
        underReview: data.underReview || 0,
        newComplaint: data.newComplaint || 0,
        repeatedComplaints: data.repeatedComplaints || 0,
        totalComplaints: data.totalComplaints || 0
    };
    
    console.log('📊 الإحصائيات الرئيسية:', overviewData.mainStats);
    
    // معالجة أكثر الشكاوى تكراراً
    const topComplaints = data.topComplaints || [];
    console.log('📈 أكثر الشكاوى تكراراً:', topComplaints);
    
    overviewData.topComplaints.labels.ar = topComplaints.map(item => item.complaintType || 'شكوى عامة');
    overviewData.topComplaints.labels.en = topComplaints.map(item => getEnglishComplaintType(item.complaintType) || 'General Complaint');
    overviewData.topComplaints.values = topComplaints.map(item => item.count || 0);
    
    console.log('📊 بيانات أكثر الشكاوى تكراراً:', {
        labels: overviewData.topComplaints.labels,
        values: overviewData.topComplaints.values
    });
    
    // معالجة تفاصيل الشكاوى المتكررة
    const repeatedDetails = data.repeatedComplaintsDetails || [];
    console.log('🔄 تفاصيل الشكاوى المتكررة:', repeatedDetails);
    
    // تحديث واجهة المستخدم
    updateMainStatsCards();
    updateRepeatedComplaintsAlert(repeatedDetails);
}

// حساب نسبة الشفافية
function calculateTransparencyRate(general) {
    if (!general.totalComplaints || general.totalComplaints === 0) return 0;
    
    const resolvedComplaints = general.closedComplaints || 0;
    const transparencyRate = Math.round((resolvedComplaints / general.totalComplaints) * 100);
    return Math.min(transparencyRate, 100); // لا تتجاوز 100%
}

// الحصول على اسم نوع الشكوى بالإنجليزية
function getEnglishComplaintType(arabicType) {
    const typeMap = {
        'تأخير في دخول العيادة': 'Delay in Clinic Entry',
        'تعامل غير لائق من موظف': 'Improper Staff Conduct',
        'نقص علاج / أدوية': 'Lack of Treatment / Medication',
        'نظافة غرف المرضى': 'Patient Room Cleanliness',
        'سوء التنسيق في المواعيد': 'Poor Appointment Coordination',
        'شكوى عامة': 'General Complaint'
    };
    
    return typeMap[arabicType] || arabicType;
}

// إظهار رسالة خطأ
function showError(message) {
    // إنشاء تنبيه أنيق بدلاً من alert
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
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
        <div style="display: flex; align-items: center;">
            <span style="margin-left: 10px;">❌</span>
            <span>${message}</span>
        </div>
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

// إظهار رسالة نجاح
function showSuccess(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #22c55e;
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
        <div style="display: flex; align-items: center;">
            <span style="margin-left: 10px;">✅</span>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// تصدير التقرير
async function exportOverviewReport() {
    const exportBtn = document.getElementById('exportReportBtn');
    const originalText = exportBtn ? exportBtn.innerHTML : '';
    
    try {
        console.log('📤 بدء تصدير تقرير النظرة العامة...');
        
        // تغيير حالة الزر إلى التحميل
        if (exportBtn) {
            exportBtn.disabled = true;
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i><span>جاري التصدير...</span>';
        }
        
        const toDate = new Date().toISOString().split('T')[0];
        const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const params = new URLSearchParams({
            fromDate,
            toDate
        });
        
        console.log('🌐 إرسال طلب تصدير إلى:', `${API_BASE_URL}/overview/export-data?${params}`);
        
        const response = await fetch(`${API_BASE_URL}/overview/export-data?${params}`);
        const blob = await response.blob();
        
        // إنشاء رابط تحميل
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `overview-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ تم تصدير التقرير بنجاح');
        showSuccess('تم تصدير التقرير بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تصدير التقرير:', error);
        showError('فشل في تصدير التقرير: ' + error.message);
    } finally {
        // إعادة حالة الزر الأصلية
        if (exportBtn) {
            exportBtn.disabled = false;
            exportBtn.innerHTML = originalText;
        }
    }
}

function updateMainStatsCards() {
    console.log('🔄 تحديث البطاقات مع البيانات:', overviewData.mainStats);
    
    // تحديث جميع العناصر
    const elements = {
        transparencyRate: document.getElementById('transparencyRate'),
        underReview: document.getElementById('underReview'),
        newComplaint: document.getElementById('newComplaint'),
        repeatedComplaints: document.getElementById('repeatedComplaints'),
        totalComplaints: document.getElementById('totalComplaints')
    };
    
    // تطبيق البيانات على كل عنصر
    Object.keys(elements).forEach(key => {
        const element = elements[key];
        if (element) {
            element.textContent = overviewData.mainStats[key];
            console.log(`✅ تم تحديث ${key}:`, overviewData.mainStats[key]);
        } else {
            console.warn(`❌ لم يتم العثور على العنصر: ${key}`);
        }
    });
    
    console.log('✅ تم تحديث جميع البطاقات');
}

function updateRepeatedComplaintsAlert(repeatedDetails) {
    const repeatedCountElement = document.getElementById('repeatedComplaintsCount');
    if (repeatedCountElement) {
        repeatedCountElement.textContent = overviewData.mainStats.repeatedComplaints;
    }
    
    // تحديث تفاصيل الشكاوى المتكررة
    const alertSection = document.querySelector('.bg-yellow-50');
    if (alertSection && repeatedDetails && repeatedDetails.length > 0) {
        // إنشاء قائمة بالشكاوى المتكررة
        let detailsHtml = '<div class="mt-4 space-y-2">';
        repeatedDetails.forEach(item => {
            detailsHtml += `
                <div class="bg-yellow-100 p-3 rounded-lg">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-semibold text-yellow-800">${item.ComplaintType}</p>
                            <p class="text-sm text-yellow-700">القسم: ${item.DepartmentName}</p>
                            <p class="text-sm text-yellow-700">عدد التكرارات: ${item.ComplaintCount}</p>
                        </div>
                        <span class="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                            ${item.ComplaintCount} مرات
                        </span>
                    </div>
                </div>
            `;
        });
        detailsHtml += '</div>';
        
        // إضافة التفاصيل إلى التنبيه
        const existingDetails = alertSection.querySelector('.mt-4.space-y-2');
        if (existingDetails) {
            existingDetails.remove();
        }
        alertSection.querySelector('.mr-3').insertAdjacentHTML('beforeend', detailsHtml);
    }
}

function createBarChart(ctx, dataLabels, dataValues, chartTitle) {
    console.log('🎨 إنشاء الرسم البياني مع البيانات:', {
        labels: dataLabels[currentLang],
        values: dataValues
    });
    
    console.log('🎨 Canvas element:', ctx);
    console.log('🎨 Canvas width:', ctx.width);
    console.log('🎨 Canvas height:', ctx.height);
    
    // ألوان متدرجة وجميلة
    const colors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];
    
    const datasets = [{
        label: chartTitle,
        data: dataValues,
        backgroundColor: dataValues.map((_, index) => colors[index % colors.length]),
        borderColor: dataValues.map((_, index) => colors[index % colors.length]),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
    }];
    
    console.log('🎨 Datasets:', datasets);
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dataLabels[currentLang],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { family: getFont(), size: 12 },
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    rtl: currentLang === 'ar',
                    bodyFont: { family: getFont(), size: 13 },
                    titleFont: { family: getFont(), size: 14, weight: 'bold' },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    cornerRadius: 6,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value} شكوى`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            family: getFont(),
                            size: 12,
                            color: '#333'
                        }
                    },
                    grid: { display: false },
                    barPercentage: 0.9,
                    categoryPercentage: 0.9
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            family: getFont(),
                            size: 12,
                            color: '#333'
                        }
                    },
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0, 0, 0, 0.1)',
                    },
                }
            },
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            },
            onClick: (event, activeElements) => {
                if (activeElements.length > 0) {
                    const index = activeElements[0].index;
                    const label = dataLabels[currentLang][index];
                    const value = dataValues[index];
                    showSuccess(`${label}: ${value} شكوى`);
                }
            }
        }
    });
}

function updateAllContent() {
    const font = getFont();

    // Update Main Stats Cards
    updateMainStatsCards();
    updateRepeatedComplaintsAlert();

    // Update Top Complaints Chart
    if (topComplaintsChart) {
        topComplaintsChart.data.labels = overviewData.topComplaints.labels[currentLang];
        topComplaintsChart.data.datasets[0].data = overviewData.topComplaints.values;
        topComplaintsChart.options.plugins.tooltip.rtl = currentLang === 'ar';
        topComplaintsChart.options.plugins.tooltip.bodyFont.family = font;
        topComplaintsChart.options.plugins.tooltip.titleFont.family = font;
        topComplaintsChart.options.plugins.datalabels.font.family = font;
        topComplaintsChart.options.scales.x.ticks.font.family = font;
        topComplaintsChart.options.scales.y.ticks.font.family = font;
        topComplaintsChart.update();
    }
}

// إعداد dropdowns التفاعلية
function setupDropdown(selectId, optionsId) {
    const selectElement = document.getElementById(selectId);
    const optionsElement = document.getElementById(optionsId);
    
    if (!selectElement || !optionsElement) {
        console.warn(`Dropdown elements not found: ${selectId} or ${optionsId}`);
        return;
    }
    
    // إظهار/إخفاء الخيارات عند النقر
    selectElement.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // إغلاق جميع القوائم المفتوحة الأخرى
        document.querySelectorAll('.custom-select-options').forEach(options => {
            if (options !== optionsElement) {
                options.style.display = 'none';
            }
        });
        
        // تبديل الحالة للقائمة الحالية
        const isVisible = optionsElement.style.display === 'block';
        optionsElement.style.display = isVisible ? 'none' : 'block';
    });
    
    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', () => {
        optionsElement.style.display = 'none';
    });
    
    // إضافة مستمعي الأحداث للخيارات
    optionsElement.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (e.target.classList.contains('custom-select-option')) {
            const value = e.target.getAttribute('data-value');
            const text = e.target.getAttribute(`data-${currentLang}`);
            
            // تحديث النص المعروض
            const spanElement = selectElement.querySelector('span');
            if (spanElement) {
                spanElement.textContent = text;
                spanElement.setAttribute('data-value', value);
            }
            
            // إغلاق القائمة
            optionsElement.style.display = 'none';
            
            // تطبيق الفلتر
            applyDateFilter(selectId, value);
        }
    });
}

// تطبيق فلتر التاريخ
function applyDateFilter(selectId, value) {
    console.log(`تطبيق فلتر ${selectId} بالقيمة: ${value}`);
    
    // حساب التواريخ حسب الفلتر المختار
    let fromDate, toDate;
    const now = new Date();
    
    switch (value) {
        case 'today':
            fromDate = toDate = now.toISOString().split('T')[0];
            break;
        case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            fromDate = toDate = yesterday.toISOString().split('T')[0];
            break;
        case 'last7':
            toDate = now.toISOString().split('T')[0];
            const last7 = new Date(now);
            last7.setDate(last7.getDate() - 7);
            fromDate = last7.toISOString().split('T')[0];
            break;
        case 'last30':
            toDate = now.toISOString().split('T')[0];
            const last30 = new Date(now);
            last30.setDate(last30.getDate() - 30);
            fromDate = last30.toISOString().split('T')[0];
            break;
        case 'jan': case 'feb': case 'mar': case 'apr': case 'may': case 'jun':
        case 'jul': case 'aug': case 'sep': case 'oct': case 'nov': case 'dec':
            const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, 
                             jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
            const monthIndex = monthMap[value];
            const year = now.getFullYear();
            fromDate = new Date(year, monthIndex, 1).toISOString().split('T')[0];
            toDate = new Date(year, monthIndex + 1, 0).toISOString().split('T')[0];
            break;
        case 'q1':
            fromDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            toDate = new Date(now.getFullYear(), 2, 31).toISOString().split('T')[0];
            break;
        case 'q2':
            fromDate = new Date(now.getFullYear(), 3, 1).toISOString().split('T')[0];
            toDate = new Date(now.getFullYear(), 5, 30).toISOString().split('T')[0];
            break;
        case 'q3':
            fromDate = new Date(now.getFullYear(), 6, 1).toISOString().split('T')[0];
            toDate = new Date(now.getFullYear(), 8, 30).toISOString().split('T')[0];
            break;
        case 'q4':
            fromDate = new Date(now.getFullYear(), 9, 1).toISOString().split('T')[0];
            toDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
            break;
        default:
            return;
    }
    
    // إعادة تحميل البيانات مع الفلتر الجديد
    if (fromDate && toDate) {
        loadOverviewDataWithFilter(fromDate, toDate);
    }
}

// تحميل البيانات مع فلتر محدد
async function loadOverviewDataWithFilter(fromDate, toDate) {
    try {
        console.log('🔄 تحميل البيانات مع الفلتر:', { fromDate, toDate });
        
        const params = new URLSearchParams({ fromDate, toDate });
        const url = `${API_BASE_URL}/overview/stats?${params}`;
        console.log('🌐 URL:', url);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📊 API Response:', result);
        
        if (result.success) {
            console.log('✅ API Success، معالجة البيانات...');
            processOverviewData(result.data);
            
            // إعادة إنشاء الرسم البياني
            if (topComplaintsChart) {
                topComplaintsChart.destroy();
            }
            
            const canvas = createChartDynamically();
            if (canvas) {
                if (!overviewData.topComplaints.values || overviewData.topComplaints.values.length === 0) {
                    canvas.parentElement.innerHTML = `
                        <div class="flex items-center justify-center h-full">
                            <div class="text-center">
                                <div class="text-gray-500 text-6xl mb-4">📊</div>
                                <h3 class="text-xl font-semibold text-gray-700 mb-2">لا توجد شكاوى في هذه الفترة</h3>
                                <p class="text-gray-500 mb-4">جرب تغيير الفلتر لرؤية المزيد من البيانات</p>
                            </div>
                        </div>
                    `;
                } else {
                    topComplaintsChart = createBarChart(
                        canvas,
                        overviewData.topComplaints.labels,
                        overviewData.topComplaints.values,
                        'Most Frequent Complaints'
                    );
                }
            }
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات مع الفلتر:', error);
        console.error('📍 تفاصيل الخطأ:', error.message, error.stack);
        showError('فشل في تطبيق الفلتر: ' + error.message);
        
        // عرض بيانات فارغة في حالة الخطأ
        overviewData.mainStats = {
            transparencyRate: 'خطأ',
            underReview: 'خطأ',
            newComplaint: 'خطأ',
            repeatedComplaints: 'خطأ',
            totalComplaints: 'خطأ'
        };
        updateMainStatsCards();
    }
}

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.remove('lang-ar', 'lang-en');
    document.body.classList.add(lang === 'ar' ? 'lang-ar' : 'lang-en');

    document.querySelectorAll('[data-ar], [data-en]').forEach(el => {
        const textContent = el.getAttribute(`data-${lang}`);
        if (textContent) {
            el.textContent = textContent;
        }
    });

    // Update language toggle text
    const langTextSpan = document.getElementById('langText');
    if (langTextSpan) {
        langTextSpan.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
    }

    // Update dropdown selected texts
    const dropdowns = ['day', 'month', 'quarter', 'customDate'];
    dropdowns.forEach(id => {
        const span = document.getElementById(`selected${id.charAt(0).toUpperCase() + id.slice(1)}`);
        if (span) {
            const selectedValue = span.dataset.value;
            const optionElement = document.querySelector(`#${id}Options .custom-select-option[data-value="${selectedValue}"]`);
            if (optionElement) {
                span.textContent = optionElement.getAttribute(`data-${lang}`);
            } else {
                // Set default text if no value is selected or found
                if (id === 'day') span.textContent = lang === 'ar' ? 'اختر اليوم' : 'Choose Day';
                else if (id === 'month') span.textContent = lang === 'ar' ? 'اختر الشهر' : 'Choose Month';
                else if (id === 'quarter') span.textContent = lang === 'ar' ? 'ربع سنوي' : 'Quarterly';
                else if (id === 'customDate') span.textContent = lang === 'ar' ? 'تخصيص التاريخ' : 'Custom Date';
            }
        }
    });

    updateAllContent();
}

document.addEventListener('DOMContentLoaded', () => {

    
    const langToggleBtn = document.getElementById('langToggle');
    const exportReportBtn = document.getElementById('exportReportBtn');
    const refreshBtn = document.getElementById('refreshBtn');

    // إضافة مستمعي الأحداث للفلاتر
    setupDropdown('daySelect', 'dayOptions');
    setupDropdown('monthSelect', 'monthOptions');
    setupDropdown('quarterSelect', 'quarterOptions');
    setupDropdown('customDateSelect', 'customDateOptions');

    // إضافة مستمع لزر التحديث
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadOverviewData);
    }

    // تحميل البيانات الأولية
    loadOverviewData();

    // Now, call applyLanguage to set initial language and update all content
    applyLanguage(currentLang);

    // Set active sidebar link based on current page
    const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-link');
    sidebarLinks.forEach(link => {
        link.parentElement.classList.remove('active');
        if (link.getAttribute('href') === 'overview.html') {
            link.parentElement.classList.add('active');
        }
    });

    // Functionality for Export Report button
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', () => {
            exportOverviewReport();
        });
    }

    // Language toggle button event listener
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            applyLanguage(newLang);
        });
    }
});
