let currentLang = localStorage.getItem('lang') || 'ar';
let misconductChart;
let dateFromPicker;
let dateToPicker;

// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let misconductData = {
    labels: { ar: [], en: [] },
    datasets: []
};

function getFont() {
    return currentLang === 'ar' ? 'Tajawal' : 'Merriweather';
}

// جلب بيانات بلاغات سوء التعامل من الباك إند
async function loadMisconductData() {
    console.log('🔄 بدء جلب بيانات بلاغات سوء التعامل...');
    
    try {
        // جلب البيانات مباشرة من API
        const response = await fetch(`${API_BASE_URL}/misconduct/stats`);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📊 API Response:', result);
        
        if (result.success) {
            console.log('✅ نجح جلب البيانات، معالجة البيانات...');
            processMisconductData(result.data);
            
            // إعادة إنشاء الرسم البياني
            if (misconductChart) {
                misconductChart.destroy();
            }
            
            // إنشاء الرسم البياني
            createChartDynamically();
            
        } else {
            throw new Error('فشل في معالجة البيانات من الخادم');
        }
        
    } catch (error) {
        console.error('❌ خطأ في جلب البيانات:', error);
        showNoDataMessage();
    }
}

// إنشاء canvas ديناميكياً وإنشاء الرسم البياني
function createChartDynamically() {
    const chartContainer = document.querySelector('.relative.w-full');
    console.log('🔍 البحث عن chart container:', chartContainer);
    
    if (chartContainer) {
        // إنشاء canvas جديد
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'misconductChart';
        newCanvas.width = 800;
        newCanvas.height = 400;
        newCanvas.style.width = '100%';
        newCanvas.style.height = '100%';
        
        // مسح المحتوى وإضافة canvas
        chartContainer.innerHTML = '';
        chartContainer.appendChild(newCanvas);
        
        console.log('✅ تم إنشاء canvas جديد:', newCanvas);
        
        try {
            misconductChart = createMisconductBarChart(newCanvas, misconductData);
            console.log('✅ تم إنشاء الرسم البياني بنجاح');
        } catch (error) {
            console.error('❌ خطأ في إنشاء الرسم البياني:', error);
            showNoDataMessage();
        }
    } else {
        console.error('❌ لم يتم العثور على chart container');
    }
}

// عرض رسالة عدم وجود بيانات
function showNoDataMessage() {
    const chartContainer = document.querySelector('.relative.w-full');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center">
                    <div class="text-gray-500 text-6xl mb-4">📊</div>
                    <h3 class="text-xl font-semibold text-gray-700 mb-2">لا توجد بلاغات سوء تعامل</h3>
                    <p class="text-gray-500 mb-4">لم يتم العثور على أي بلاغات سوء تعامل في قاعدة البيانات</p>
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p class="text-blue-800 text-sm">
                            💡 <strong>نصيحة:</strong> تأكد من وجود شكاوى بنوع "الكوادر الصحية وسلوكهم" في قاعدة البيانات
                        </p>
                    </div>
                    <button onclick="loadMisconductData()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        إعادة المحاولة
                    </button>
                </div>
            </div>
        `;
    }
}

// معالجة البيانات من الباك إند
function processMisconductData(data) {
    console.log('🔧 معالجة البيانات المستلمة:', data);
    
    const departments = data.byDepartment || [];
    console.log('📋 البيانات الخام حسب القسم:', departments);
    
    // إذا لم توجد بيانات، عرض رسالة
    if (departments.length === 0) {
        showNoDataMessage();
        return;
    }
    
    console.log('📋 عدد الأقسام التي لديها بلاغات:', departments.length);
    
    // تحويل البيانات إلى التنسيق المطلوب للرسم البياني
    misconductData.labels.ar = departments.map(dept => dept.DepartmentName);
    misconductData.labels.en = departments.map(dept => getEnglishDepartmentName(dept.DepartmentName));
    
    misconductData.datasets = [{
        label: { ar: 'عدد البلاغات', en: 'Number of Reports' },
        data: departments.map(dept => dept.reportCount),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
        borderRadius: 5,
    }];
    
    console.log('📈 البيانات النهائية للرسم البياني:', misconductData);
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

// الحصول على لون التخصص
function getSpecialtyColor(specialty) {
    const colors = {
        'طبيب': '#3B82F6',
        'ممارس صحي': '#60A5FA',
        'ممرضة': '#93C5FD',
        'تمريض': '#93C5FD',
        'غير محدد': '#CBD5E1'
    };
    return colors[specialty] || '#3B82F6';
}

// الحصول على لون حدود التخصص
function getSpecialtyBorderColor(specialty) {
    const colors = {
        'طبيب': '#2563EB',
        'ممارس صحي': '#3B82F6',
        'ممرضة': '#60A5FA',
        'تمريض': '#60A5FA',
        'غير محدد': '#94A3B8'
    };
    return colors[specialty] || '#2563EB';
}

// إظهار رسالة خطأ
function showError(message) {
    console.error('❌ خطأ:', message);
}

// تصدير التقرير
async function exportMisconductReport() {
    try {
        console.log('📤 بدء تصدير تقرير بلاغات سوء التعامل...');
        
        const fromDate = dateFromPicker && dateFromPicker.selectedDates[0] ? dateFromPicker.selectedDates[0].toISOString().split('T')[0] : '';
        const toDate = dateToPicker && dateToPicker.selectedDates[0] ? dateToPicker.selectedDates[0].toISOString().split('T')[0] : '';
        
        const params = new URLSearchParams();
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        
        console.log('🌐 إرسال طلب تصدير إلى:', `${API_BASE_URL}/misconduct/export-data?${params}`);
        
        const response = await fetch(`${API_BASE_URL}/misconduct/export-data?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // إنشاء رابط تحميل
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `misconduct-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ تم تصدير التقرير بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تصدير التقرير:', error);
        showError('فشل في تصدير التقرير: ' + error.message);
    }
}

function createMisconductBarChart(ctx, chartData) {
    console.log('🎨 إنشاء الرسم البياني مع البيانات:', chartData);
    
    if (!ctx) {
        console.error('❌ Canvas context غير صالح');
        return null;
    }
    
    console.log('🎨 Canvas موجود، بدء إنشاء الرسم البياني...');
    console.log('🎨 Canvas element:', ctx);
    console.log('🎨 Canvas width:', ctx.width);
    console.log('🎨 Canvas height:', ctx.height);
    
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
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    rtl: currentLang === 'ar',
                    bodyFont: { family: getFont() },
                    titleFont: { family: getFont() }
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

    // Update Misconduct Chart
    if (misconductChart) {
        misconductChart.data.labels = misconductData.labels[currentLang];
        misconductChart.data.datasets.forEach((dataset, index) => {
            dataset.label = misconductData.datasets[index].label[currentLang]; 
        });
        misconductChart.options.plugins.legend.labels.font.family = font;
        misconductChart.options.plugins.tooltip.rtl = currentLang === 'ar';
        misconductChart.options.plugins.tooltip.bodyFont.family = font;
        misconductChart.options.plugins.tooltip.titleFont.family = font;
        misconductChart.options.scales.x.ticks.font.family = font;
        misconductChart.options.scales.y.ticks.font.family = font;
        misconductChart.update();
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

    updateAllContent();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 بدء تحميل صفحة بلاغات سوء التعامل...');
    
    // فحص وجود Chart.js
    console.log('🔍 فحص Chart.js:', typeof Chart);
    console.log('🔍 فحص ChartDataLabels:', typeof ChartDataLabels);
    
    // فحص وجود canvas
    const canvas = document.getElementById('misconductChart');
    console.log('🔍 فحص canvas عند التحميل:', canvas);
    
    // فحص جميع canvas الموجودة
    const allCanvas = document.querySelectorAll('canvas');
    console.log('🔍 جميع canvas الموجودة:', allCanvas);
    console.log('🔍 عدد canvas:', allCanvas.length);
    
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

    // إضافة مستمعي الأحداث للفلاتر (إذا لزم الأمر لاحقاً)

    // تحميل البيانات الأولية
    loadMisconductData();

    // Now, call applyLanguage to set initial language and update all content
    applyLanguage(currentLang);

    // Set active sidebar link based on current page
    const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-link');
    sidebarLinks.forEach(link => {
        link.parentElement.classList.remove('active');
        if (link.getAttribute('href') === 'misconduct.html') {
            link.parentElement.classList.add('active');
        }
    });

    // Apply Filter button functionality
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
            console.log('🔍 تطبيق الفلترة...');
            loadMisconductData(); // إعادة تحميل البيانات مع الفلترة الجديدة
        });
    }

    // Functionality for Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            console.log('🔄 تحديث البيانات...');
            loadMisconductData();
        });
    }

    // Functionality for Export Report button
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', () => {
            exportMisconductReport();
        });
    }

    // Language toggle functionality
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            applyLanguage(newLang);
        });
    }
    
    console.log('✅ تم تحميل صفحة بلاغات سوء التعامل بنجاح');
});
      