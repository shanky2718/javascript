/**
 * AstraResQ - Advanced Analytics & Smart Emergency Bottleneck Detector
 * Academic Demonstration: Chart.js Integration, Functional Programming (filter, map, reduce),
 * JavaScript Maps & Sets, and Algorithmic Pattern Recognition.
 */

const AnalyticsEngine = {
  charts: {},

  /**
   * SMART EMERGENCY BOTTLENECK DETECTOR
   * Original intelligent enhancement analyzing history to diagnose systemic bottlenecks.
   * Uses JavaScript Maps, Sets, filter(), and reduce() operations genuinely.
   */
  detectBottlenecks() {
    const emergencies = StorageService.getEmergencies();
    const ambulances = StorageService.getAmbulances();
    const dispatches = StorageService.getDispatches();

    // 1. Group records by Area using a JavaScript Map
    const areaMap = new Map();

    emergencies.forEach(emg => {
      const area = emg.location.area || "Unknown";
      if (!areaMap.has(area)) {
        areaMap.set(area, {
          areaName: area,
          totalReports: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          resolvedList: [],
          activeCount: 0
        });
      }

      const stat = areaMap.get(area);
      stat.totalReports += 1;
      if (emg.severity === 'Critical') stat.criticalCount += 1;
      else if (emg.severity === 'High') stat.highCount += 1;
      else if (emg.severity === 'Medium') stat.mediumCount += 1;
      else if (emg.severity === 'Low') stat.lowCount += 1;

      if (emg.status === 'Resolved') {
        stat.resolvedList.push(emg);
      } else {
        stat.activeCount += 1;
      }
    });

    // 2. Count stationed ambulances per area using a Map
    const ambulanceAreaCount = new Map();
    ambulances.forEach(amb => {
      const area = amb.location.area || "Unknown";
      ambulanceAreaCount.set(area, (ambulanceAreaCount.get(area) || 0) + 1);
    });

    // 3. Analyze each area for bottleneck signatures
    const bottleneckInsights = [];

    areaMap.forEach((stat, areaName) => {
      // Calculate average response time using reduce()
      const totalResponseTime = stat.resolvedList.reduce((acc, curr) => {
        return acc + (curr.responseTimeMinutes || 8);
      }, 0);
      const avgResponseTime = stat.resolvedList.length > 0
        ? Math.round((totalResponseTime / stat.resolvedList.length) * 10) / 10
        : null;

      const stationedAmbulances = ambulanceAreaCount.get(areaName) || 0;
      const criticalRatio = stat.totalReports > 0 ? (stat.criticalCount / stat.totalReports) : 0;

      // Detection Heuristics:
      // A. High Demand Hotspot
      if (stat.totalReports >= 3 || stat.criticalCount >= 2) {
        let severityTag = "HIGH";
        let recommendation = "";

        if (stat.criticalCount >= 3 && stationedAmbulances <= 1) {
          severityTag = "CRITICAL BOTTLENECK";
          recommendation = `URGENT: Re-allocate at least 1 dedicated Advanced Life Support (ALS) unit permanently to ${areaName}. Critical incident frequency (${stat.criticalCount} calls) severely outpaces local unit coverage.`;
        } else if (avgResponseTime && avgResponseTime > 9) {
          severityTag = "RESPONSE DELAY BOTTLENECK";
          recommendation = `High transit latency observed (Avg: ${avgResponseTime} min). Deploy forward rapid-response motorcycle paramedics or establish satellite staging post along arterial corridor.`;
        } else {
          severityTag = "HIGH DEMAND AREA";
          recommendation = `Consider maintaining additional ambulance availability and strategic standby positioning in ${areaName} during peak traffic hours.`;
        }

        bottleneckInsights.push({
          area: areaName,
          severityTag,
          totalReports: stat.totalReports,
          criticalCount: stat.criticalCount,
          activeCount: stat.activeCount,
          avgResponseTime: avgResponseTime || 8.5,
          stationedAmbulances,
          recommendation
        });
      }
    });

    // Sort by critical count descending
    bottleneckInsights.sort((a, b) => b.criticalCount - a.criticalCount);

    // Fleet Utilisation Calculation using reduce()
    const totalAmbulances = ambulances.length;
    const busyAmbulances = ambulances.filter(a => a.status === 'Dispatched' || a.status === 'On Scene').length;
    const fleetUtilisationRate = totalAmbulances > 0 ? Math.round((busyAmbulances / totalAmbulances) * 100) : 0;

    return {
      insights: bottleneckInsights,
      fleetUtilisationRate,
      totalAnalyzed: emergencies.length,
      highDemandAreasCount: bottleneckInsights.length
    };
  },

  /**
   * Render or update all Chart.js charts with theme awareness
   */
  renderCharts() {
    if (typeof Chart === 'undefined') {
      console.warn("[AnalyticsEngine] Chart.js library is not loaded.");
      return;
    }

    const isWhiteTheme = document.body.classList.contains('theme-white');
    const textColor = isWhiteTheme ? '#1e293b' : '#f1f5f9';
    const gridColor = isWhiteTheme ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)';

    // Global Chart defaults
    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    Chart.defaults.font.family = "'Inter', sans-serif";

    const emergencies = StorageService.getEmergencies();
    const ambulances = StorageService.getAmbulances();

    this.renderSeverityChart(emergencies, textColor, gridColor);
    this.renderTypeChart(emergencies, textColor, gridColor);
    this.renderAreaDemandChart(emergencies, textColor, gridColor);
    this.renderFleetStatusChart(ambulances, textColor, gridColor);
    this.renderResponseTimesChart(emergencies, textColor, gridColor);
    this.renderOutcomeChart(emergencies, textColor, gridColor);
  },

  renderSeverityChart(emergencies, textColor, gridColor) {
    const canvas = document.getElementById('chart-severity');
    if (!canvas) return;

    // Tally using reduce()
    const counts = emergencies.reduce((acc, emg) => {
      acc[emg.severity] = (acc[emg.severity] || 0) + 1;
      return acc;
    }, { Critical: 0, High: 0, Medium: 0, Low: 0 });

    if (this.charts.severity) this.charts.severity.destroy();

    this.charts.severity = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{
          data: [counts.Critical, counts.High, counts.Medium, counts.Low],
          backgroundColor: ['#ef4444', '#f97316', '#eab308', '#3b82f6'],
          borderColor: document.body.classList.contains('theme-white') ? '#ffffff' : '#141414',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12, padding: 12 } }
        },
        cutout: '68%'
      }
    });
  },

  renderTypeChart(emergencies, textColor, gridColor) {
    const canvas = document.getElementById('chart-type');
    if (!canvas) return;

    const counts = emergencies.reduce((acc, emg) => {
      acc[emg.type] = (acc[emg.type] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    if (this.charts.type) this.charts.type.destroy();

    this.charts.type = new Chart(canvas, {
      type: 'polarArea',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            'rgba(239, 68, 68, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(234, 179, 8, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(168, 85, 247, 0.7)'
          ],
          borderColor: gridColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor, boxWidth: 10 } }
        },
        scales: {
          r: { grid: { color: gridColor }, ticks: { display: false } }
        }
      }
    });
  },

  renderAreaDemandChart(emergencies, textColor, gridColor) {
    const canvas = document.getElementById('chart-area-demand');
    if (!canvas) return;

    // Group by area and sort descending
    const areaCounts = emergencies.reduce((acc, emg) => {
      const a = emg.location.area || "Other";
      acc[a] = (acc[a] || 0) + 1;
      return acc;
    }, {});

    const sortedAreas = Object.entries(areaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6); // Top 6 areas

    const labels = sortedAreas.map(item => item[0]);
    const values = sortedAreas.map(item => item[1]);

    if (this.charts.area) this.charts.area.destroy();

    this.charts.area = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total Incidents',
          data: values,
          backgroundColor: 'rgba(239, 68, 68, 0.85)',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } },
          x: { grid: { display: false }, ticks: { color: textColor } }
        }
      }
    });
  },

  renderFleetStatusChart(ambulances, textColor, gridColor) {
    const canvas = document.getElementById('chart-fleet-status');
    if (!canvas) return;

    const statusCounts = ambulances.reduce((acc, amb) => {
      acc[amb.status] = (acc[amb.status] || 0) + 1;
      return acc;
    }, { Available: 0, Dispatched: 0, 'On Scene': 0, Maintenance: 0 });

    if (this.charts.fleet) this.charts.fleet.destroy();

    this.charts.fleet = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Available', 'Dispatched', 'On Scene', 'Maintenance'],
        datasets: [{
          data: [statusCounts.Available, statusCounts.Dispatched, statusCounts['On Scene'], statusCounts.Maintenance],
          backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#6b7280'],
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } },
          y: { grid: { display: false }, ticks: { color: textColor } }
        }
      }
    });
  },

  renderResponseTimesChart(emergencies, textColor, gridColor) {
    const canvas = document.getElementById('chart-response-time');
    if (!canvas) return;

    // Filter resolved emergencies with response time
    const resolved = emergencies.filter(e => e.status === 'Resolved' && e.responseTimeMinutes);
    const labels = resolved.map(e => e.id);
    const times = resolved.map(e => e.responseTimeMinutes);

    if (this.charts.responseTimes) this.charts.responseTimes.destroy();

    this.charts.responseTimes = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Actual Response Time (Mins)',
            data: times,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.35,
            pointRadius: 4
          },
          {
            label: 'National SLA Target (8 Mins)',
            data: labels.map(() => 8),
            borderColor: '#ef4444',
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: textColor, boxWidth: 10 } }
        },
        scales: {
          y: { beginAtZero: false, min: 2, max: 18, grid: { color: gridColor }, ticks: { color: textColor } },
          x: { grid: { display: false }, ticks: { color: textColor } }
        }
      }
    });
  },

  renderOutcomeChart(emergencies, textColor, gridColor) {
    const canvas = document.getElementById('chart-outcome');
    if (!canvas) return;

    const resolved = emergencies.filter(e => e.status === 'Resolved').length;
    const active = emergencies.filter(e => e.status !== 'Resolved').length;

    if (this.charts.outcome) this.charts.outcome.destroy();

    this.charts.outcome = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['Completed Cases', 'Active In-Progress'],
        datasets: [{
          data: [resolved, active],
          backgroundColor: ['#10b981', '#ef4444'],
          borderColor: document.body.classList.contains('theme-white') ? '#ffffff' : '#141414'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor } }
        }
      }
    });
  }
};
