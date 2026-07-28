document.addEventListener('DOMContentLoaded', function() {
    
    // Sidebar Toggle for Mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            sidebar.classList.toggle('show');
        });
    }

    // Chart.js Initialization for Dashboard
    const chartDataElement = document.getElementById('chartDataJson');
    if (chartDataElement) {
        try {
            const chartData = JSON.parse(chartDataElement.textContent);
            
            // We need to group data by day for the last 30 days
            // This is a simple client-side aggregation for demonstration
            
            const calcData = chartData.calculations || [];
            const userData = chartData.users || [];
            
            // Generate labels (last 30 days)
            const labels = [];
            const calcsByDay = {};
            const usersByDay = {};
            
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                labels.push(dateStr);
                calcsByDay[dateStr] = 0;
                usersByDay[dateStr] = 0;
            }
            
            // Aggregate calculations
            calcData.forEach(c => {
                const dateStr = c.created_at.split('T')[0];
                if (calcsByDay[dateStr] !== undefined) {
                    calcsByDay[dateStr]++;
                }
            });
            
            // Aggregate users
            userData.forEach(u => {
                const dateStr = u.created_at.split('T')[0];
                if (usersByDay[dateStr] !== undefined) {
                    usersByDay[dateStr]++;
                }
            });
            
            const calcsArray = labels.map(l => calcsByDay[l]);
            const usersArray = labels.map(l => usersByDay[l]);
            
            // Calculations Chart
            const ctxCalc = document.getElementById('calculationsChart');
            if (ctxCalc) {
                new Chart(ctxCalc, {
                    type: 'line',
                    data: {
                        labels: labels.map(l => l.substring(5)), // Show MM-DD
                        datasets: [{
                            label: 'Daily Calculations',
                            data: calcsArray,
                            borderColor: '#0d6efd',
                            backgroundColor: 'rgba(13, 110, 253, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                    }
                });
            }
            
            // Users Chart
            const ctxUsers = document.getElementById('usersChart');
            if (ctxUsers) {
                new Chart(ctxUsers, {
                    type: 'bar',
                    data: {
                        labels: labels.map(l => l.substring(5)), // Show MM-DD
                        datasets: [{
                            label: 'New Users',
                            data: usersArray,
                            backgroundColor: '#198754',
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                    }
                });
            }
            
        } catch (e) {
            console.error("Error parsing chart data: ", e);
        }
    }
});
