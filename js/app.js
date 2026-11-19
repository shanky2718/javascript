/**
 * AstraResQ - Main Application Controller & DOM Orchestrator
 * Academic Demonstration: Event Delegation, View State Management,
 * Form Validation, Asynchronous Workflow Triggers, and Dynamic UI Updates.
 */

// Global reference for active emergency selected in the Dispatch Center
let selectedDispatchEmergencyId = null;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Storage & Structures
  StorageService.initStorage();
  const initialAmbs = StorageService.getAmbulances();
  const initialEmgs = StorageService.getEmergencies();
  AstraDataStructures.syncStructures(initialAmbs, initialEmgs);

  // 2. Initialize UI Engine
  AnimationEngine.initIntroSplash();
  AnimationEngine.initRipples();
  initTheme();
  initSoundToggle();
  initClock();
  initNavigation();
  initNotificationDrawer();
  initEmergencyModalAndForm();
  initAmbulanceModalAndForm();
  initDispatchCenterControls();
  initQuickTestScenarios();

  // 3. Render Initial View
  renderDashboard();

  // 4. Global Map Entity Selection Handler (from Canvas clicks)
  window.onMapEntitySelected = (type, entity) => {
    if (type === 'emergency') {
      navigateToSection('dispatch');
      selectEmergencyForDispatch(entity.id);
    } else if (type === 'ambulance') {
      navigateToSection('ambulances');
      highlightAmbulanceRow(entity.id);
    }
  };

  // 5. Global UI Refresh Dispatcher
  window.refreshAllUIViews = () => {
    updateDashboardStats();
    renderEmergencyTables();
    renderAmbulanceTables();
    renderDispatchQueue();
    if (document.getElementById('view-analytics').classList.contains('active-view')) {
      renderBottleneckInsights();
      AnalyticsEngine.renderCharts();
    }
    updateNotificationBadge();
  };
});

/**
 * -----------------------------------------------------------------------------
 * Theme Management (Black & White Modes)
 * -----------------------------------------------------------------------------
 */
function initTheme() {
  const savedTheme = StorageService.getTheme();
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');

  if (savedTheme === 'white') {
    document.body.classList.add('theme-white');
    if (themeIcon) {
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
    }
  } else {
    document.body.classList.remove('theme-white');
    if (themeIcon) {
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      AnimationEngine.playClick();
      const isWhite = document.body.classList.toggle('theme-white');
      const newTheme = isWhite ? 'white' : 'black';
      StorageService.saveTheme(newTheme);

      if (themeIcon) {
        if (isWhite) {
          themeIcon.classList.remove('fa-sun');
          themeIcon.classList.add('fa-moon');
        } else {
          themeIcon.classList.remove('fa-moon');
          themeIcon.classList.add('fa-sun');
        }
      }

      // Re-render Chart.js charts to adjust grid and label colors dynamically
      AnalyticsEngine.renderCharts();
      AnimationEngine.showToast("THEME UPDATED", `Switched to ${isWhite ? 'White' : 'Black'} Command Mode.`, "info", 2000);
    });
  }
}

/**
 * Sound Mute / Unmute Toggle
 */
function initSoundToggle() {
  const soundBtn = document.getElementById('sound-toggle-btn');
  const soundIcon = document.getElementById('sound-icon');
  if (!soundBtn || !soundIcon) return;

  const updateSoundIcon = (enabled) => {
    if (enabled) {
      soundIcon.className = "fa-solid fa-volume-high text-success";
      soundBtn.title = "Audio Alerts Active (Click to Mute)";
    } else {
      soundIcon.className = "fa-solid fa-volume-xmark text-muted";
      soundBtn.title = "Audio Alerts Muted (Click to Unmute)";
    }
  };

  updateSoundIcon(StorageService.getSoundEnabled());

  soundBtn.addEventListener('click', () => {
    const current = StorageService.getSoundEnabled();
    const nextState = !current;
    StorageService.saveSoundEnabled(nextState);
    updateSoundIcon(nextState);

    if (nextState) {
      AnimationEngine.playTone(700, 'sine', 0.15, 0.08);
      AnimationEngine.showToast("AUDIO ALERTS ENABLED", "Emergency sound alerts are now active.", "info", 2500);
    } else {
      AnimationEngine.showToast("AUDIO ALERTS MUTED", "Application audio muted.", "info", 2000);
    }
  });
}

/**
 * Live Digital Clock
 */
function initClock() {
  const clockEl = document.getElementById('live-clock');
  const dateEl = document.getElementById('live-date');
  if (!clockEl || !dateEl) return;

  const tick = () => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    dateEl.textContent = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };
  tick();
  setInterval(tick, 1000);
}

/**
 * SPA Navigation Router
 */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-item[data-view]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-view');
      navigateToSection(targetView);
    });
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-open');
    });
  }
}

function navigateToSection(viewName) {
  AnimationEngine.playClick();

  // Close mobile sidebar if open
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('sidebar-open');

  // Update active nav link
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Toggle active view panel
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.remove('active-view');
  });

  const activePanel = document.getElementById(`view-${viewName}`);
  if (activePanel) {
    activePanel.classList.add('active-view');
  }

  // View specific setups
  if (viewName === 'dashboard') {
    renderDashboard();
  } else if (viewName === 'dispatch') {
    renderDispatchCenterView();
  } else if (viewName === 'emergencies') {
    renderEmergencyTables();
  } else if (viewName === 'ambulances') {
    renderAmbulanceTables();
  } else if (viewName === 'analytics') {
    renderBottleneckInsights();
    setTimeout(() => AnalyticsEngine.renderCharts(), 50);
  }
}

/**
 * -----------------------------------------------------------------------------
 * DASHBOARD VIEW CONTROLLER
 * -----------------------------------------------------------------------------
 */
function renderDashboard() {
  updateDashboardStats();
  renderDashboardEmergencies();
  renderDashboardFleetGrid();
  renderRecentActivityFeed();
}

function updateDashboardStats() {
  const ambulances = StorageService.getAmbulances();
  const emergencies = StorageService.getEmergencies();
  const dispatches = StorageService.getDispatches();

  // 1. Total Ambulances
  const totalAmb = ambulances.length;
  // 2. Available Ambulances
  const availAmb = ambulances.filter(a => a.status === 'Available').length;
  // 3. Active Emergencies
  const activeEmg = emergencies.filter(e => e.status !== 'Resolved').length;
  // 4. Critical Emergencies
  const criticalEmg = emergencies.filter(e => e.status !== 'Resolved' && e.severity === 'Critical').length;
  // 5. Completed Dispatches
  const completedDsp = emergencies.filter(e => e.status === 'Resolved').length;

  // 6. Average Response Time (reduce operation)
  const resolvedWithTimes = emergencies.filter(e => e.status === 'Resolved' && e.responseTimeMinutes);
  const avgResponseTime = resolvedWithTimes.length > 0
    ? Math.round(resolvedWithTimes.reduce((acc, c) => acc + c.responseTimeMinutes, 0) / resolvedWithTimes.length)
    : 8;

  AnimationEngine.animateCounter(document.getElementById('stat-total-amb'), 0, totalAmb, 600);
  AnimationEngine.animateCounter(document.getElementById('stat-avail-amb'), 0, availAmb, 600);
  AnimationEngine.animateCounter(document.getElementById('stat-active-emg'), 0, activeEmg, 600);
  AnimationEngine.animateCounter(document.getElementById('stat-critical-emg'), 0, criticalEmg, 600);
  AnimationEngine.animateCounter(document.getElementById('stat-completed-dsp'), 0, completedDsp, 600);
  AnimationEngine.animateCounter(document.getElementById('stat-avg-time'), 0, avgResponseTime, 600, 'm');
}

function renderDashboardEmergencies() {
  const container = document.getElementById('dash-active-emergencies-list');
  if (!container) return;

  const emergencies = StorageService.getEmergencies();
  // Filter active, sort Critical first
  const severityRank = { Critical: 1, High: 2, Medium: 3, Low: 4 };
  const activeEmergencies = emergencies
    .filter(e => e.status !== 'Resolved')
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  if (activeEmergencies.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-shield-heart fa-2x text-success"></i>
        <p>No active emergency incidents currently pending. All sectors quiet.</p>
      </div>`;
    return;
  }

  container.innerHTML = activeEmergencies.slice(0, 5).map(emg => `
    <div class="emergency-item-card severity-border-${emg.severity.toLowerCase()}">
      <div class="emergency-item-header">
        <span class="badge-emg-id">${emg.id}</span>
        <span class="badge-severity badge-severity-${emg.severity.toLowerCase()}">
          <i class="fa-solid fa-circle fa-beat-fade"></i> ${emg.severity}
        </span>
      </div>
      <div class="emergency-item-body">
        <h4 class="emergency-patient">${emg.patientName} <span class="emergency-type">(${emg.type})</span></h4>
        <p class="emergency-location"><i class="fa-solid fa-location-dot"></i> ${emg.location.area} - ${emg.location.landmark || ''}</p>
        <p class="emergency-desc text-muted">${emg.description}</p>
      </div>
      <div class="emergency-item-footer">
        <span class="status-indicator status-${emg.status.toLowerCase().replace(' ', '-')}">${emg.status}</span>
        ${emg.status === 'Pending' ? `
          <button class="btn btn-sm btn-primary btn-dispatch-action" data-id="${emg.id}">
            <i class="fa-solid fa-paper-plane"></i> Dispatch
          </button>` : `
          <button class="btn btn-sm btn-secondary btn-view-action" data-id="${emg.id}">
            <i class="fa-solid fa-eye"></i> Track
          </button>`
        }
      </div>
    </div>
  `).join('');

  // Event handlers
  container.querySelectorAll('.btn-dispatch-action, .btn-view-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const emgId = btn.getAttribute('data-id');
      navigateToSection('dispatch');
      selectEmergencyForDispatch(emgId);
    });
  });
}

function renderDashboardFleetGrid() {
  const container = document.getElementById('dash-fleet-grid');
  if (!container) return;

  const ambulances = StorageService.getAmbulances();
  container.innerHTML = ambulances.map(amb => `
    <div class="fleet-mini-card status-box-${amb.status.toLowerCase().replace(' ', '-')}">
      <div class="fleet-card-top">
        <span class="fleet-id font-mono">${amb.id}</span>
        <span class="status-badge-sm status-bg-${amb.status.toLowerCase().replace(' ', '-')}">${amb.status}</span>
      </div>
      <div class="fleet-type text-muted">${amb.type}</div>
      <div class="fleet-location"><i class="fa-solid fa-location-arrow"></i> ${amb.location.area}</div>
      <div class="fleet-driver"><i class="fa-solid fa-user-nurse"></i> ${amb.driverName}</div>
    </div>
  `).join('');
}

function renderRecentActivityFeed() {
  const container = document.getElementById('dash-activity-feed');
  if (!container) return;

  const dispatches = StorageService.getDispatches();
  if (dispatches.length === 0) {
    container.innerHTML = `<p class="text-muted text-center py-3">No dispatches logged yet.</p>`;
    return;
  }

  container.innerHTML = dispatches.slice(0, 6).map(dsp => `
    <div class="activity-feed-item">
      <div class="activity-icon ${dsp.status === 'Completed' ? 'icon-success' : 'icon-active'}">
        <i class="fa-solid ${dsp.status === 'Completed' ? 'fa-check' : 'fa-truck-medical'}"></i>
      </div>
      <div class="activity-content">
        <div class="activity-title font-mono">${dsp.dispatchId} &rarr; ${dsp.ambulanceId}</div>
        <div class="activity-sub text-muted">${dsp.notes}</div>
        <div class="activity-meta">${dsp.distanceKm} km | ~${dsp.estimatedMinutes}m ETA | ${new Date(dsp.dispatchedAt).toLocaleTimeString()}</div>
      </div>
    </div>
  `).join('');
}

/**
 * -----------------------------------------------------------------------------
 * DISPATCH CENTER CONTROLLER (3-Panel Operations Command)
 * -----------------------------------------------------------------------------
 */
function renderDispatchCenterView() {
  if (!astraMapInstance) {
    astraMapInstance = new BangaloreSimulationMap('bangalore-canvas-map');
  } else {
    astraMapInstance.initCanvas();
  }

  renderDispatchQueue();

  // If no emergency selected, pick the first pending critical or high emergency
  if (!selectedDispatchEmergencyId) {
    const emergencies = StorageService.getEmergencies();
    const pending = emergencies.filter(e => e.status === 'Pending');
    if (pending.length > 0) {
      selectEmergencyForDispatch(pending[0].id);
    }
  } else {
    selectEmergencyForDispatch(selectedDispatchEmergencyId);
  }
}

function renderDispatchQueue() {
  const container = document.getElementById('dispatch-emergency-queue');
  if (!container) return;

  const emergencies = StorageService.getEmergencies();
  const severityRank = { Critical: 1, High: 2, Medium: 3, Low: 4 };

  // Filter non-resolved, sort Critical top
  const queue = emergencies
    .filter(e => e.status !== 'Resolved')
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  if (queue.length === 0) {
    container.innerHTML = `
      <div class="p-3 text-center text-muted">
        <i class="fa-solid fa-clipboard-check fa-2x mb-2 text-success"></i>
        <p>No active dispatches pending.</p>
      </div>`;
    return;
  }

  container.innerHTML = queue.map(emg => `
    <div class="queue-item-card ${emg.id === selectedDispatchEmergencyId ? 'selected-queue-card' : ''}" data-id="${emg.id}">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <span class="font-mono fw-bold">${emg.id}</span>
        <span class="badge-severity badge-severity-${emg.severity.toLowerCase()}">${emg.severity}</span>
      </div>
      <div class="queue-item-patient">${emg.patientName} (${emg.type})</div>
      <div class="queue-item-area text-muted small"><i class="fa-solid fa-location-dot"></i> ${emg.location.area}</div>
      <div class="mt-2 d-flex justify-content-between align-items-center">
        <span class="status-indicator status-${emg.status.toLowerCase().replace(' ', '-')}">${emg.status}</span>
        ${emg.assignedAmbulance ? `<span class="badge bg-secondary font-mono">${emg.assignedAmbulance}</span>` : ''}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.queue-item-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      selectEmergencyForDispatch(id);
    });
  });
}

function selectEmergencyForDispatch(emergencyId) {
  selectedDispatchEmergencyId = emergencyId;
  const consoleContainer = document.getElementById('dispatch-recommendation-console');
  if (!consoleContainer) return;

  // Highlight in queue
  document.querySelectorAll('.queue-item-card').forEach(c => {
    if (c.getAttribute('data-id') === emergencyId) {
      c.classList.add('selected-queue-card');
    } else {
      c.classList.remove('selected-queue-card');
    }
  });

  const emergencies = StorageService.getEmergencies();
  const emergency = emergencies.find(e => e.id === emergencyId);

  if (!emergency) {
    consoleContainer.innerHTML = `<div class="p-4 text-center text-muted">Select an emergency from the queue.</div>`;
    return;
  }

  // If already assigned or on scene
  if (emergency.status === 'Assigned' || emergency.status === 'On Scene') {
    const ambulances = StorageService.getAmbulances();
    const assignedAmb = ambulances.find(a => a.id === emergency.assignedAmbulance);

    consoleContainer.innerHTML = `
      <div class="console-box active-operation-box">
        <div class="console-header">
          <h3 class="console-title text-warning"><i class="fa-solid fa-satellite-dish fa-spin"></i> ACTIVE OPERATION</h3>
          <span class="badge bg-warning text-dark font-mono">${emergency.status}</span>
        </div>
        <div class="console-body">
          <div class="incident-summary">
            <h4>${emergency.id}: ${emergency.patientName}</h4>
            <p><strong>Severity:</strong> <span class="badge-severity badge-severity-${emergency.severity.toLowerCase()}">${emergency.severity}</span></p>
            <p><strong>Location:</strong> ${emergency.location.area} (${emergency.location.landmark || 'En Route'})</p>
            <p><strong>Condition:</strong> ${emergency.description}</p>
          </div>

          <div class="assigned-unit-card my-3 p-3">
            <h5 class="font-mono text-success"><i class="fa-solid fa-truck-medical"></i> ${assignedAmb ? assignedAmb.id : 'Unit'} - ${assignedAmb ? assignedAmb.vehicleNumber : ''}</h5>
            <p class="mb-1"><strong>Driver:</strong> ${assignedAmb ? assignedAmb.driverName : 'Paramedic Crew'} (${assignedAmb ? assignedAmb.driverPhone : ''})</p>
            <p class="mb-1"><strong>Unit Type:</strong> ${assignedAmb ? assignedAmb.type : 'Emergency Vehicle'}</p>
            <p class="mb-0"><strong>Status:</strong> ${assignedAmb ? assignedAmb.status : 'Active'}</p>
          </div>

          <div class="action-buttons-stack mt-4">
            <button class="btn btn-success w-100 btn-complete-incident" data-id="${emergency.id}">
              <i class="fa-solid fa-check-double"></i> Complete Incident & Return Unit
            </button>
          </div>
        </div>
      </div>
    `;

    consoleContainer.querySelector('.btn-complete-incident').addEventListener('click', async () => {
      await DispatchEngine.completeEmergency(emergency.id);
      renderDispatchCenterView();
      updateDashboardStats();
    });
    return;
  }

  // Run Recommendation Engine
  const recommendation = DispatchEngine.findBestAmbulanceRecommendation(emergency.id);

  if (!recommendation.success) {
    consoleContainer.innerHTML = `
      <div class="console-box error-box">
        <div class="console-header">
          <h3 class="console-title text-danger"><i class="fa-solid fa-triangle-exclamation"></i> FLEET CONSTRAINT</h3>
        </div>
        <div class="console-body">
          <p class="text-danger fw-bold">${recommendation.reason}</p>
          <p class="text-muted">All ambulances in the network are currently assigned or in maintenance.</p>
          <button class="btn btn-secondary w-100 mt-3" onclick="navigateToSection('ambulances')">
            <i class="fa-solid fa-gear"></i> Inspect Fleet Availability
          </button>
        </div>
      </div>
    `;
    return;
  }

  const amb = recommendation.recommended;

  consoleContainer.innerHTML = `
    <div class="console-box">
      <div class="console-header">
        <h3 class="console-title text-primary"><i class="fa-solid fa-robot"></i> AI RECOMMENDATION</h3>
        <span class="badge bg-primary font-mono">MATCH SCORE: ${recommendation.score}/100</span>
      </div>

      <div class="console-body">
        <div class="incident-summary mb-3">
          <div class="d-flex justify-content-between">
            <span class="font-mono text-muted">${emergency.id}</span>
            <span class="badge-severity badge-severity-${emergency.severity.toLowerCase()}">${emergency.severity}</span>
          </div>
          <h4 class="mt-1">${emergency.patientName} (${emergency.type})</h4>
          <p class="text-muted small mb-0"><i class="fa-solid fa-location-dot"></i> ${emergency.location.area} - ${emergency.location.landmark || ''}</p>
        </div>

        <div class="recommendation-card p-3 mb-3">
          <div class="d-flex justify-content-between align-items-center">
            <h4 class="font-mono text-success mb-0">${amb.id} (${amb.vehicleNumber})</h4>
            <span class="badge bg-success">RECOMMENDED</span>
          </div>
          <div class="text-muted small mb-2">${amb.type}</div>

          <div class="metric-row d-flex justify-content-between my-2 p-2 rounded surface-pill">
            <div>
              <span class="d-block small text-muted">Distance</span>
              <strong class="font-mono">${recommendation.distanceKm} km</strong>
            </div>
            <div>
              <span class="d-block small text-muted">Estimated ETA</span>
              <strong class="font-mono text-warning">~${recommendation.etaMinutes} mins</strong>
            </div>
            <div>
              <span class="d-block small text-muted">Staged Base</span>
              <strong>${amb.location.area}</strong>
            </div>
          </div>

          <div class="rationale-callout p-2 mt-2">
            <i class="fa-solid fa-circle-info text-info me-1"></i>
            <small>${recommendation.rationale}</small>
          </div>
        </div>

        <div class="dispatch-actions">
          <button id="btn-authorize-dispatch" class="btn btn-primary btn-lg w-100 glow-btn" data-emg="${emergency.id}" data-amb="${amb.id}">
            <i class="fa-solid fa-tower-broadcast"></i> AUTHORIZE DISPATCH
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach click handler for authorize dispatch
  const authBtn = document.getElementById('btn-authorize-dispatch');
  if (authBtn) {
    authBtn.addEventListener('click', async () => {
      authBtn.disabled = true;
      authBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> TRANSMITTING COORDINATES...`;

      try {
        await DispatchEngine.confirmDispatch(emergency.id, amb.id);
        renderDispatchCenterView();
        updateDashboardStats();
      } catch (err) {
        AnimationEngine.showToast("DISPATCH FAILURE", err.message, "critical", 5000);
        authBtn.disabled = false;
        authBtn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> RETRY DISPATCH`;
      }
    });
  }
}

function initDispatchCenterControls() {
  // Map controls
  const zoomIn = document.getElementById('map-zoom-in');
  const zoomOut = document.getElementById('map-zoom-out');
  const zoomReset = document.getElementById('map-zoom-reset');
  const layerFilter = document.getElementById('map-layer-filter');

  if (zoomIn) zoomIn.addEventListener('click', () => { if (astraMapInstance) astraMapInstance.zoomLevel = Math.min(2.5, astraMapInstance.zoomLevel * 1.2); });
  if (zoomOut) zoomOut.addEventListener('click', () => { if (astraMapInstance) astraMapInstance.zoomLevel = Math.max(0.6, astraMapInstance.zoomLevel * 0.8); });
  if (zoomReset) zoomReset.addEventListener('click', () => { if (astraMapInstance) astraMapInstance.resetView(); });

  if (layerFilter) {
    layerFilter.addEventListener('change', (e) => {
      if (astraMapInstance) astraMapInstance.filterMode = e.target.value;
    });
  }
}

/**
 * -----------------------------------------------------------------------------
 * EMERGENCY MANAGEMENT MODULE
 * -----------------------------------------------------------------------------
 */
function renderEmergencyTables() {
  const container = document.getElementById('emergencies-table-body');
  if (!container) return;

  const emergencies = StorageService.getEmergencies();

  // Search & Filter values
  const searchInput = document.getElementById('emg-search-input');
  const severityFilter = document.getElementById('emg-filter-severity');
  const statusFilter = document.getElementById('emg-filter-status');

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const severity = severityFilter ? severityFilter.value : 'all';
  const status = statusFilter ? statusFilter.value : 'all';

  // Apply array filter()
  const filtered = emergencies.filter(emg => {
    const matchQuery = !query ||
      emg.id.toLowerCase().includes(query) ||
      emg.patientName.toLowerCase().includes(query) ||
      emg.location.area.toLowerCase().includes(query) ||
      emg.type.toLowerCase().includes(query);

    const matchSeverity = severity === 'all' || emg.severity === severity;
    const matchStatus = status === 'all' || emg.status === status;

    return matchQuery && matchSeverity && matchStatus;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No emergency records match criteria.</td></tr>`;
    return;
  }

  container.innerHTML = filtered.map(emg => `
    <tr>
      <td class="font-mono fw-bold">${emg.id}</td>
      <td>
        <div class="fw-semibold">${emg.patientName}</div>
        <small class="text-muted">${emg.contactNumber}</small>
      </td>
      <td>${emg.type}</td>
      <td><span class="badge-severity badge-severity-${emg.severity.toLowerCase()}">${emg.severity}</span></td>
      <td>
        <div>${emg.location.area}</div>
        <small class="text-muted font-mono">${emg.location.latitude.toFixed(4)}, ${emg.location.longitude.toFixed(4)}</small>
      </td>
      <td><span class="status-indicator status-${emg.status.toLowerCase().replace(' ', '-')}">${emg.status}</span></td>
      <td>
        <button class="btn btn-sm btn-secondary btn-emg-action" data-id="${emg.id}">
          <i class="fa-solid fa-sliders"></i> Action
        </button>
      </td>
    </tr>
  `).join('');

  container.querySelectorAll('.btn-emg-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      navigateToSection('dispatch');
      selectEmergencyForDispatch(id);
    });
  });

  // Attach listeners for filter inputs once
  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = "true";
    searchInput.addEventListener('input', () => renderEmergencyTables());
    if (severityFilter) severityFilter.addEventListener('change', () => renderEmergencyTables());
    if (statusFilter) statusFilter.addEventListener('change', () => renderEmergencyTables());
  }
}

function initEmergencyModalAndForm() {
  const modal = document.getElementById('modal-new-emergency');
  const openBtn = document.getElementById('btn-open-new-emergency');
  const closeBtn = document.getElementById('btn-close-emergency-modal');
  const form = document.getElementById('form-register-emergency');
  const areaSelect = document.getElementById('emg-area-select');
  const latInput = document.getElementById('emg-lat-input');
  const lngInput = document.getElementById('emg-lng-input');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.classList.add('modal-visible');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('modal-visible');
    });
  }

  // Populate area dropdown from BANGALORE_AREAS
  if (areaSelect) {
    areaSelect.innerHTML = `<option value="">-- Select Bangalore Area --</option>` +
      Object.keys(BANGALORE_AREAS).map(area => `<option value="${area}">${area}</option>`).join('');

    areaSelect.addEventListener('change', () => {
      const selected = areaSelect.value;
      if (BANGALORE_AREAS[selected]) {
        if (latInput) latInput.value = BANGALORE_AREAS[selected].lat;
        if (lngInput) lngInput.value = BANGALORE_AREAS[selected].lng;
      }
    });
  }

  // Form submission with strict validation
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const patientName = document.getElementById('emg-patient-name').value.trim();
      const contactNumber = document.getElementById('emg-contact-number').value.trim();
      const emergencyType = document.getElementById('emg-type-select').value;
      const severity = document.getElementById('emg-severity-select').value;
      const area = areaSelect.value;
      const landmark = document.getElementById('emg-landmark-input').value.trim();
      const lat = parseFloat(latInput.value);
      const lng = parseFloat(lngInput.value);
      const description = document.getElementById('emg-desc-input').value.trim();

      // Validation 1: Required fields
      if (!patientName || !contactNumber || !emergencyType || !severity || !area || isNaN(lat) || isNaN(lng) || !description) {
        AnimationEngine.showToast("VALIDATION ERROR", "Please fill in all mandatory fields with valid coordinates.", "critical");
        return;
      }

      // Validation 2: Phone number format
      const phoneRegex = /^[0-9+\s-]{10,15}$/;
      if (!phoneRegex.test(contactNumber)) {
        AnimationEngine.showToast("INVALID CONTACT", "Please enter a valid 10-15 digit contact number.", "warning");
        return;
      }

      // Validation 3: Coordinate bounds
      if (lat < 12.70 || lat > 13.20 || lng < 77.40 || lng > 77.90) {
        AnimationEngine.showToast("COORDINATE OUT OF BOUNDS", "Coordinates must be within the greater Bangalore metropolitan boundary.", "warning");
        return;
      }

      // Validation 4: Duplicate report prevention using Set
      const emergencies = StorageService.getEmergencies();
      const isDuplicate = emergencies.some(existing => 
        existing.status !== 'Resolved' &&
        existing.patientName.toLowerCase() === patientName.toLowerCase() &&
        existing.location.area === area
      );

      if (isDuplicate) {
        AnimationEngine.showToast("DUPLICATE INCIDENT BLOCKED", `An active emergency for patient "${patientName}" in "${area}" is already registered.`, "warning");
        return;
      }

      // Generate unique Emergency ID
      const newId = `EMG-${Math.floor(8100 + Math.random() * 900)}`;

      const newEmergency = {
        id: newId,
        patientName,
        contactNumber,
        type: emergencyType,
        severity,
        location: {
          area,
          latitude: lat,
          longitude: lng,
          landmark: landmark || "Reported Location"
        },
        description,
        status: "Pending",
        assignedAmbulance: null,
        reportedAt: new Date().toISOString(),
        assignedAt: null,
        arrivedAt: null,
        resolvedAt: null,
        responseTimeMinutes: null
      };

      emergencies.unshift(newEmergency);
      StorageService.saveEmergencies(emergencies);
      AstraDataStructures.syncStructures(StorageService.getAmbulances(), emergencies);

      // Notification
      AnimationEngine.showToast("EMERGENCY REGISTERED", `Incident ${newId} logged as ${severity}. Queued for dispatch recommendation.`, severity === 'Critical' ? 'critical' : 'success');

      form.reset();
      modal.classList.remove('modal-visible');

      // Refresh views and jump to dispatch center if Critical
      if (severity === 'Critical') {
        navigateToSection('dispatch');
        selectEmergencyForDispatch(newId);
      } else {
        renderEmergencyTables();
        updateDashboardStats();
      }
    });
  }
}

/**
 * -----------------------------------------------------------------------------
 * AMBULANCE FLEET MANAGEMENT MODULE
 * -----------------------------------------------------------------------------
 */
function renderAmbulanceTables() {
  const container = document.getElementById('ambulance-table-body');
  if (!container) return;

  const ambulances = StorageService.getAmbulances();
  const searchInput = document.getElementById('amb-search-input');
  const statusFilter = document.getElementById('amb-filter-status');
  const typeFilter = document.getElementById('amb-filter-type');

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const status = statusFilter ? statusFilter.value : 'all';
  const type = typeFilter ? typeFilter.value : 'all';

  const filtered = ambulances.filter(amb => {
    const matchQuery = !query ||
      amb.id.toLowerCase().includes(query) ||
      amb.vehicleNumber.toLowerCase().includes(query) ||
      amb.driverName.toLowerCase().includes(query) ||
      amb.location.area.toLowerCase().includes(query);

    const matchStatus = status === 'all' || amb.status === status;
    const matchType = type === 'all' || amb.type === type;

    return matchQuery && matchStatus && matchType;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No ambulances match filters.</td></tr>`;
    return;
  }

  container.innerHTML = filtered.map(amb => `
    <tr id="amb-row-${amb.id}">
      <td class="font-mono fw-bold">${amb.id}</td>
      <td class="font-mono">${amb.vehicleNumber}</td>
      <td>
        <div>${amb.driverName}</div>
        <small class="text-muted">${amb.driverPhone}</small>
      </td>
      <td><span class="badge bg-secondary">${amb.type}</span></td>
      <td>${amb.location.area}</td>
      <td><span class="status-indicator status-${amb.status.toLowerCase().replace(' ', '-')}">${amb.status}</span></td>
      <td>
        <select class="form-select form-select-sm amb-status-changer" data-id="${amb.id}">
          <option value="Available" ${amb.status === 'Available' ? 'selected' : ''}>Available</option>
          <option value="Maintenance" ${amb.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
          <option value="Dispatched" disabled ${amb.status === 'Dispatched' ? 'selected' : ''}>Dispatched (Locked)</option>
          <option value="On Scene" disabled ${amb.status === 'On Scene' ? 'selected' : ''}>On Scene (Locked)</option>
        </select>
      </td>
    </tr>
  `).join('');

  // Status changer event
  container.querySelectorAll('.amb-status-changer').forEach(select => {
    select.addEventListener('change', (e) => {
      const ambId = select.getAttribute('data-id');
      const newStatus = e.target.value;
      updateAmbulanceStatus(ambId, newStatus);
    });
  });

  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = "true";
    searchInput.addEventListener('input', () => renderAmbulanceTables());
    if (statusFilter) statusFilter.addEventListener('change', () => renderAmbulanceTables());
    if (typeFilter) typeFilter.addEventListener('change', () => renderAmbulanceTables());
  }
}

function updateAmbulanceStatus(ambId, newStatus) {
  const ambulances = StorageService.getAmbulances();
  const amb = ambulances.find(a => a.id === ambId);
  if (!amb) return;

  if (amb.currentEmergency && (newStatus === 'Available' || newStatus === 'Maintenance')) {
    AnimationEngine.showToast("ACTION RESTRICTED", `Ambulance ${amb.id} is assigned to active call ${amb.currentEmergency}. Complete incident first.`, "warning");
    renderAmbulanceTables();
    return;
  }

  amb.status = newStatus;
  StorageService.saveAmbulances(ambulances);
  AstraDataStructures.syncStructures(ambulances, StorageService.getEmergencies());

  AnimationEngine.showToast("STATUS UPDATED", `Ambulance ${amb.id} status changed to ${newStatus}.`, "info");
  renderAmbulanceTables();
  updateDashboardStats();
}

function highlightAmbulanceRow(ambId) {
  const row = document.getElementById(`amb-row-${ambId}`);
  if (row) {
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.add('table-row-highlight');
    setTimeout(() => row.classList.remove('table-row-highlight'), 3000);
  }
}

function initAmbulanceModalAndForm() {
  const modal = document.getElementById('modal-new-ambulance');
  const openBtn = document.getElementById('btn-open-new-ambulance');
  const closeBtn = document.getElementById('btn-close-ambulance-modal');
  const form = document.getElementById('form-register-ambulance');
  const areaSelect = document.getElementById('amb-area-select');

  if (openBtn && modal) openBtn.addEventListener('click', () => modal.classList.add('modal-visible'));
  if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.classList.remove('modal-visible'));

  if (areaSelect) {
    areaSelect.innerHTML = `<option value="">-- Station Base Area --</option>` +
      Object.keys(BANGALORE_AREAS).map(area => `<option value="${area}">${area}</option>`).join('');
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const vehicleNumber = document.getElementById('amb-vehicle-number').value.trim().toUpperCase();
      const driverName = document.getElementById('amb-driver-name').value.trim();
      const driverPhone = document.getElementById('amb-driver-phone').value.trim();
      const type = document.getElementById('amb-type-select').value;
      const area = areaSelect.value;

      if (!vehicleNumber || !driverName || !driverPhone || !type || !area) {
        AnimationEngine.showToast("VALIDATION ERROR", "All fields are required.", "warning");
        return;
      }

      const ambulances = StorageService.getAmbulances();
      if (ambulances.some(a => a.vehicleNumber === vehicleNumber)) {
        AnimationEngine.showToast("DUPLICATE VEHICLE", `Vehicle number ${vehicleNumber} is already registered.`, "warning");
        return;
      }

      const newId = `AMB-${Math.floor(120 + Math.random() * 80)}`;
      const areaCoords = BANGALORE_AREAS[area];

      const newAmbulance = {
        id: newId,
        vehicleNumber,
        driverName,
        driverPhone,
        type,
        equipment: type === 'Advanced Life Support' ? ['Ventilator', 'Defibrillator', 'Oxygen'] : ['Stretcher', 'Oxygen'],
        location: {
          area,
          latitude: areaCoords.lat,
          longitude: areaCoords.lng
        },
        status: "Available",
        currentEmergency: null,
        totalTrips: 0,
        fuelLevel: 100,
        speedKmH: 0
      };

      ambulances.push(newAmbulance);
      StorageService.saveAmbulances(ambulances);
      AstraDataStructures.syncStructures(ambulances, StorageService.getEmergencies());

      AnimationEngine.showToast("FLEET EXPANDED", `Ambulance ${newId} registered and stationed at ${area}.`, "success");
      form.reset();
      modal.classList.remove('modal-visible');
      renderAmbulanceTables();
      updateDashboardStats();
    });
  }
}

/**
 * -----------------------------------------------------------------------------
 * BOTTLENECK DETECTOR & ANALYTICS VIEW
 * -----------------------------------------------------------------------------
 */
function renderBottleneckInsights() {
  const result = AnalyticsEngine.detectBottlenecks();
  const container = document.getElementById('bottleneck-insights-container');
  if (!container) return;

  if (result.insights.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-success">
          <i class="fa-solid fa-check-circle me-2"></i> All operational sectors within optimal response latency bounds. No acute bottlenecks detected.
        </div>
      </div>`;
    return;
  }

  container.innerHTML = result.insights.map(item => `
    <div class="col-md-6 col-lg-4 mb-3">
      <div class="bottleneck-card border-left-${item.severityTag.includes('CRITICAL') ? 'danger' : 'warning'}">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="badge bg-danger">${item.severityTag}</span>
          <span class="fw-bold font-mono">${item.area}</span>
        </div>
        <ul class="list-unstyled small mb-3">
          <li><strong>Total Incidents:</strong> ${item.totalReports}</li>
          <li><strong>Critical Severity Calls:</strong> ${item.criticalCount}</li>
          <li><strong>Average Response Time:</strong> ${item.avgResponseTime} min</li>
          <li><strong>Current Stationed Units:</strong> ${item.stationedAmbulances}</li>
        </ul>
        <div class="recommendation-badge-box">
          <strong>Recommendation:</strong>
          <p class="small text-muted mb-0 mt-1">${item.recommendation}</p>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * -----------------------------------------------------------------------------
 * NOTIFICATION DRAWER
 * -----------------------------------------------------------------------------
 */
function initNotificationDrawer() {
  const toggleBtn = document.getElementById('notif-bell-btn');
  const drawer = document.getElementById('notification-drawer');
  const closeBtn = document.getElementById('btn-close-drawer');
  const clearBtn = document.getElementById('btn-clear-notifications');

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', () => {
      drawer.classList.toggle('drawer-open');
      renderNotificationList();
    });
  }
  if (closeBtn && drawer) {
    closeBtn.addEventListener('click', () => drawer.classList.remove('drawer-open'));
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      StorageService.saveNotifications([]);
      renderNotificationList();
      updateNotificationBadge();
    });
  }
  updateNotificationBadge();
}

function updateNotificationBadge() {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  const notifications = StorageService.getNotifications();
  const unread = notifications.filter(n => !n.read).length;
  if (unread > 0) {
    badge.textContent = unread;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

function renderNotificationList() {
  const container = document.getElementById('drawer-notification-list');
  if (!container) return;

  const notifications = StorageService.getNotifications();
  if (notifications.length === 0) {
    container.innerHTML = `<p class="text-center text-muted py-4">No recent system notifications.</p>`;
    return;
  }

  container.innerHTML = notifications.map(n => `
    <div class="notification-item ${n.read ? 'notif-read' : 'notif-unread'}">
      <div class="notif-header d-flex justify-content-between">
        <strong>${n.title}</strong>
        <small class="text-muted">${new Date(n.timestamp).toLocaleTimeString()}</small>
      </div>
      <p class="notif-body mb-0 small">${n.message}</p>
    </div>
  `).join('');

  // Mark all as read
  notifications.forEach(n => n.read = true);
  StorageService.saveNotifications(notifications);
  updateNotificationBadge();
}

/**
 * -----------------------------------------------------------------------------
 * QUICK TEST SCENARIOS (Academic Evaluator Demonstrations)
 * -----------------------------------------------------------------------------
 */
function initQuickTestScenarios() {
  // 1. One-click Critical Emergency Injection
  const quickCriticalBtn = document.getElementById('btn-quick-critical-test');
  if (quickCriticalBtn) {
    quickCriticalBtn.addEventListener('click', () => {
      const emergencies = StorageService.getEmergencies();
      const testId = `EMG-${Math.floor(8800 + Math.random() * 100)}`;
      const newCritical = {
        id: testId,
        patientName: "Siddharth Nambiar",
        contactNumber: "+91 99000 88776",
        type: "Cardiac Emergency",
        severity: "Critical",
        location: {
          area: "Koramangala",
          latitude: 12.9352,
          longitude: 77.6245,
          landmark: "Near Wipro Park 1st Block"
        },
        description: "Witnessed collapse, pulseless, bystander CPR initiated.",
        status: "Pending",
        assignedAmbulance: null,
        reportedAt: new Date().toISOString(),
        assignedAt: null,
        arrivedAt: null,
        resolvedAt: null,
        responseTimeMinutes: null
      };

      emergencies.unshift(newCritical);
      StorageService.saveEmergencies(emergencies);
      AstraDataStructures.syncStructures(StorageService.getAmbulances(), emergencies);

      AnimationEngine.showToast("TEST SCENARIO TRIGGERED", `Injected Critical Cardiac call ${testId} in Koramangala. Opening Dispatch Console.`, "critical");

      navigateToSection('dispatch');
      selectEmergencyForDispatch(testId);
    });
  }

  // 2. Controlled Failure Simulation Toggle
  const failToggle = document.getElementById('simulate-failure-toggle');
  if (failToggle) {
    failToggle.addEventListener('change', (e) => {
      DispatchEngine.simulationFlags.simulateNetworkFailure = e.target.checked;
      if (e.target.checked) {
        AnimationEngine.showToast("FAILURE SIMULATION ACTIVE", "Simulated network timeout enabled. Future dispatch attempts will trigger error handling.", "warning", 4000);
      } else {
        AnimationEngine.showToast("FAILURE SIMULATION CLEARED", "Network dispatch simulation restored to normal.", "success", 2500);
      }
    });
  }

  // 3. Reset Demo Data
  const resetBtn = document.getElementById('btn-reset-demo-data');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm("Reset all fleet and emergency data to the default demonstration seed?")) {
        StorageService.resetToDefaults();
        const ambs = StorageService.getAmbulances();
        const emgs = StorageService.getEmergencies();
        AstraDataStructures.syncStructures(ambs, emgs);
        if (astraMapInstance) astraMapInstance.activeSimulations.clear();
        selectedDispatchEmergencyId = null;
        window.refreshAllUIViews();
        AnimationEngine.showToast("DEMO RESTORED", "All ambulance and emergency states reset to initial seed.", "info");
      }
    });
  }
}
