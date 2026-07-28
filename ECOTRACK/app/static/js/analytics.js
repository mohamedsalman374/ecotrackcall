document.addEventListener('DOMContentLoaded', function() {
    // Lock body scroll — only content panel should scroll (for dashboard layout)
    document.body.classList.add('dashboard-page');

    const dataElement = document.getElementById('analyticsData');
    if (!dataElement) return;

    const chartData = JSON.parse(dataElement.textContent);
    
    // Common colors
    const colors = {
        primary: '#0d6efd',
        success: '#198754',
        info: '#0dcaf0',
        warning: '#ffc107',
        danger: '#dc3545',
        secondary: '#6c757d',
        dark: '#212529'
    };
    
    const categoryColors = [colors.success, colors.warning, colors.info, colors.danger, '#fd7e14', colors.secondary, colors.primary];

    // 1. Trend Line Chart
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: chartData.line.labels,
                datasets: [{
                    label: 'Total Emissions (kg CO2e)',
                    data: chartData.line.data,
                    borderColor: colors.primary,
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: colors.primary,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [2, 4] } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 2. Category Doughnut Chart
    const doughnutCtx = document.getElementById('categoryDoughnutChart');
    if (doughnutCtx) {
        new Chart(doughnutCtx, {
            type: 'doughnut',
            data: {
                labels: chartData.pie.labels,
                datasets: [{
                    data: chartData.pie.data,
                    backgroundColor: categoryColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { boxWidth: 12, usePointStyle: true, font: { size: 11 } }
                    }
                }
            }
        });
    }

    // 3. Monthly Bar Chart
    const barCtx = document.getElementById('monthlyBarChart');
    if (barCtx) {
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: chartData.bar.labels,
                datasets: [{
                    label: 'Emissions',
                    data: chartData.bar.data,
                    backgroundColor: colors.info,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [2, 4] } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 4. Lifestyle Radar Chart
    const radarCtx = document.getElementById('lifestyleRadarChart');
    if (radarCtx) {
        new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: chartData.radar.labels,
                datasets: [{
                    label: 'Impact Distribution',
                    data: chartData.radar.data,
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    borderColor: colors.danger,
                    pointBackgroundColor: colors.danger,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: colors.danger,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    r: {
                        angleLines: { display: true },
                        suggestedMin: 0
                    }
                }
            }
        });
    }
});
