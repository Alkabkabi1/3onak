document.addEventListener('DOMContentLoaded', () => {
    // Function to create a pie chart
    const createPieChart = (canvasId, data, title = '') => {
        const ctx = document.getElementById(canvasId);
        if (ctx) {
            new Chart(ctx, {
                type: 'doughnut', // Doughnut for pie with a hole
                data: {
                    labels: ['راضي', 'غير راضي'],
                    datasets: [{
                        data: data, // [satisfied, dissatisfied]
                        backgroundColor: [
                            '#4CAF50', // Green for 'راضي'
                            '#F44336'  // Red for 'غير راضي'
                        ],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%', // Controls the size of the hole
                    plugins: {
                        legend: {
                            display: false // We will use custom labels outside
                        },
                        title: {
                            display: false,
                            text: title
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed !== null) {
                                        label += context.parsed + '%';
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
    };

    // Function to create the overall satisfaction chart with center text
    const createOverallSatisfactionChart = (canvasId, percentage) => {
        const ctx = document.getElementById(canvasId);
        if (ctx) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['راضي', 'غير راضي'],
                    datasets: [{
                        data: [percentage, 100 - percentage],
                        backgroundColor: [
                            '#4CAF50', // Green
                            '#e0e0e0'  // Light gray for the remaining part
                        ],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '80%', // Thicker ring
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: false // Hide tooltips for this chart
                        }
                    }
                }
            });
        }
    };

    // Initialize all charts with dummy data
    // In a real application, this data would come from an API or other source.
    createPieChart('homeCareChart', [75, 25]);
    createPieChart('radiologyChart', [60, 40]);
    createPieChart('outpatientChart', [85, 15]);
    createPieChart('dentalChart', [70, 30]);
    createPieChart('emergencyChart', [55, 45]);
    createPieChart('sleepSectionsChart', [90, 10]);
    createPieChart('fatalitiesChart', [80, 20]);
    createPieChart('bloodBankChart', [65, 35]);
    createPieChart('hospitalSatisfactionChart', [84.3, 15.7]); // Use a specific pie for this as per image

    // Overall Satisfaction Chart
    createOverallSatisfactionChart('overallSatisfactionChart', 84.3);

    // Handle language toggle (simple example)
    const languageToggle = document.querySelector('.language-toggle');
    languageToggle.addEventListener('click', () => {
        const currentLang = document.documentElement.lang;
        if (currentLang === 'ar') {
            document.documentElement.lang = 'en';
            document.documentElement.dir = 'ltr';
            languageToggle.textContent = 'عربي | English';
            // You might want to reload content or change text dynamically here
        } else {
            document.documentElement.lang = 'ar';
            document.documentElement.dir = 'rtl';
            languageToggle.textContent = 'English | عربي';
        }
        // For a full multi-language app, you'd integrate a translation library or system here.
    });

    // Handle dropdown changes (example - doesn't affect charts with static data yet)
    const yearSelect = document.getElementById('year-select');
    const quarterSelect = document.getElementById('quarter-select');

    yearSelect.addEventListener('change', (event) => {
        console.log('Year selected:', event.target.value);
        // In a real app, trigger data fetch and chart updates here
    });

    quarterSelect.addEventListener('change', (event) => {
        console.log('Quarter selected:', event.target.value);
        // In a real app, trigger data fetch and chart updates here
    });

    // Handle export button click
    const exportButton = document.querySelector('.export-button');
    exportButton.addEventListener('click', () => {
        alert('تقرير يتم تصديره... (هذه وظيفة وهمية)');
        // Implement actual export logic here (e.g., generating PDF, Excel, etc.)
    });

    // Professional JS features:
    // 1. Dynamic data loading: Use fetch API to get data from backend
    /*
    async function fetchDataAndRenderCharts() {
        try {
            const response = await fetch('/api/dashboard-data'); // Replace with your actual API endpoint
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Example: Update a specific chart with fetched data
            // updateChart('homeCareChart', [data.homeCare.satisfied, data.homeCare.dissatisfied]);
            // updateOverallSatisfactionChart('overallSatisfactionChart', data.overallSatisfaction);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Display an error message to the user
        }
    }
    // Call on load
    // fetchDataAndRenderCharts();
    */

    // 2. Error Handling: Add more robust error handling for API calls and chart rendering.
    // 3. Modularity: For a large application, consider breaking down this JS into smaller modules.
    //    e.g., `chart-utils.js`, `api-service.js`, `ui-interactions.js`.
    // 4. State Management: For complex interactions, consider a simple state management pattern.
});