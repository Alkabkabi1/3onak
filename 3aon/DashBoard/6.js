// 6.js

document.addEventListener('DOMContentLoaded', function() {
    // Register the datalabels plugin if available
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    } else {
        console.warn('Chart.js Datalabels plugin not loaded. Numbers on charts will not appear.');
    }

    // --- Horizontal Bar Chart ---
    const horizontalCtx = document.getElementById('visitorNotesHorizontalChart');
    let visitorNotesHorizontalChart; // Declare outside to make it accessible for updates

    if (horizontalCtx) {
        const horizontalData = {
            labels: ['الاستقبال', 'التثقيف الصحي', 'مكتب المدير', 'القبالة', 'شؤون المرضى', 'العيادات', 'شؤون التمريض'], // From image
            datasets: [{
                label: 'منفذ',
                data: [6, 4, 3, 2, 0, 5, 4], // Example data for executed (green)
                backgroundColor: '#4CAF50', // Green
                borderColor: '#388e3c',
                borderWidth: 1
            }, {
                label: 'غير منفذ',
                data: [2, 3, 2, 1, 1, 3, 2], // Example data for not executed (red)
                backgroundColor: '#F44336', // Red
                borderColor: '#cc3636',
                borderWidth: 1
            }]
        };

        const horizontalOptions = {
            indexAxis: 'y', // Makes it a horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false, // Custom legend in HTML
                },
                title: {
                    display: false, // Title in HTML
                },
                tooltip: {
                    rtl: true,
                    bodyFont: { family: 'Tajawal' },
                    titleFont: { family: 'Tajawal' },
                    callbacks: { // Customize tooltip to show combined total if desired
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.x !== null) {
                                label += context.parsed.x;
                            }
                            return label;
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'right',
                    color: '#fff', // White color for data labels inside bars
                    font: {
                        weight: 'bold',
                        size: 12,
                        family: 'Tajawal'
                    },
                    formatter: function(value, context) {
                        // Only show value if it's > 0
                        return value > 0 ? value : '';
                    }
                }
            },
            scales: {
                x: {
                    stacked: true, // Key for stacked bars
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { family: 'Tajawal' }
                    },
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0, 0, 0, 0.08)'
                    }
                },
                y: {
                    stacked: true, // Key for stacked bars
                    ticks: {
                        font: { family: 'Tajawal' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        };

        visitorNotesHorizontalChart = new Chart(horizontalCtx, {
            type: 'bar',
            data: horizontalData,
            options: horizontalOptions
        });
    } else {
        console.error('Canvas element for horizontal chart not found.');
    }

    // --- Doughnut Chart ---
    const doughnutCtx = document.getElementById('visitorNotesDoughnutChart');
    let visitorNotesDoughnutChart;

    if (doughnutCtx) {
        const doughnutData = {
            labels: ['مركز الإسعاف', 'الطوارئ', 'العيادات الخارجية', 'التنويم'], // From image
            datasets: [{
                data: [15, 10, 8, 11], // Example data for each segment
                backgroundColor: [
                    '#007bff', // var(--doughnut-blue)
                    '#4CAF50', // var(--doughnut-green)
                    '#9c27b0', // var(--doughnut-purple)
                    '#ff007f'  // var(--doughnut-red)
                ],
                borderColor: '#fff', // White border between segments
                borderWidth: 2
            }]
        };

        const doughnutOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false, // Custom legend in HTML
                },
                tooltip: {
                    rtl: true,
                    bodyFont: { family: 'Tajawal' },
                    titleFont: { family: 'Tajawal' }
                },
                datalabels: {
                    color: '#fff', // Data labels inside segments
                    font: {
                        weight: 'bold',
                        size: 14,
                        family: 'Tajawal'
                    },
                    formatter: (value, context) => {
                        // Calculate percentage
                        const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(0);
                        return percentage > 0 ? `${percentage}%` : ''; // Show percentage, hide if 0
                    }
                }
            }
        };

        visitorNotesDoughnutChart = new Chart(doughnutCtx, {
            type: 'doughnut',
            data: doughnutData,
            options: doughnutOptions
        });
    } else {
        console.error('Canvas element for doughnut chart not found.');
    }

    // --- Language Toggle Logic (Re-used and adapted) ---
    const langToggleBtn = document.getElementById('langToggle');
    const langText = document.getElementById('langText');
    const headerTitle = document.querySelector('.header-title');
    let isArabic = true; // Assume Arabic is default

    // Elements to translate in this specific page
    const sidebarLinks = document.querySelectorAll('.nav-menu ul li a');
    const hospitalNameAr = document.querySelector('.hospital-name-ar');
    const hospitalNameEn = document.querySelector('.hospital-name-en');
    const statCardValues = document.querySelectorAll('.stat-card .stat-value'); // No change for numbers
    const statCardLabels = document.querySelectorAll('.stat-card .stat-label');
    const dropdownTitle = document.querySelector('.charts-section .chart-title');
    const dropdownOptions = document.querySelectorAll('#adminDropdown option');
    const horizontalChartTitle = document.querySelector('.horizontal-bar-chart-card .chart-card-title');
    const doughnutChartTitle = document.querySelector('.doughnut-chart-card .chart-card-title');
    const legendItems = document.querySelectorAll('.legend-item'); // All legend items
    const exportButton = document.querySelector('.export-button');

    const translations = {
        ar: {
            home: 'الصفحة الرئيسية',
            overview: 'نظرة عامة',
            "937-reports": 'مؤشر بلاغات 937',
            "misconduct-reports": 'بلاغات سوء التعامل',
            prestige: 'مؤشر بريستيجي',
            "attendance-complaints": 'مؤشر الشكاوى الحضوريه',
            "clinical-visitor-notes": 'ملاحظات الزائر السريري',
            "general-requests": 'مؤشر الطلبات العامة',
            hospital_ar: 'مستشفى الملك عبد العزيز',
            hospital_en: 'King Abdulaziz Hospital',
            total_observations_sites: 'إجمالي عدد مواقع الملاحظات',
            total_responsible_departments: 'إجمالي عدد الإدارات المسؤولة',
            total_clinical_visitor_notes: 'إجمالي عدد ملاحظات الزائر السريري',
            select_responsible_admin: 'اختر الإدارة المسؤولة',
            all: 'الكل',
            engineering_affairs: 'الشؤون الهندسية',
            general_technologies: 'التقنيات العامة',
            clinical_visitor_notes_by_dept: 'ملاحظات الزائر السريري حسب القسم وحالة التنفيذ',
            executed: 'منفذ',
            not_executed: 'غير منفذ',
            clinical_visitor_notes_by_location: 'ملاحظات الزائر السريري حسب موقع الملاحظة',
            ambulance_center: 'مركز الإسعاف',
            emergency: 'الطوارئ',
            outpatient_clinics: 'العيادات الخارجية',
            inpatient: 'التنويم',
            export_report: 'تصدير التقرير',
            lang_toggle: 'العربية | English'
        },
        en: {
            home: 'Home Page',
            overview: 'Overview',
            "937-reports": '937 Reports Indicator',
            "misconduct-reports": 'Misconduct Reports',
            prestige: 'Prestige Indicator',
            "attendance-complaints": 'On-site Complaints Indicator',
            "clinical-visitor-notes": 'Clinical Visitor Notes',
            "general-requests": 'General Requests Indicator',
            hospital_ar: 'King Abdulaziz Hospital', // Keep AR name for display in EN if needed
            hospital_en: 'King Abdulaziz Hospital',
            total_observations_sites: 'Total Observation Sites',
            total_responsible_departments: 'Total Responsible Departments',
            total_clinical_visitor_notes: 'Total Clinical Visitor Notes',
            select_responsible_admin: 'Select Responsible Department',
            all: 'All',
            engineering_affairs: 'Engineering Affairs',
            general_technologies: 'General Technologies',
            clinical_visitor_notes_by_dept: 'Clinical Visitor Notes by Department & Status',
            executed: 'Executed',
            not_executed: 'Not Executed',
            clinical_visitor_notes_by_location: 'Clinical Visitor Notes by Observation Location',
            ambulance_center: 'Ambulance Center',
            emergency: 'Emergency',
            outpatient_clinics: 'Outpatient Clinics',
            inpatient: 'Inpatient',
            export_report: 'Export Report',
            lang_toggle: 'English | العربية'
        }
    };

    function updateTexts(lang) {
        langText.textContent = translations[lang].lang_toggle;
        headerTitle.textContent = headerTitle.dataset[lang];
        document.body.dir = (lang === 'ar' ? 'rtl' : 'ltr');

        // Sidebar links
        sidebarLinks[0].lastChild.textContent = translations[lang].home;
        sidebarLinks[1].lastChild.textContent = translations[lang].overview;
        sidebarLinks[2].lastChild.textContent = translations[lang]["937-reports"];
        sidebarLinks[3].lastChild.textContent = translations[lang]["misconduct-reports"];
        sidebarLinks[4].lastChild.textContent = translations[lang].prestige;
        sidebarLinks[5].lastChild.textContent = translations[lang]["attendance-complaints"];
        sidebarLinks[6].lastChild.textContent = translations[lang]["clinical-visitor-notes"];
        sidebarLinks[7].lastChild.textContent = translations[lang]["general-requests"];


        // Hospital names in main content header
        hospitalNameAr.textContent = translations[lang].hospital_ar;
        hospitalNameEn.textContent = translations[lang].hospital_en;

        // Stat Cards
        statCardLabels[0].textContent = translations[lang].total_observations_sites;
        statCardLabels[1].textContent = translations[lang].total_responsible_departments;
        statCardLabels[2].textContent = translations[lang].total_clinical_visitor_notes;

        // Dropdown
        dropdownTitle.textContent = translations[lang].select_responsible_admin;
        dropdownOptions[0].textContent = translations[lang].all;
        dropdownOptions[1].textContent = translations[lang].engineering_affairs;
        dropdownOptions[2].textContent = translations[lang].general_technologies;
        // Add more options here if you have them in HTML

        // Chart Titles
        horizontalChartTitle.textContent = translations[lang].clinical_visitor_notes_by_dept;
        doughnutChartTitle.textContent = translations[lang].clinical_visitor_notes_by_location;

        // Legends (specific for this page)
        legendItems[0].lastChild.textContent = translations[lang].executed; // Horizontal chart legend
        legendItems[1].lastChild.textContent = translations[lang].not_executed; // Horizontal chart legend
        legendItems[2].lastChild.textContent = translations[lang].ambulance_center; // Doughnut chart legend
        legendItems[3].lastChild.textContent = translations[lang].emergency; // Doughnut chart legend
        legendItems[4].lastChild.textContent = translations[lang].outpatient_clinics; // Doughnut chart legend
        legendItems[5].lastChild.textContent = translations[lang].inpatient; // Doughnut chart legend

        // Export Button
        exportButton.lastChild.textContent = translations[lang].export_report;

        // Update Chart.js options for RTL and fonts
        const chartFontFamily = (lang === 'ar' ? 'Tajawal' : 'Merriweather');

        // Horizontal Chart Update
        if (visitorNotesHorizontalChart) {
            visitorNotesHorizontalChart.options.plugins.tooltip.rtl = (lang === 'ar');
            visitorNotesHorizontalChart.options.plugins.tooltip.bodyFont.family = chartFontFamily;
            visitorNotesHorizontalChart.options.plugins.tooltip.titleFont.family = chartFontFamily;
            visitorNotesHorizontalChart.options.scales.x.ticks.font.family = chartFontFamily;
            visitorNotesHorizontalChart.options.scales.y.ticks.font.family = chartFontFamily;
            if (visitorNotesHorizontalChart.options.plugins.datalabels) {
                visitorNotesHorizontalChart.options.plugins.datalabels.font.family = chartFontFamily;
            }
            visitorNotesHorizontalChart.update();
        }

        // Doughnut Chart Update
        if (visitorNotesDoughnutChart) {
            visitorNotesDoughnutChart.options.plugins.tooltip.rtl = (lang === 'ar');
            visitorNotesDoughnutChart.options.plugins.tooltip.bodyFont.family = chartFontFamily;
            visitorNotesDoughnutChart.options.plugins.tooltip.titleFont.family = chartFontFamily;
            if (visitorNotesDoughnutChart.options.plugins.datalabels) {
                visitorNotesDoughnutChart.options.plugins.datalabels.font.family = chartFontFamily;
            }
            visitorNotesDoughnutChart.update();
        }
    }

    // Initial language setup (default to Arabic)
    updateTexts('ar');

    langToggleBtn.addEventListener('click', () => {
        isArabic = !isArabic;
        updateTexts(isArabic ? 'ar' : 'en');
    });

    // Handle dropdown change (if needed to update chart data)
    // const adminDropdown = document.getElementById('adminDropdown');
    // adminDropdown.addEventListener('change', function() {
    //     const selectedValue = this.value;
    //     // Here you would update your chart data based on selectedValue
    //     // For example: updateHorizontalChartData(selectedValue);
    // });
});