
        let currentLang = localStorage.getItem('lang') || 'ar';
        let horizontalBarChart;
        let donutChart;

        // Dummy Data for Cards
        const cardData = {
            totalObservationLocations: 5,
            totalResponsibleDepartments: 13,
            totalSecretVisitorNotes: 44
        };

        // Dummy Data for Horizontal Bar Chart (Secret Visitor Notes by Department and Execution Status)
        const horizontalChartRawData = {
            'مكتب المدير': { executed: 3, notExecuted: 2 },
            'العيادات الخارجية': { executed: 4, notExecuted: 3 },
            'الطوارئ': { executed: 5, notExecuted: 4 },
            'التنويم': { executed: 6, notExecuted: 5 },
            'شؤون الموظفين': { executed: 7, notExecuted: 6 },
            'الخدمات الطبية': { executed: 8, notExecuted: 7 }
        };

        const horizontalChartLabelsByLang = {
            ar: Object.keys(horizontalChartRawData),
            en: ['Director\'s Office', 'Outpatient Clinics', 'Emergency', 'Inpatient', 'Employee Affairs', 'Medical Services']
        };

        // Dummy Data for Donut Chart (Secret Visitor Notes by Observation Location)
        const donutChartRawData = {
            'العيادات الخارجية': 30,
            'التنويم': 25,
            'الطوارئ': 25,
            'مركز الإسعاف': 20
        };

        const donutChartLabelsByLang = {
            ar: Object.keys(donutChartRawData),
            en: ['Outpatient Clinics', 'Inpatient', 'Emergency', 'Ambulance Center']
        };

        const filterLabels = {
            executed: { ar: 'منفذ', en: 'Executed' },
            notExecuted: { ar: 'غير منفذ', en: 'Not Executed' }
        };

        function getFont() {
            return currentLang === 'ar' ? 'Tajawal' : 'serif';
        }

        function updateCardData() {
            document.getElementById('totalObservationLocations').textContent = cardData.totalObservationLocations;
            document.getElementById('totalResponsibleDepartments').textContent = cardData.totalResponsibleDepartments;
            document.getElementById('totalSecretVisitorNotes').textContent = cardData.totalSecretVisitorNotes;
        }

        function updateHorizontalBarChart() {
            const labels = horizontalChartLabelsByLang[currentLang];
            const font = getFont();

            const executedData = labels.map((label, index) => {
                const arLabel = horizontalChartLabelsByLang.ar[index];
                return horizontalChartRawData[arLabel].executed;
            });
            const notExecutedData = labels.map((label, index) => {
                const arLabel = horizontalChartLabelsByLang.ar[index];
                return horizontalChartRawData[arLabel].notExecuted;
            });

            horizontalBarChart.data.labels = labels;
            horizontalBarChart.data.datasets = [
                {
                    label: filterLabels.notExecuted[currentLang],
                    data: notExecutedData,
                    backgroundColor: '#F44336', // Red
                    borderColor: '#cc3636',
                    borderWidth: 1,
                    borderRadius: 5,
                    categoryPercentage: 0.5,
                    barPercentage: 0.8,
                },
                {
                    label: filterLabels.executed[currentLang],
                    data: executedData,
                    backgroundColor: '#4CAF50', // Green
                    borderColor: '#388e3c',
                    borderWidth: 1,
                    borderRadius: 5,
                    categoryPercentage: 0.5,
                    barPercentage: 0.8,
                }
            ];

            horizontalBarChart.options.plugins.tooltip.rtl = currentLang === 'ar';
            horizontalBarChart.options.plugins.tooltip.bodyFont.family = font;
            horizontalBarChart.options.plugins.tooltip.titleFont.family = font;
            horizontalBarChart.options.plugins.datalabels.font.family = font;
            horizontalBarChart.options.scales.x.ticks.font.family = font;
            horizontalBarChart.options.scales.y.ticks.font.family = font;

            // Adjust X-axis (value axis for horizontal bar chart) position for RTL
            horizontalBarChart.options.scales.x.position = currentLang === 'ar' ? 'top' : 'bottom';
            horizontalBarChart.options.scales.y.reverse = currentLang === 'ar'; // Reverse Y-axis for RTL to keep categories top-to-bottom

            horizontalBarChart.update();
        }

        function updateDonutChart() {
            const labels = donutChartLabelsByLang[currentLang];
            const font = getFont();
            const dataValues = Object.values(donutChartRawData);

            donutChart.data.labels = labels;
            donutChart.data.datasets = [
                {
                    data: dataValues,
                    backgroundColor: ['#3B82F6', '#EC4899', '#EF4444', '#22C55E'], // Blue, Pink, Red, Green
                    borderColor: '#ffffff',
                    borderWidth: 2,
                }
            ];

            donutChart.options.plugins.tooltip.rtl = currentLang === 'ar';
            donutChart.options.plugins.tooltip.bodyFont.family = font;
            donutChart.options.plugins.tooltip.titleFont.family = font;
            donutChart.options.plugins.datalabels.font.family = font;

            donutChart.update();
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

            // Update dropdown selected text
            const selectedDepartmentSpan = document.getElementById('selectedDepartment');
            const selectedValue = selectedDepartmentSpan.dataset.value || 'all';
            const allOption = document.querySelector(`.custom-select-option[data-value="${selectedValue}"]`);
            if (allOption) {
                selectedDepartmentSpan.textContent = allOption.getAttribute(`data-${lang}`);
            }

            updateHorizontalBarChart();
            updateDonutChart();
        }

        document.addEventListener('DOMContentLoaded', () => {
            const horizontalCtx = document.getElementById('horizontalBarChart');
            const donutCtx = document.getElementById('donutChart');
            const langToggleBtn = document.getElementById('langToggle');
            const aiInsightsBtn = document.getElementById('aiInsightsBtn');
            const aiInsightsModal = document.getElementById('aiInsightsModal');
            const closeModalBtn = document.getElementById('closeModalBtn');
            const exportReportBtn = document.getElementById('exportReportBtn');
            const aiInsightsContent = document.getElementById('aiInsightsContent');
            const aiLoadingSpinner = document.getElementById('aiLoadingSpinner');
            const departmentSelect = document.getElementById('departmentSelect');
            const departmentOptions = document.getElementById('departmentOptions');

            // Initialize Cards
            updateCardData();

            // Initialize Horizontal Bar Chart
            horizontalBarChart = new Chart(horizontalCtx, {
                type: 'bar',
                data: {
                    labels: horizontalChartLabelsByLang[currentLang],
                    datasets: []
                },
                options: {
                    indexAxis: 'y', // Make it a horizontal bar chart
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false // Use custom HTML legend
                        },
                        tooltip: {
                            rtl: currentLang === 'ar',
                            bodyFont: { family: getFont() },
                            titleFont: { family: getFont() }
                        },
                        datalabels: {
                            anchor: 'end',
                            align: 'end', // Align labels at the end of the bar
                            color: '#4a5568',
                            font: {
                                weight: 'bold',
                                size: 12,
                                family: getFont()
                            },
                            formatter: value => (value > 0 ? value : '')
                        }
                    },
                    scales: {
                        x: { // This is the value axis for horizontal bar chart
                            beginAtZero: true,
                            max: 10, // Max value based on dummy data
                            ticks: {
                                stepSize: 1,
                                font: { family: getFont() }
                            },
                            grid: {
                                drawBorder: false,
                                color: 'rgba(0, 0, 0, 0.1)', // Visible grid lines
                            },
                            position: currentLang === 'ar' ? 'top' : 'bottom' // Position X-axis based on RTL/LTR
                        },
                        y: { // This is the category axis for horizontal bar chart
                            ticks: {
                                font: { family: getFont() }
                            },
                            grid: { display: false }, // No vertical grid lines
                            reverse: currentLang === 'ar' // Reverse for RTL to keep categories in order
                        }
                    }
                },
                plugins: []
            });

            // Initialize Donut Chart
            donutChart = new Chart(donutCtx, {
                type: 'doughnut',
                data: {
                    labels: donutChartLabelsByLang[currentLang],
                    datasets: []
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
                            titleFont: { family: getFont() }
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
                                const percentage = (value * 100 / total).toFixed(0);
                                return percentage > 0 ? percentage + '%' : ''; // Only show if > 0
                            }
                        }
                    }
                },
                plugins: []
            });

            // Initial language setting and chart updates
            applyLanguage(currentLang);

            // Language toggle functionality
            if (langToggleBtn) {
                langToggleBtn.addEventListener('click', () => {
                    const newLang = currentLang === 'ar' ? 'en' : 'ar';
                    applyLanguage(newLang);
                });
            }

            // Dropdown functionality
            if (departmentSelect) {
                departmentSelect.addEventListener('click', () => {
                    departmentOptions.classList.toggle('open');
                    const icon = departmentSelect.querySelector('.fas');
                    if (departmentOptions.classList.contains('open')) {
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-up');
                    } else {
                        icon.classList.remove('fa-chevron-up');
                        icon.classList.add('fa-chevron-down');
                    }
                });
            }

            if (departmentOptions) {
                departmentOptions.addEventListener('click', (event) => {
                    if (event.target.classList.contains('custom-select-option')) {
                        const selectedValue = event.target.dataset.value;
                        const selectedText = event.target.textContent;
                        document.getElementById('selectedDepartment').textContent = selectedText;
                        document.getElementById('selectedDepartment').dataset.value = selectedValue; // Store selected value
                        departmentOptions.classList.remove('open');
                        departmentSelect.querySelector('.fas').classList.remove('fa-chevron-up');
                        departmentSelect.querySelector('.fas').classList.add('fa-chevron-down');
                        // Here you would typically filter chart data based on selectedValue
                        console.log(`Selected department: ${selectedValue}`);
                    }
                });
            }

            // Close dropdown if clicked outside
            document.addEventListener('click', (event) => {
                if (departmentSelect && !departmentSelect.contains(event.target) && departmentOptions && !departmentOptions.contains(event.target)) {
                    departmentOptions.classList.remove('open');
                    departmentSelect.querySelector('.fas').classList.remove('fa-chevron-up');
                    departmentSelect.querySelector('.fas').classList.add('fa-chevron-down');
                }
            });

            // Function to collect chart data for AI insights (from horizontal bar chart)
            function getChartDataForAI() {
                const data = [];
                const labels = horizontalBarChart.data.labels;
                const executedData = horizontalBarChart.data.datasets.find(ds => ds.label === filterLabels.executed[currentLang])?.data || [];
                const notExecutedData = horizontalBarChart.data.datasets.find(ds => ds.label === filterLabels.notExecuted[currentLang])?.data || [];

                labels.forEach((label, index) => {
                    data.push({
                        nameAr: horizontalChartLabelsByLang.ar[index],
                        nameEn: horizontalChartLabelsByLang.en[index],
                        uncompleted: notExecutedData[index] !== undefined ? notExecutedData[index] : 0,
                        completed: executedData[index] !== undefined ? executedData[index] : 0
                    });
                });
                return data;
            }

            // Function to call Gemini API and generate insights
            async function generateInsights(data) {
                aiInsightsContent.innerHTML = ''; // Clear previous content
                aiLoadingSpinner.classList.remove('hidden'); // Show spinner

                let prompt = "Based on the following data for 'Secret Visitor Notes by Department and Execution Status', provide a concise analysis and key insights. The categories are:\n";
                data.forEach(cat => {
                    prompt += `- ${cat.nameAr} (${cat.nameEn}): غير منفذ (Not Executed) ${cat.uncompleted}, منفذ (Executed) ${cat.completed}\n`;
                });
                prompt += "\nFocus on identifying departments with high 'Not Executed' counts and overall performance. The response should be in Arabic.";

                let chatHistory = [];
                chatHistory.push({ role: "user", parts: [{ text: prompt }] });
                const payload = { contents: chatHistory };
                const apiKey = ""; // If you want to use models other than gemini-2.0-flash or imagen-3.0-generate-002, provide an API key here. Otherwise, leave this as-is.
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                    }

                    const result = await response.json();

                    if (result.candidates && result.candidates.length > 0 &&
                        result.candidates[0].content && result.candidates[0].content.parts &&
                        result.candidates[0].content.parts.length > 0) {
                        const text = result.candidates[0].content.parts[0].text;
                        aiInsightsContent.innerHTML = text.replace(/\n/g, '<br>');
                    } else {
                        aiInsightsContent.textContent = "لم يتمكن الذكاء الاصطناعي من توليد رؤى. هيكل الاستجابة غير متوقع.";
                    }
                } catch (error) {
                    console.error("Error calling Gemini API:", error);
                    aiInsightsContent.textContent = `حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: ${error.message}. يرجى التحقق من اتصالك بالإنترنت أو المحاولة لاحقًا.`;
                } finally {
                    aiLoadingSpinner.classList.add('hidden');
                }
            }

            // Event listener for AI Insights button
            if (aiInsightsBtn) {
                aiInsightsBtn.addEventListener('click', () => {
                    if (aiInsightsModal) {
                        aiInsightsModal.classList.remove('hidden');
                        const chartData = getChartDataForAI();
                        generateInsights(chartData);
                    }
                });
            }

            // Event listener for closing the modal
            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', () => {
                    aiInsightsModal.classList.add('hidden');
                });
            }

            // Optional: Close modal if clicking outside the content
            if (aiInsightsModal) {
                aiInsightsModal.addEventListener('click', (event) => {
                    if (event.target === aiInsightsModal) {
                        aiInsightsModal.classList.add('hidden');
                    }
                });
            }

            // Functionality for Export Report button
            if (exportReportBtn) {
                exportReportBtn.addEventListener('click', () => {
                    window.print();
                });
            }
        });
          const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-link');
    sidebarLinks.forEach(link => {
        link.parentElement.classList.remove('active'); // Remove active from all
        if (link.getAttribute('href') === 'secret-visitor.html') { // Check for the specific page
            link.parentElement.classList.add('active'); // Add active to the correct one
        }
    });
