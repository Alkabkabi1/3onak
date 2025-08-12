document.addEventListener('DOMContentLoaded', () => {
    // Language Toggle Functionality
    const langToggleBtn = document.getElementById('langToggle');
    const langText = document.getElementById('langText');
    let currentLang = 'ar'; // Default language

    // Function to update content based on current language
    function updateContentLanguage() {
        const elements = document.querySelectorAll('[data-ar], [data-en]');
        elements.forEach(element => {
            if (element.dataset[currentLang]) {
                element.textContent = element.dataset[currentLang];
            }
        });

        // Update HTML lang and dir attributes
        if (currentLang === 'ar') {
            document.documentElement.setAttribute('lang', 'ar');
            document.documentElement.setAttribute('dir', 'rtl');
            langText.textContent = 'العربية | English';
        } else {
            document.documentElement.setAttribute('lang', 'en');
            document.documentElement.setAttribute('dir', 'ltr');
            langText.textContent = 'English | العربية';
        }

        // Update Chart.js labels if the chart exists
        if (myChart) {
            updateChartLabels();
        }
    }

    // Event listener for language toggle button
    langToggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'ar' ? 'en' : 'ar';
        updateContentLanguage();
    });

    // Chart.js Configuration
    const ctx = document.getElementById('complaintsChart').getContext('2d');
    let myChart; // Declare myChart globally

    // Function to create or update the chart
    function createChart(labels, data) {
        if (myChart) {
            myChart.destroy(); // Destroy existing chart before creating a new one
        }
        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: '#007bff', // Blue color for bars
                    borderRadius: 5, // Rounded corners for bars
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Hide legend
                    },
                    tooltip: {
                        rtl: true, // Enable RTL for tooltips
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return currentLang === 'ar' ? `العدد: ${context.raw}` : `Count: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 6, // Y-axis steps
                            callback: function(value) {
                                return value; // Display Y-axis labels as numbers
                            }
                        },
                        grid: {
                            drawBorder: false, // Hide Y-axis border
                            color: 'rgba(0, 0, 0, 0.05)' // Light grid lines
                        }
                    },
                    x: {
                        grid: {
                            display: false // Hide X-axis grid lines
                        },
                        ticks: {
                            maxRotation: 0,
                            minRotation: 0,
                            autoSkip: false,
                            callback: function(value, index, values) {
                                const arabicLabels = ["تأخير في الدخول للعيادة", "تعامل غير لائق من الموظف", "نقص علاج / ادوية", "نظافة غرف المرضى", "سوء التنسيق في المواعيد"];
                                const englishLabels = ["Delay in clinic entry", "Improper staff behavior", "Lack of medication/drugs", "Cleanliness of patient rooms", "Poor appointment coordination"];
                                return currentLang === 'ar' ? arabicLabels[index] : englishLabels[index];
                            }
                        }
                    }
                }
            }
        });
    }

    // Function to update chart labels when language changes
    function updateChartLabels() {
        const arabicLabels = ["تأخير في الدخول للعيادة", "تعامل غير لائق من الموظف", "نقص علاج / ادوية", "نظافة غرف المرضى", "سوء التنسيق في المواعيد"];
        const englishLabels = ["Delay in clinic entry", "Improper staff behavior", "Lack of medication/drugs", "Cleanliness of patient rooms", "Poor appointment coordination"];
        myChart.data.labels = currentLang === 'ar' ? arabicLabels : englishLabels;
        myChart.update();
    }

    // Initial chart creation with Arabic labels and example data
    const initialArabicLabels = ["تأخير في الدخول للعيادة", "تعامل غير لائق من الموظف", "نقص علاج / ادوية", "نظافة غرف المرضى", "سوء التنسيق في المواعيد"];
    const initialData = [24, 20, 18, 15, 10]; // Example data, replace with your actual data
    createChart(initialArabicLabels, initialData);

    // Flatpickr for "Customize Date"
    const customizeDateButton = document.querySelector('.filter-btn[data-ar="تخصيص تاريخ"]');
    if (customizeDateButton) {
        customizeDateButton.addEventListener('click', () => {
            flatpickr(customizeDateButton, {
                mode: "range",
                dateFormat: "Y-m-d",
                locale: currentLang === 'ar' ? "ar" : "en", // Set locale based on current language
                onClose: function(selectedDates, dateStr, instance) {
                    // Handle date range selection here
                    console.log("Selected Date Range:", selectedDates);
                    // You might want to trigger data fetching/chart update based on this range
                }
            }).open();
        });
    }

    // Initial language update on page load
    updateContentLanguage();
});