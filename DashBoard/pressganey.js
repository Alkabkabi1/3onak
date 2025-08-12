
        let currentLang = localStorage.getItem('lang') || 'ar';
        
        // Chart instances for each department
        let homeMedicineChart;
        let radiologyChart;
        let outpatientChart;
        let dentistryChart;
        let emergencyChart;
        let inpatientChart;
        let mortalityChart;
        let bloodBankChart;
        let overallSatisfactionChart;

        // Data for Top Cards
        const cardData = {
            totalDepartmentsSurvey: 8,
            averageSatisfactionScore: 84.3
        };

        // Data for Department Donut Charts (Satisfied / Not Satisfied)
        const departmentChartData = {
            'homeMedicine': { ar: 'الطب المنزلي', en: 'Home Medicine', satisfied: 90, notSatisfied: 10 },
            'radiology': { ar: 'الأشعة', en: 'Radiology', satisfied: 70, notSatisfied: 30 },
            'outpatient': { ar: 'العيادات الخارجية', en: 'Outpatient Clinics', satisfied: 80, notSatisfied: 20 },
            'dentistry': { ar: 'الأسنان', en: 'Dentistry', satisfied: 75, notSatisfied: 25 },
            'emergency': { ar: 'الطوارئ', en: 'Emergency', satisfied: 60, notSatisfied: 40 },
            'inpatient': { ar: 'أقسام التنويم', en: 'Inpatient Departments', satisfied: 65, notSatisfied: 35 },
            'mortality': { ar: 'الوفيات', en: 'Mortality', satisfied: 95, notSatisfied: 5 },
            'bloodBank': { ar: 'بنك الدم', en: 'Blood Bank', satisfied: 85, notSatisfied: 15 }
        };

        // Data for Overall Hospital Satisfaction Chart
        const overallSatisfactionData = {
            satisfied: 70, // Approximately 70% satisfied from image
            notSatisfied: 30 // Approximately 30% not satisfied from image
        };

        const satisfactionLabels = {
            ar: ['راضي', 'غير راضي'],
            en: ['Satisfied', 'Not Satisfied']
        };

        const satisfactionColors = ['#22C55E', '#EF4444']; // Green for Satisfied, Red for Not Satisfied

        function getFont() {
            return currentLang === 'ar' ? 'Tajawal' : 'Merriweather';
        }

        function updateCardData() {
            document.getElementById('totalDepartmentsSurvey').textContent = cardData.totalDepartmentsSurvey;
            document.getElementById('averageSatisfactionScore').textContent = cardData.averageSatisfactionScore;
        }

        function createDonutChart(ctx, data, labels, colors, chartName) {
            return new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors,
                        borderColor: '#ffffff',
                        borderWidth: 2,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false // Use custom HTML legend
                        },
                        tooltip: {
                            rtl: currentLang === 'ar',
                            bodyFont: { family: getFont() },
                            titleFont: { family: getFont() },
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        },
                        datalabels: {
                            color: '#fff', // White color for labels on segments
                            font: {
                                weight: 'bold',
                                size: 14,
                                family: getFont()
                            },
                            formatter: (value, ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? (value * 100 / total).toFixed(0) : 0;
                                return percentage > 0 ? percentage + '%' : ''; // Only show if > 0
                            }
                        }
                    }
                }
            });
        }

        function updateAllCharts() {
            const font = getFont();
            const currentSatisfactionLabels = satisfactionLabels[currentLang];

            // Update Department Charts
            for (const key in departmentChartData) {
                const dept = departmentChartData[key];
                const ctx = document.getElementById(`${key}Chart`);
                if (ctx) {
                    const data = [dept.satisfied, dept.notSatisfied];
                    // Ensure chart instance exists before trying to update
                    if (window[`${key}Chart`]) {
                        window[`${key}Chart`].data.labels = currentSatisfactionLabels;
                        window[`${key}Chart`].data.datasets[0].data = data;
                        window[`${key}Chart`].options.plugins.tooltip.rtl = currentLang === 'ar';
                        window[`${key}Chart`].options.plugins.tooltip.bodyFont.family = font;
                        window[`${key}Chart`].options.plugins.tooltip.titleFont.family = font;
                        window[`${key}Chart`].options.plugins.datalabels.font.family = font;
                        window[`${key}Chart`].update();
                    }
                }
            }

            // Update Overall Satisfaction Chart
            const overallCtx = document.getElementById('overallSatisfactionChart');
            if (overallCtx) {
                const data = [overallSatisfactionData.satisfied, overallSatisfactionData.notSatisfied];
                if (overallSatisfactionChart) {
                    overallSatisfactionChart.data.labels = currentSatisfactionLabels;
                    overallSatisfactionChart.data.datasets[0].data = data;
                    overallSatisfactionChart.options.plugins.tooltip.rtl = currentLang === 'ar';
                    overallSatisfactionChart.options.plugins.tooltip.bodyFont.family = font;
                    overallSatisfactionChart.options.plugins.tooltip.titleFont.family = font;
                    overallSatisfactionChart.options.plugins.datalabels.font.family = font;
                    overallSatisfactionChart.update();
                }
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

            // Update dropdown selected text
            const quarterSelectSpan = document.getElementById('selectedQuarter');
            if (quarterSelectSpan) {
                const selectedValue = quarterSelectSpan.dataset.value || 'Choose Quarter'; // Default value
                const optionElement = document.querySelector(`#quarterOptions .custom-select-option[data-value="${selectedValue}"]`);
                if (optionElement) {
                    quarterSelectSpan.textContent = optionElement.getAttribute(`data-${lang}`);
                } else {
                    quarterSelectSpan.textContent = lang === 'ar' ? 'اختر الربع' : 'Choose Quarter';
                }
            }

            const monthSelectSpan = document.getElementById('selectedMonth');
            if (monthSelectSpan) {
                const selectedValue = monthSelectSpan.dataset.value || 'Choose Month'; // Default value
                const optionElement = document.querySelector(`#monthOptions .custom-select-option[data-value="${selectedValue}"]`);
                if (optionElement) {
                    monthSelectSpan.textContent = optionElement.getAttribute(`data-${lang}`);
                } else {
                    monthSelectSpan.textContent = lang === 'ar' ? 'اختر الشهر' : 'Choose Month';
                }
            }

            updateAllCharts(); // Update all charts with new language settings
        }

        document.addEventListener('DOMContentLoaded', () => {
            const langToggleBtn = document.getElementById('langToggle');
            const exportReportBtn = document.getElementById('exportReportBtn');
            const quarterSelect = document.getElementById('quarterSelect');
            const quarterOptions = document.getElementById('quarterOptions');
            const monthSelect = document.getElementById('monthSelect');
            const monthOptions = document.getElementById('monthOptions');

            // Initialize Card Data
            updateCardData();

            // --- INITIALIZE ALL CHARTS HERE ---
            const currentSatisfactionLabels = satisfactionLabels[currentLang];
            const font = getFont();

            for (const key in departmentChartData) {
                const dept = departmentChartData[key];
                const ctx = document.getElementById(`${key}Chart`);
                if (ctx) {
                    const data = [dept.satisfied, dept.notSatisfied];
                    // Create the chart instance and assign it to the global variable
                    window[`${key}Chart`] = createDonutChart(ctx, data, currentSatisfactionLabels, satisfactionColors, key);
                }
            }

            const overallCtx = document.getElementById('overallSatisfactionChart');
            if (overallCtx) {
                const data = [overallSatisfactionData.satisfied, overallSatisfactionData.notSatisfied];
                overallSatisfactionChart = createDonutChart(overallCtx, data, currentSatisfactionLabels, satisfactionColors, 'overallSatisfaction');
            }
            // --- END INITIAL CHART INITIALIZATION ---

            // Now, call applyLanguage to set initial language and update all charts
            applyLanguage(currentLang);

            // Set active sidebar link based on current page
            const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-link');
            sidebarLinks.forEach(link => {
                link.parentElement.classList.remove('active'); // Remove active from all
                if (link.getAttribute('href') === 'pressganey.html') { // Check for the specific page
                    link.parentElement.classList.add('active'); // Add active to the correct one
                }
            });

            // Language toggle functionality
            if (langToggleBtn) {
                langToggleBtn.addEventListener('click', () => {
                    const newLang = currentLang === 'ar' ? 'en' : 'ar';
                    applyLanguage(newLang);
                });
            }

            // Dropdown functionality for Quarter
            if (quarterSelect) {
                quarterSelect.addEventListener('click', () => {
                    quarterOptions.classList.toggle('open');
                    const icon = quarterSelect.querySelector('.fas');
                    if (quarterOptions.classList.contains('open')) {
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-up');
                    } else {
                        icon.classList.remove('fa-chevron-up');
                        icon.classList.add('fa-chevron-down');
                    }
                });

                quarterOptions.addEventListener('click', (event) => {
                    if (event.target.classList.contains('custom-select-option')) {
                        const selectedValue = event.target.dataset.value;
                        const selectedText = event.target.textContent;
                        document.getElementById('selectedQuarter').textContent = selectedText;
                        document.getElementById('selectedQuarter').dataset.value = selectedValue;
                        quarterOptions.classList.remove('open');
                        quarterSelect.querySelector('.fas').classList.remove('fa-chevron-up');
                        quarterSelect.querySelector('.fas').classList.add('fa-chevron-down');
                        // Add logic to filter data based on selected quarter if dynamic data is available
                        console.log(`Selected Quarter: ${selectedValue}`);
                    }
                });
            }

            // Dropdown functionality for Month
            if (monthSelect) {
                monthSelect.addEventListener('click', () => {
                    monthOptions.classList.toggle('open');
                    const icon = monthSelect.querySelector('.fas');
                    if (monthOptions.classList.contains('open')) {
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-up');
                    } else {
                        icon.classList.remove('fa-chevron-up');
                        icon.classList.add('fa-chevron-down');
                    }
                });

                monthOptions.addEventListener('click', (event) => {
                    if (event.target.classList.contains('custom-select-option')) {
                        const selectedValue = event.target.dataset.value;
                        const selectedText = event.target.textContent;
                        document.getElementById('selectedMonth').textContent = selectedText;
                        document.getElementById('selectedMonth').dataset.value = selectedValue;
                        monthOptions.classList.remove('open');
                        monthSelect.querySelector('.fas').classList.remove('fa-chevron-up');
                        monthSelect.querySelector('.fas').classList.add('fa-chevron-down');
                        // Add logic to filter data based on selected month if dynamic data is available
                        console.log(`Selected Month: ${selectedValue}`);
                    }
                });
            }

            // Close dropdowns if clicked outside
            document.addEventListener('click', (event) => {
                if (quarterSelect && !quarterSelect.contains(event.target) && quarterOptions && !quarterOptions.contains(event.target)) {
                    quarterOptions.classList.remove('open');
                    quarterSelect.querySelector('.fas').classList.remove('fa-chevron-up');
                    quarterSelect.querySelector('.fas').classList.add('fa-chevron-down');
                }
                if (monthSelect && !monthSelect.contains(event.target) && monthOptions && !monthOptions.contains(event.target)) {
                    monthOptions.classList.remove('open');
                    monthSelect.querySelector('.fas').classList.remove('fa-chevron-up');
                    monthSelect.querySelector('.fas').classList.add('fa-chevron-down');
                }
            });

            // Functionality for Export Report button
            if (exportReportBtn) {
                exportReportBtn.addEventListener('click', () => {
                    window.print();
                });
            }
        });