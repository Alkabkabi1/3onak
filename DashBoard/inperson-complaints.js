// Ensure Chart.js and ChartDataLabels are loaded before this script runs
// They are loaded in the HTML file via CDN

let currentLang = localStorage.getItem('lang') || 'ar';
let dailyCommunicationChart;
let dateFromPicker;
let dateToPicker;

// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة للبيانات
let chartData = {
    labels: { ar: [], en: [] },
    datasets: []
};

function getFont() {
    return currentLang === 'ar' ? 'Tajawal' : 'Merriweather';
}

// جلب البيانات من الباك إند
async function loadInPersonComplaintsData() {
    try {
        console.log('🔄 بدء جلب بيانات الشكاوى الحضورية من الباك إند...');
        
        // إظهار مؤشر التحميل في الصفحة
        const chartContainer = document.querySelector('.relative.w-full');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="flex items-center justify-center h-full"><div class="text-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p class="mt-4 text-gray-600">جاري تحميل البيانات...</p></div></div>';
        }
        
        // بناء URL مع فلاتر التاريخ فقط إذا تم تحديدها
        let url = `${API_BASE_URL}/inperson-complaints/stats`;
        const params = new URLSearchParams();
        
        // إضافة فلاتر التاريخ فقط إذا تم تحديدها من المستخدم
        if (dateFromPicker && dateFromPicker.selectedDates[0]) {
            const fromDate = dateFromPicker.selectedDates[0].toISOString().split('T')[0];
            params.append('fromDate', fromDate);
            console.log('📅 تاريخ البداية المحدد:', fromDate);
        }
        if (dateToPicker && dateToPicker.selectedDates[0]) {
            const toDate = dateToPicker.selectedDates[0].toISOString().split('T')[0];
            params.append('toDate', toDate);
            console.log('📅 تاريخ النهاية المحدد:', toDate);
        }
        
        // إضافة المعاملات للرابط إذا وجدت
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        console.log('📅 فلاتر التاريخ:', params.toString() || 'بدون فلاتر - جلب جميع البيانات');
        console.log('🌐 إرسال طلب إلى:', url);

        const response = await fetch(url);
        
        console.log('📡 استجابة الخادم:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const result = await response.json();

        console.log('📊 استجابة الباك إند:', result);

        if (result.success) {
            console.log('✅ تم جلب البيانات بنجاح!');
            console.log('📈 البيانات المستلمة:', result.data);
            
            // معالجة البيانات من الباك إند
            processChartData(result.data);
            
            // إنشاء الـ Legend ديناميكياً
            createDynamicLegend(result.data);
            
            // إعادة إنشاء الرسم البياني
            if (dailyCommunicationChart) {
                dailyCommunicationChart.destroy();
            }
            
            const chartContainer = document.querySelector('.relative.w-full');
            if (chartContainer) {
                chartContainer.innerHTML = '<canvas id="dailyCommunicationChart"></canvas>';
                const ctx = document.getElementById('dailyCommunicationChart');
                if (ctx) {
                    dailyCommunicationChart = createDailyCommunicationBarChart(ctx, chartData);
                }
            }
            
            // إظهار إشعار نجاح
            showNotification('تم جلب بيانات الشكاوى الحضورية بنجاح!', 'success');
            
        } else {
            console.error('❌ خطأ في جلب البيانات:', result.message);
            showError('فشل في تحميل البيانات من الخادم: ' + result.message);
        }
    } catch (error) {
        console.error('💥 خطأ في الاتصال بالخادم:', error);
        
        // إظهار رسالة خطأ مفصلة
        const chartContainer = document.querySelector('.relative.w-full');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="text-red-500 text-xl mb-4">⚠️</div>
                        <p class="text-red-600 text-lg">فشل في تحميل البيانات</p>
                        <p class="text-gray-500 text-sm mt-2">${error.message}</p>
                        <div class="mt-4 space-y-2">
                            <p class="text-xs text-gray-400">تأكد من:</p>
                            <ul class="text-xs text-gray-400 text-right">
                                <li>• تشغيل الباك إند على المنفذ 3001</li>
                                <li>• وجود بيانات في قاعدة البيانات</li>
                                <li>• صحة إعدادات قاعدة البيانات</li>
                            </ul>
                        </div>
                        <button onclick="loadInPersonComplaintsData()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                            إعادة المحاولة
                        </button>
                    </div>
                </div>
            `;
        }
        
        showError('خطأ في الاتصال بالخادم: ' + error.message);
    }
}

// إنشاء الـ Legend ديناميكياً من قاعدة البيانات
function createDynamicLegend(data) {
    const legendContainer = document.getElementById('legendContainer');
    if (!legendContainer || !data || !data.chartData || !data.chartData.datasets) {
        return;
    }
    
    // مسح المحتوى السابق
    legendContainer.innerHTML = '';
    
    // إنشاء عناصر الـ Legend لكل نوع شكوى
    data.chartData.datasets.forEach(dataset => {
        const legendItem = document.createElement('div');
        legendItem.className = 'flex items-center gap-2 text-sm text-gray-700';
        
        const colorSpan = document.createElement('span');
        colorSpan.className = 'w-3 h-3 rounded-full';
        colorSpan.style.backgroundColor = dataset.backgroundColor;
        
        const textSpan = document.createElement('span');
        textSpan.textContent = dataset.label;
        textSpan.setAttribute('data-ar', dataset.label);
        textSpan.setAttribute('data-en', getEnglishComplaintType(dataset.label));
        
        legendItem.appendChild(colorSpan);
        legendItem.appendChild(textSpan);
        legendContainer.appendChild(legendItem);
    });
    
    console.log('✅ تم إنشاء الـ Legend ديناميكياً');
}

// معالجة البيانات من الباك إند
function processChartData(data) {
    console.log('🔧 معالجة البيانات المستلمة:', data);
    
    if (!data || !data.chartData) {
        console.log('📝 لا توجد بيانات من الباك إند');
        showNoDataMessage();
        return;
    }
    
    const backendChartData = data.chartData;
    
    // تحديث التصنيفات (الأقسام)
    chartData.labels.ar = backendChartData.labels || [];
    chartData.labels.en = backendChartData.labels.map(label => getEnglishDepartmentName(label)) || [];
    
    // تحديث مجموعات البيانات (أنواع الشكاوى)
    chartData.datasets = backendChartData.datasets.map(dataset => ({
        label: { ar: dataset.label, en: getEnglishComplaintType(dataset.label) },
        data: dataset.data || [],
        backgroundColor: dataset.backgroundColor,
        borderColor: dataset.borderColor,
        borderWidth: dataset.borderWidth || 1,
        borderRadius: dataset.borderRadius || 3,
    }));
    
    console.log('📈 البيانات النهائية للرسم البياني:', chartData);
    
    // إذا لم توجد بيانات، عرض رسالة
    if (chartData.labels.ar.length === 0 || chartData.datasets.length === 0) {
        showNoDataMessage();
    }
}

// إظهار رسالة عدم وجود بيانات
function showNoDataMessage() {
    const chartContainer = document.querySelector('.relative.w-full');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center">
                    <div class="text-gray-500 text-xl mb-4">📊</div>
                    <p class="text-gray-600 text-lg">لا توجد بيانات شكاوى حضورية في الفترة المحددة</p>
                    <p class="text-gray-500 text-sm mt-2">جرب تغيير الفترة الزمنية أو إضافة شكاوى جديدة</p>
                    <div class="mt-4 space-y-2">
                        <p class="text-xs text-gray-400">تأكد من:</p>
                        <ul class="text-xs text-gray-400 text-right">
                            <li>• وجود شكاوى في قاعدة البيانات</li>
                            <li>• صحة الفترة الزمنية المحددة</li>
                            <li>• ربط الشكاوى بالأقسام وأنواع الشكاوى</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
}

// الحصول على اسم القسم بالإنجليزية
function getEnglishDepartmentName(arabicName) {
    const departmentMap = {
        'قسم الطوارئ': 'Emergency Department',
        'قسم الجراحة العامة': 'General Surgery Department',
        'قسم الصيدلية': 'Pharmacy Department',
        'قسم العناية المركزة': 'Intensive Care Unit',
        'قسم الجراحة نساء': 'Women\'s Surgery Department',
        'قسم الباطنية': 'Internal Medicine Department',
        'قسم الأطفال': 'Pediatrics Department',
        'قسم العظام': 'Orthopedics Department',
        'قسم القلب': 'Cardiology Department',
        'قسم المخ والأعصاب': 'Neurology Department',
        'قسم الأشعة': 'Radiology Department',
        'قسم المختبر': 'Laboratory Department',
        'قسم التمريض': 'Nursing Department',
        'قسم الإدارة': 'Administration Department'
    };
    
    return departmentMap[arabicName] || arabicName;
}

// الحصول على نوع الشكوى بالإنجليزية
function getEnglishComplaintType(arabicType) {
    const typeMap = {
        'الخدمات الطبية والعلاجية': 'Medical and Therapeutic Services',
        'الكوادر الصحية وسلوكهم': 'Health Staff and Their Behavior',
        'الصيدلية والدواء': 'Pharmacy and Medicine',
        'المواعيد والتحويلات': 'Appointments and Transfers',
        'الإجراءات الإدارية': 'Administrative Procedures',
        'الخدمات الإلكترونية والتطبيقات': 'Electronic Services and Applications',
        'الاستقبال وخدمة العملاء': 'Reception and Customer Service',
        'خدمات المرضى العامة': 'General Patient Services',
        'الدعم المنزلي والرعاية المستمرة': 'Home Support and Continuous Care',
        'تجربة الزوار والمرافقين': 'Visitor and Companion Experience',
        'خدمات الطوارئ والإسعاف': 'Emergency and Ambulance Services',
        'خدمات التأهيل والعلاج الطبيعي': 'Rehabilitation and Physical Therapy Services',
        'الخصوصية وسرية المعلومات': 'Privacy and Information Confidentiality',
        'التثقيف والتوعية الصحية': 'Health Education and Awareness',
        'بيئة المستشفى والبنية التحتية': 'Hospital Environment and Infrastructure',
        'السلامة ومكافحة العدوى': 'Safety and Infection Control',
        'خدمات الدعم الفني والأنظمة': 'Technical Support and Systems Services',
        'القبول والتحويل الداخلي بين الأقسام': 'Admission and Internal Transfer Between Departments',
        'التقييم بعد المعالجة': 'Post-Treatment Evaluation',
        'ملاحظات المرضى الدوليين': 'International Patient Notes'
    };
    
    return typeMap[arabicType] || arabicType;
}

// دالة لعرض الإشعارات
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // تحديد لون الإشعار حسب النوع
    if (type === 'success') {
        notification.className += ' bg-green-500 text-white';
    } else if (type === 'error') {
        notification.className += ' bg-red-500 text-white';
    } else {
        notification.className += ' bg-blue-500 text-white';
    }
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="mr-2">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // إظهار الإشعار
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // إخفاء الإشعار بعد 5 ثواني
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// إظهار رسالة خطأ
function showError(message) {
    console.error('❌ خطأ:', message);
    alert(message);
}

function createDailyCommunicationBarChart(ctx, chartData) {
    console.log('🎨 إنشاء الرسم البياني مع البيانات:', chartData);
    
    const datasets = chartData.datasets.map(dataset => ({
        label: dataset.label[currentLang],
        data: dataset.data,
        backgroundColor: dataset.backgroundColor,
        borderColor: dataset.borderColor,
        borderWidth: dataset.borderWidth,
        borderRadius: dataset.borderRadius,
    }));

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels[currentLang],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2.5,
            layout: {
                padding: {
                    top: 15,
                    right: 15,
                    bottom: 15,
                    left: 15
                }
            },
            plugins: {
                legend: {
                    display: false, // Legend is custom HTML, not Chart.js legend
                },
                tooltip: {
                    rtl: currentLang === 'ar',
                    bodyFont: { family: getFont() },
                    titleFont: { family: getFont() },
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
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
                        },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: { display: false },
                    barPercentage: 0.8,
                    categoryPercentage: 0.7
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
            }
        }
    });
}

function updateAllContent() {
    const font = getFont();

    // Update page title
    const pageTitleElement = document.querySelector('title');
    if (pageTitleElement) {
        pageTitleElement.textContent = pageTitleElement.getAttribute(`data-${currentLang}`);
    }

    // Update Daily Communication Chart
    if (dailyCommunicationChart) {
        dailyCommunicationChart.data.labels = chartData.labels[currentLang];
        dailyCommunicationChart.data.datasets.forEach((dataset, index) => {
            dataset.label = chartData.datasets[index].label[currentLang];
        });
        dailyCommunicationChart.options.plugins.tooltip.rtl = currentLang === 'ar';
        dailyCommunicationChart.options.plugins.tooltip.bodyFont.family = font;
        dailyCommunicationChart.options.plugins.tooltip.titleFont.family = font;
        dailyCommunicationChart.options.plugins.datalabels.font.family = font;
        dailyCommunicationChart.options.scales.x.ticks.font.family = font;
        dailyCommunicationChart.options.scales.y.ticks.font.family = font;
        dailyCommunicationChart.update();
    }

    // Update Flatpickr locale
    if (dateFromPicker) {
        dateFromPicker.set('locale', currentLang === 'ar' ? 'ar' : 'default');
        dateFromPicker.set('enableRtl', currentLang === 'ar');
        document.getElementById('dateFrom').placeholder = currentLang === 'ar' ? 'اختر التاريخ' : 'Select Date';
        document.getElementById('dateFrom').setAttribute('data-ar', 'اختر التاريخ');
        document.getElementById('dateFrom').setAttribute('data-en', 'Select Date');
    }
    if (dateToPicker) {
        dateToPicker.set('locale', currentLang === 'ar' ? 'ar' : 'default');
        dateToPicker.set('enableRtl', currentLang === 'ar');
        document.getElementById('dateTo').placeholder = currentLang === 'ar' ? 'اختر التاريخ' : 'Select Date';
        document.getElementById('dateTo').setAttribute('data-ar', 'اختر التاريخ');
        document.getElementById('dateTo').setAttribute('data-en', 'Select Date');
    }
    
    // Update Legend language
    updateLegendLanguage();
}

// تحديث لغة الـ Legend
function updateLegendLanguage() {
    const legendItems = document.querySelectorAll('#legendContainer span[data-ar]');
    legendItems.forEach(item => {
        const text = item.getAttribute(`data-${currentLang}`);
        if (text) {
            item.textContent = text;
        }
    });
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

    updateAllContent(); // Update all content including charts
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 بدء تحميل صفحة الشكاوى الحضورية...');
    
    const langToggleBtn = document.getElementById('langToggle');
    const exportReportBtn = document.getElementById('exportReportBtn');
    const applyFilterBtn = document.getElementById('applyFilterBtn');

    // Initialize Flatpickr
    dateFromPicker = flatpickr("#dateFrom", {
        dateFormat: "Y-m-d",
        locale: currentLang === 'ar' ? 'ar' : 'default',
        enableRtl: currentLang === 'ar',
        maxDate: 'today'
    });
    dateToPicker = flatpickr("#dateTo", {
        dateFormat: "Y-m-d",
        locale: currentLang === 'ar' ? 'ar' : 'default',
        enableRtl: currentLang === 'ar',
        maxDate: 'today'
    });

    // تحميل البيانات الأولية
    loadInPersonComplaintsData();

    // Now, call applyLanguage to set initial language and update all content
    applyLanguage(currentLang);

    // Set active sidebar link based on current page
    const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-link');
    sidebarLinks.forEach(link => {
        link.parentElement.classList.remove('active'); // Remove active from all
        // Check if the href matches the current page's intended active link
        if (link.getAttribute('href') === 'inperson-complaints.html') {
            link.parentElement.classList.add('active'); // Add active to the correct one
        }
    });

    // Apply Filter button functionality
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
            console.log('🔍 تطبيق الفلترة...');
            loadInPersonComplaintsData(); // إعادة تحميل البيانات مع الفلترة الجديدة
        });
    }

    // Functionality for Export Report button
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', () => {
            exportInPersonComplaintsReport();
        });
    }

    // Language toggle button event listener
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            applyLanguage(newLang);
        });
    }
    
    console.log('✅ تم تحميل صفحة الشكاوى الحضورية بنجاح');
});

// تصدير تقرير الشكاوى الحضورية
async function exportInPersonComplaintsReport() {
    try {
        console.log('📊 بدء تصدير تقرير الشكاوى الحضورية...');
        
        // بناء URL مع فلاتر التاريخ فقط إذا تم تحديدها
        let url = `${API_BASE_URL}/inperson-complaints/export-data`;
        const params = new URLSearchParams();
        
        // إضافة فلاتر التاريخ فقط إذا تم تحديدها من المستخدم
        if (dateFromPicker && dateFromPicker.selectedDates[0]) {
            const fromDate = dateFromPicker.selectedDates[0].toISOString().split('T')[0];
            params.append('fromDate', fromDate);
        }
        if (dateToPicker && dateToPicker.selectedDates[0]) {
            const toDate = dateToPicker.selectedDates[0].toISOString().split('T')[0];
            params.append('toDate', toDate);
        }
        
        // إضافة المعاملات للرابط إذا وجدت
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        console.log('🌐 إرسال طلب تصدير إلى:', url);

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // إنشاء رابط تحميل
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `inperson-complaints-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        
        console.log('✅ تم تصدير التقرير بنجاح');
        showNotification('تم تصدير التقرير بنجاح!', 'success');
        
    } catch (error) {
        console.error('💥 خطأ في تصدير التقرير:', error);
        showNotification('خطأ في تصدير التقرير: ' + error.message, 'error');
    }
}
