    let currentLang = localStorage.getItem('lang') || 'ar';
        let complaintCategoriesChart;
        let departmentComplaintsChart;

        // Data for Main Card
        const mainCardData = {
            totalReports: 804
        };

        // Data for Complaint Categories by Scope Chart
        const complaintCategoriesData = {
            labels: {
                ar: [
                    'مشكلات متعلقة بسحب الدم', 'مشكلات التواصل مع الطبيب/الممرض', 'حجز موعد',
                    'نقص دواء', 'إجراءات متعلقة بالتشخيص', 'تحاليل تخصصية',
                    'مشكلات صرف الوصفة الطبية', 'طلب تغيير/تأجيل موعد', 'مشكلات باستقبال الحالة',
                    'انتقال في المبنى', 'الرعاية الطبية دون الأوراق', 'الأوراق المرضية'
                ],
                en: [
                    'Blood Withdrawal Related Issues', 'Request to Contact Doctor/Nurse', 'Appointment Booking',
                    'Lack of Medication', 'Diagnosis Related Procedures', 'Specialized Tests',
                    'Prescription Dispensing Issues', 'Appointment Change/Postpone Request', 'Patient Reception Issues',
                    'Building Transfer', 'Medical Care without Records', 'Medical Records'
                ]
            },
            values: [220, 110, 80, 60, 40, 30, 20, 15, 10, 5, 5, 5]
        };

        // Data for Registered Complaints in Departments - Sections Chart
        const departmentComplaintsData = {
            labels: {
                ar: [
                    'مركز المعلومات', 'قسم المواعيد', 'قسم الطوارئ', 'قسم العيادات',
                    'قسم الأشعة', 'قسم المختبر', 'قسم الصيدلية', 'قسم التغذية',
                    'قسم العلاج الطبيعي', 'قسم الأسنان'
                ],
                en: [
                    'Information Center', 'Appointments Department', 'Emergency Department', 'Clinics Department',
                    'Radiology Department', 'Lab Department', 'Pharmacy Department', 'Nutrition Department',
                    'Physical Therapy Department', 'Dentistry Department'
                ]
            },
            values: [380, 280, 140, 90, 80, 70, 60, 50, 30, 20]
        };

        function getFont() {
            return currentLang === 'ar' ? 'Tajawal' : 'Merriweather';
        }

        function updateMainCard() {
            document.getElementById('totalReports').textContent = mainCardData.totalReports;
        }

        function createHorizontalBarChart(ctx, dataLabels, dataValues, chartName) {
            let maxX, stepSizeX;

            if (chartName === 'Complaint Categories by Scope') {
                maxX = 250;
                stepSizeX = 50;
            } else if (chartName === 'Total Registered Complaints in Departments - Sections') {
                maxX = 400;
                stepSizeX = 50;
            }

            return new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: dataLabels[currentLang],
                    datasets: [{
                        label: chartName,
                        data: dataValues,
                        backgroundColor: '#EF4444', // Red color for bars
                        borderColor: '#DC2626',
                        borderWidth: 1,
                        borderRadius: 5,
                    }]
                },
                options: {
                    indexAxis: 'y', // Horizontal bar chart
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false // Hide legend
                        },
                        tooltip: {
                            rtl: currentLang === 'ar',
                            bodyFont: { family: getFont() },
                            titleFont: { family: getFont() }
                        }
                    },
                    scales: {
                        x: { // Value axis
                            beginAtZero: true,
                            max: maxX, // Dynamic max based on chart
                            ticks: {
                                stepSize: stepSizeX, // Dynamic step size
                                font: {
                                    family: getFont(),
                                    size: 12, /* Increased font size for axis ticks */
                                    color: '#333' /* Dark color for axis tick labels */
                                }
                            },
                            grid: {
                                drawBorder: false,
                                color: 'rgba(0, 0, 0, 0.1)', // Visible grid lines
                            },
                            position: currentLang === 'ar' ? 'top' : 'bottom' // Position X-axis based on RTL/LTR
                        },
                        y: { // Category axis
                            ticks: {
                                font: {
                                    family: getFont(),
                                    size: 12, /* Increased font size for axis ticks */
                                    color: '#333' /* Dark color for axis tick labels */
                                }
                            },
                            grid: { display: false }, // No vertical grid lines
                            reverse: currentLang === 'ar' // Reverse for RTL to keep categories in order
                        }
                    }
                }
            });
        }

        function updateAllCharts() {
            const font = getFont();

            // Update Complaint Categories Chart
            if (complaintCategoriesChart) {
                complaintCategoriesChart.data.labels = complaintCategoriesData.labels[currentLang];
                complaintCategoriesChart.data.datasets[0].data = complaintCategoriesData.values;
                complaintCategoriesChart.options.plugins.tooltip.rtl = currentLang === 'ar';
                complaintCategoriesChart.options.plugins.tooltip.bodyFont.family = font;
                complaintCategoriesChart.options.plugins.tooltip.titleFont.family = font;
                complaintCategoriesChart.options.scales.x.ticks.font.family = font;
                complaintCategoriesChart.options.scales.y.ticks.font.family = font;
                complaintCategoriesChart.options.scales.x.position = currentLang === 'ar' ? 'top' : 'bottom';
                complaintCategoriesChart.options.scales.y.reverse = currentLang === 'ar';
                complaintCategoriesChart.update();
            }

            // Update Department Complaints Chart
            if (departmentComplaintsChart) {
                departmentComplaintsChart.data.labels = departmentComplaintsData.labels[currentLang];
                departmentComplaintsChart.data.datasets[0].data = departmentComplaintsData.values;
                departmentComplaintsChart.options.plugins.tooltip.rtl = currentLang === 'ar';
                departmentComplaintsChart.options.plugins.tooltip.bodyFont.family = font;
                departmentComplaintsChart.options.plugins.tooltip.titleFont.family = font;
                departmentComplaintsChart.options.scales.x.ticks.font.family = font;
                departmentComplaintsChart.options.scales.y.ticks.font.family = font;
                departmentComplaintsChart.options.scales.x.position = currentLang === 'ar' ? 'top' : 'bottom';
                departmentComplaintsChart.options.scales.y.reverse = currentLang === 'ar';
                departmentComplaintsChart.update();
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
            const dropdowns = ['day', 'week', 'month', 'quarter', 'department'];
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
                        else if (id === 'week') span.textContent = lang === 'ar' ? 'اختر الأسبوع' : 'Choose Week';
                        else if (id === 'month') span.textContent = lang === 'ar' ? 'اختر الشهر' : 'Choose Month';
                        else if (id === 'quarter') span.textContent = lang === 'ar' ? 'اختر الربع' : 'Choose Quarter';
                        else if (id === 'department') span.textContent = lang === 'ar' ? 'اختر الإدارة/القسم' : 'Choose Department/Section';
                    }
                }
            });

            updateAllCharts(); // Update all charts with new language settings
        }

        document.addEventListener('DOMContentLoaded', () => {
            const langToggleBtn = document.getElementById('langToggle');
            const exportReportBtn = document.getElementById('exportReportBtn');

            // Initialize Main Card Data
            updateMainCard();

            // --- INITIALIZE ALL CHARTS HERE ---
            const complaintCategoriesCtx = document.getElementById('complaintCategoriesChart');
            if (complaintCategoriesCtx) {
                complaintCategoriesChart = createHorizontalBarChart(
                    complaintCategoriesCtx,
                    complaintCategoriesData.labels,
                    complaintCategoriesData.values,
                    'Complaint Categories by Scope'
                );
            }

            const departmentComplaintsCtx = document.getElementById('departmentComplaintsChart');
            if (departmentComplaintsCtx) {
                departmentComplaintsChart = createHorizontalBarChart(
                    departmentComplaintsCtx,
                    departmentComplaintsData.labels,
                    departmentComplaintsData.values,
                    'Total Registered Complaints in Departments - Sections'
                );
            }
            // --- END INITIAL CHART INITIALIZATION ---

            // Now, call applyLanguage to set initial language and update all charts
            applyLanguage(currentLang);

            // Set active sidebar link based on current page
            const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-link');
            sidebarLinks.forEach(link => {
                link.parentElement.classList.remove('active'); // Remove active from all
                if (link.getAttribute('href') === 'report-937.html') { // Check for the specific page
                    link.parentElement.classList.add('active'); // Add active to the correct one
                }
            });

            // Dropdown functionality - Generic function for all dropdowns
            function setupDropdown(selectId, optionsId) {
                const select = document.getElementById(selectId);
                const options = document.getElementById(optionsId);

                if (select && options) {
                    select.addEventListener('click', () => {
                        options.classList.toggle('open');
                        const icon = select.querySelector('.fas');
                        if (options.classList.contains('open')) {
                            icon.classList.remove('fa-chevron-down');
                            icon.classList.add('fa-chevron-up');
                        } else {
                            icon.classList.remove('fa-chevron-up');
                            icon.classList.add('fa-chevron-down');
                        }
                    });

                    options.addEventListener('click', (event) => {
                        if (event.target.classList.contains('custom-select-option')) {
                            const selectedValue = event.target.dataset.value;
                            const selectedText = event.target.textContent;
                            select.querySelector('span').textContent = selectedText;
                            select.querySelector('span').dataset.value = selectedValue; // Store selected value
                            options.classList.remove('open');
                            select.querySelector('.fas').classList.remove('fa-chevron-up');
                            select.querySelector('.fas').classList.add('fa-chevron-down');
                            // Add logic to filter data based on selected value if dynamic data is available
                            console.log(`Selected ${selectId}: ${selectedValue}`);
                        }
                    });
                }
            }

            // Setup all dropdowns
            setupDropdown('daySelect', 'dayOptions');
            setupDropdown('weekSelect', 'weekOptions');
            setupDropdown('monthSelect', 'monthOptions');
            setupDropdown('quarterSelect', 'quarterOptions');
            setupDropdown('departmentSelect', 'departmentOptions');

            // Close dropdowns if clicked outside
            document.addEventListener('click', (event) => {
                const dropdowns = ['day', 'week', 'month', 'quarter', 'department'];
                dropdowns.forEach(id => {
                    const select = document.getElementById(`${id}Select`);
                    const options = document.getElementById(`${id}Options`);
                    if (select && options && !select.contains(event.target) && !options.contains(event.target)) {
                        options.classList.remove('open');
                        select.querySelector('.fas').classList.remove('fa-chevron-up');
                        select.querySelector('.fas').classList.add('fa-chevron-down');
                    }
                });
            });

            // Language toggle functionality
            if (langToggleBtn) {
                langToggleBtn.addEventListener('click', () => {
                    const newLang = currentLang === 'ar' ? 'en' : 'ar';
                    applyLanguage(newLang);
                });
            }

            // Functionality for Export Report button
            if (exportReportBtn) {
                exportReportBtn.addEventListener('click', () => {
                    window.print();
                });
            }
        });