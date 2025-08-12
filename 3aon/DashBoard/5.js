document.addEventListener('DOMContentLoaded', () => {

    // Language Toggle (from previous example)
    const languageToggle = document.querySelector('.language-toggle');
    languageToggle.addEventListener('click', () => {
        const currentLang = document.documentElement.lang;
        if (currentLang === 'ar') {
            document.documentElement.lang = 'en';
            document.documentElement.dir = 'ltr';
            languageToggle.textContent = 'عربي | English';
            // In a full multi-language app, you'd update all text dynamically here
        } else {
            document.documentElement.lang = 'ar';
            document.documentElement.dir = 'rtl';
            languageToggle.textContent = 'English | عربي';
        }
    });

    // Bar Chart Data (Estimated from the image)
    const labels = [
        'الصحة الفمية', 'إدارة الأداء', 'المديرية الطبية', 'المختبرات الطبية',
        'مكتب الدخول', 'الأورام', 'إحصاء النوم', 'إدارة المواعيد',
        'إدارة الشؤون', 'أطباء القلب'
    ].reverse(); // Reverse to match RTL display on chart

    // These values are estimated from the height of the bars in the image.
    // Each dataset corresponds to a legend item.
    // A value of 0 means that category of communication is not present for that department.
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'موعد',
                data: [0.8, 0, 0.8, 0, 0, 2, 0, 0, 0, 0.8], // Values for each label (الصحة الفمية -> أطباء القلب)
                backgroundColor: '#FF0000', // Red
                borderColor: '#FF0000',
                borderWidth: 1,
                borderRadius: 5 // Rounded bars for a modern look
            },
            {
                label: 'ملاحظة طلب',
                data: [0, 0, 0.8, 2.8, 0, 0, 0, 3, 0, 3],
                backgroundColor: '#87CEEB', // SkyBlue
                borderColor: '#87CEEB',
                borderWidth: 1,
                borderRadius: 5
            },
            {
                label: 'لم يتم الرد',
                data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Not visually distinct in image, so mostly zeros
                backgroundColor: '#800080', // Purple
                borderColor: '#800080',
                borderWidth: 1,
                borderRadius: 5
            },
            {
                label: 'تشرح الحالة',
                data: [0, 0, 0, 0, 0, 0, 4.8, 0, 3.8, 0],
                backgroundColor: '#4CAF50', // Green
                borderColor: '#4CAF50',
                borderWidth: 1,
                borderRadius: 5
            },
            {
                label: 'دواء',
                data: [0, 0, 0, 0, 3.8, 0, 0, 0, 0, 0],
                backgroundColor: '#FFA500', // Orange
                borderColor: '#FFA500',
                borderWidth: 1,
                borderRadius: 5
            },
            {
                label: 'سوء تعامل',
                data: [0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
                backgroundColor: '#FFD700', // Gold (closer to image's yellow)
                borderColor: '#FFD700',
                borderWidth: 1,
                borderRadius: 5
            }
            // 'تقرير طبيب' and 'زيارة مرضية' are in legend but not clearly in chart bars
        ]
    };

    // Chart Configuration
    const ctx = document.getElementById('dailyCommunicationChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'x', // 'x' for vertical bars, 'y' for horizontal bars
                plugins: {
                    legend: {
                        display: false // Hide Chart.js default legend as we have a custom HTML one
                    },
                    title: {
                        display: false, // Title is handled by HTML
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y; // Display the exact value
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        // Position labels from right to left for RTL layout
                        // This usually needs to be handled by the order of labels in the data array
                        grid: {
                            display: false // No vertical grid lines
                        },
                        ticks: {
                            color: '#666',
                            font: {
                                size: 12
                            },
                            // Rotate labels if they overlap
                            maxRotation: 45,
                            minRotation: 45,
                            autoSkip: false // Don't skip labels
                        },
                        // Ensure the bars have enough space and alignment is correct
                        barPercentage: 0.8,
                        categoryPercentage: 0.8 // Adjust space between groups of bars
                    },
                    y: {
                        beginAtZero: true,
                        max: 8, // Max value on Y-axis
                        ticks: {
                            stepSize: 2, // Steps of 2 as per image
                            color: '#666',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: '#e0e0e0', // Light grey horizontal grid lines
                            drawBorder: false // Do not draw the axis line itself
                        }
                    }
                }
            }
        });
    }

    // Handle export button click (from previous example)
    const exportButton = document.querySelector('.export-button');
    exportButton.addEventListener('click', () => {
        alert('تقرير يتم تصديره... (هذه وظيفة وهمية)');
        // Implement actual export logic here (e.g., generating PDF, Excel, etc.)
        // For a client-side solution, you might use libraries like html2canvas + jspdf for PDF or SheetJS for Excel.
    });

    // Professional JS features:
    // - Dynamic data loading: Use fetch API to get data from backend
    //   Example:
    /*
    async function fetchDataAndRenderChart() {
        try {
            const response = await fetch('/api/daily-communication-data'); // Replace with your actual API endpoint
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const apiData = await response.json();
            
            // Assuming apiData has structure like:
            // {
            //   labels: ['الصحة الفمية', ...],
            //   datasets: [ { label: 'موعد', data: [...] }, ... ]
            // }
            // Update chartData with fetched data and re-render the chart
            
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Display an error message to the user
        }
    }
    // fetchDataAndRenderChart(); // Call this to load data dynamically
    */
});