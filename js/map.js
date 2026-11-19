/**
 * AstraResQ - Bangalore Simulation Map Engine
 * Academic Demonstration: Canvas 2D Graphics, Coordinate Projection,
 * Mathematical Interpolation (LERP), and requestAnimationFrame Transit Simulation.
 * 
 * DISCLAIMER: Academic Simulation Engine. Not actual GPS or real-world emergency dispatch.
 */

class BangaloreSimulationMap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Bangalore Bounding Box Coordinates
    this.bounds = {
      minLat: 12.8250,
      maxLat: 13.0650,
      minLng: 77.5150,
      maxLng: 77.7800
    };

    this.zoomLevel = 1.0;
    this.panOffset = { x: 0, y: 0 };
    this.filterMode = 'all'; // 'all', 'emergencies', 'ambulances'
    this.activeSimulations = new Map(); // emergencyId -> simulationState
    this.animationFrameId = null;
    this.radarAngle = 0;
    this.selectedEntity = null;

    // Bangalore Major Transit Arteries (Simulated Network Nodes)
    this.corridors = [
      // Outer Ring Road loop
      ['Hebbal', 'Marathahalli'],
      ['Marathahalli', 'Koramangala'],
      ['Koramangala', 'HSR Layout'],
      ['HSR Layout', 'Electronic City'],
      ['HSR Layout', 'Banashankari'],
      ['Banashankari', 'Jayanagar'],
      ['Jayanagar', 'MG Road'],
      ['MG Road', 'Indiranagar'],
      ['Indiranagar', 'Marathahalli'],
      ['Marathahalli', 'Whitefield'],
      ['Indiranagar', 'Whitefield'],
      ['MG Road', 'Malleshwaram'],
      ['Malleshwaram', 'Rajajinagar'],
      ['Rajajinagar', 'Banashankari'],
      ['Malleshwaram', 'Hebbal'],
      ['MG Road', 'Hebbal']
    ];

    this.initCanvas();
    this.bindEvents();
    this.startRenderLoop();
  }

  initCanvas() {
    const resize = () => {
      const container = this.canvas.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
      
      this.ctx.scale(dpr, dpr);
      this.displayWidth = rect.width;
      this.displayHeight = rect.height;
    };

    window.addEventListener('resize', resize);
    resize();
  }

  bindEvents() {
    let isDragging = false;
    let startX, startY;

    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX - this.panOffset.x;
      startY = e.clientY - this.panOffset.y;
      this.canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      this.panOffset.x = e.clientX - startX;
      this.panOffset.y = e.clientY - startY;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      if (this.canvas) this.canvas.style.cursor = 'crosshair';
    });

    // Zoom via wheel
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.zoomLevel = Math.max(0.7, Math.min(2.5, this.zoomLevel * zoomFactor));
    }, { passive: false });

    // Click entity detection
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      this.handleMapClick(clickX, clickY);
    });
  }

  /**
   * Project geographic (lat, lng) to 2D Canvas (x, y) coordinates
   */
  projectCoord(lat, lng) {
    const pad = 40;
    const w = (this.displayWidth || 600) - pad * 2;
    const h = (this.displayHeight || 500) - pad * 2;

    // Normalized 0 to 1
    const normX = (lng - this.bounds.minLng) / (this.bounds.maxLng - this.bounds.minLng);
    const normY = (lat - this.bounds.minLat) / (this.bounds.maxLat - this.bounds.minLat);

    // Invert Y because canvas Y points downwards
    let x = pad + normX * w;
    let y = pad + (1 - normY) * h;

    // Apply zoom & pan relative to canvas center
    const cx = (this.displayWidth || 600) / 2;
    const cy = (this.displayHeight || 500) / 2;

    x = cx + (x - cx) * this.zoomLevel + this.panOffset.x;
    y = cy + (y - cy) * this.zoomLevel + this.panOffset.y;

    return { x, y };
  }

  /**
   * Linear Interpolation helper for coordinates
   */
  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Start or resume animated transit movement along route
   */
  startAmbulanceTransit(dispatchRecord, ambulance, emergency, onArrivalCallback) {
    const key = emergency.id;
    const startCoord = { lat: ambulance.location.latitude, lng: ambulance.location.longitude };
    const targetCoord = { lat: emergency.location.latitude, lng: emergency.location.longitude };
    const totalDistKm = calculateHaversineDistance(startCoord.lat, startCoord.lng, targetCoord.lat, targetCoord.lng);

    // Simulation takes ~20 seconds of real time (or scaled for interactive demo)
    const durationMs = 22000; // 22 seconds for vivid, observable movement
    const startTime = performance.now();

    const simulation = {
      emergencyId: emergency.id,
      ambulanceId: ambulance.id,
      startCoord,
      targetCoord,
      currentCoord: { ...startCoord },
      totalDistKm,
      remainingDistKm: totalDistKm,
      startTime,
      durationMs,
      progress: 0,
      status: 'In-Transit',
      speedKmh: emergency.severity === 'Critical' ? 46 : 38,
      onArrival: onArrivalCallback
    };

    this.activeSimulations.set(key, simulation);
    console.log(`[SimulationMap] Transit initiated for ${ambulance.id} -> ${emergency.id} (${totalDistKm} km)`);
  }

  /**
   * Main Render Loop running via requestAnimationFrame
   */
  startRenderLoop() {
    const render = (timestamp) => {
      this.updateSimulations(timestamp);
      this.draw(timestamp);
      this.animationFrameId = requestAnimationFrame(render);
    };
    this.animationFrameId = requestAnimationFrame(render);
  }

  updateSimulations(now) {
    this.activeSimulations.forEach((sim, key) => {
      const elapsed = now - sim.startTime;
      const progress = Math.min(elapsed / sim.durationMs, 1.0);
      sim.progress = progress;

      // Update current interpolated coordinate
      sim.currentCoord.lat = this.lerp(sim.startCoord.lat, sim.targetCoord.lat, progress);
      sim.currentCoord.lng = this.lerp(sim.startCoord.lng, sim.targetCoord.lng, progress);

      // Remaining distance
      sim.remainingDistKm = Math.max(0, Math.round((sim.totalDistKm * (1 - progress)) * 100) / 100);

      // Live ETA countdown
      const remainingSeconds = Math.max(0, Math.round(((sim.durationMs - elapsed) / 1000) * (sim.totalDistKm * 0.8)));
      sim.liveEtaMinutes = Math.max(1, Math.ceil(remainingSeconds / 60));

      // Check arrival
      if (progress >= 1.0 && sim.status === 'In-Transit') {
        sim.status = 'Arrived';
        if (typeof sim.onArrival === 'function') {
          sim.onArrival(sim);
        }
        // Auto remove from active movement after short cooldown
        setTimeout(() => {
          this.activeSimulations.delete(key);
        }, 3000);
      }
    });

    // Radar scan line rotation
    this.radarAngle = (this.radarAngle + 0.015) % (Math.PI * 2);
  }

  draw(timestamp) {
    if (!this.ctx || !this.displayWidth) return;
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    const isWhiteTheme = document.body.classList.contains('theme-white');
    
    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    if (isWhiteTheme) {
      bgGrad.addColorStop(0, '#f8fafc');
      bgGrad.addColorStop(1, '#edf2f7');
    } else {
      bgGrad.addColorStop(0, '#0a0d14');
      bgGrad.addColorStop(1, '#05070a');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw Tactical Grid
    this.drawGrid(ctx, w, h, isWhiteTheme);

    // Draw Bangalore Road Network Arteries
    this.drawRoadNetwork(ctx, isWhiteTheme);

    // Draw Active Route Lines & Transit Pulses
    this.drawActiveRoutes(ctx, timestamp, isWhiteTheme);

    // Draw Area Landmark Nodes
    this.drawAreaLabels(ctx, isWhiteTheme);

    // Retrieve live records from Storage
    const ambulances = StorageService.getAmbulances();
    const emergencies = StorageService.getEmergencies();

    // Draw Emergencies (Beacons)
    if (this.filterMode === 'all' || this.filterMode === 'emergencies') {
      emergencies.forEach(emg => {
        if (emg.status !== 'Resolved') {
          this.drawEmergencyBeacon(ctx, emg, timestamp);
        }
      });
    }

    // Draw Ambulances
    if (this.filterMode === 'all' || this.filterMode === 'ambulances') {
      ambulances.forEach(amb => {
        // If actively in simulation transit, use simulated moving coord
        let lat = amb.location.latitude;
        let lng = amb.location.longitude;

        if (amb.currentEmergency && this.activeSimulations.has(amb.currentEmergency)) {
          const sim = this.activeSimulations.get(amb.currentEmergency);
          lat = sim.currentCoord.lat;
          lng = sim.currentCoord.lng;
        }

        this.drawAmbulanceMarker(ctx, amb, lat, lng, timestamp);
      });
    }

    // Draw Radar Sweep Overlay
    this.drawRadarSweep(ctx, w, h, isWhiteTheme);

    // Draw Live Simulation Telemetry HUD if active dispatch exists
    this.drawTelemetryHUD(ctx, isWhiteTheme);
  }

  drawGrid(ctx, w, h, isWhiteTheme) {
    const gridSize = 40 * this.zoomLevel;
    const startX = (this.panOffset.x % gridSize);
    const startY = (this.panOffset.y % gridSize);

    ctx.save();
    ctx.strokeStyle = isWhiteTheme ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    for (let x = startX; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = startY; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawRoadNetwork(ctx, isWhiteTheme) {
    ctx.save();
    ctx.strokeStyle = isWhiteTheme ? 'rgba(70, 90, 120, 0.22)' : 'rgba(0, 230, 255, 0.12)';
    ctx.lineWidth = 2 * this.zoomLevel;
    ctx.setLineDash([4, 6]);

    this.corridors.forEach(([fromArea, toArea]) => {
      const p1 = BANGALORE_AREAS[fromArea];
      const p2 = BANGALORE_AREAS[toArea];
      if (p1 && p2) {
        const c1 = this.projectCoord(p1.lat, p1.lng);
        const c2 = this.projectCoord(p2.lat, p2.lng);

        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  drawAreaLabels(ctx, isWhiteTheme) {
    ctx.save();
    ctx.font = `600 ${Math.max(9, 10 * this.zoomLevel)}px 'Inter', sans-serif`;
    ctx.textAlign = 'center';

    Object.entries(BANGALORE_AREAS).forEach(([name, data]) => {
      const pt = this.projectCoord(data.lat, data.lng);

      // Dot
      ctx.fillStyle = isWhiteTheme ? '#94a3b8' : '#334155';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3 * this.zoomLevel, 0, Math.PI * 2);
      ctx.fill();

      // Text label
      ctx.fillStyle = isWhiteTheme ? '#475569' : '#64748b';
      ctx.fillText(name, pt.x, pt.y - (8 * this.zoomLevel));
    });
    ctx.restore();
  }

  drawActiveRoutes(ctx, timestamp, isWhiteTheme) {
    this.activeSimulations.forEach(sim => {
      const pStart = this.projectCoord(sim.startCoord.lat, sim.startCoord.lng);
      const pTarget = this.projectCoord(sim.targetCoord.lat, sim.targetCoord.lng);
      const pCurrent = this.projectCoord(sim.currentCoord.lat, sim.currentCoord.lng);

      ctx.save();
      
      // Route line: from current pos to emergency target
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -(timestamp / 30) % 24;

      ctx.beginPath();
      ctx.moveTo(pCurrent.x, pCurrent.y);
      ctx.lineTo(pTarget.x, pTarget.y);
      ctx.stroke();

      // Traveled trail: start to current pos
      ctx.strokeStyle = '#10b981';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pCurrent.x, pCurrent.y);
      ctx.stroke();

      ctx.restore();
    });
  }

  drawEmergencyBeacon(ctx, emergency, timestamp) {
    const pt = this.projectCoord(emergency.location.latitude, emergency.location.longitude);
    
    // Severity colors
    let color = '#ef4444'; // Critical
    let outerColor = 'rgba(239, 68, 68, 0.25)';
    if (emergency.severity === 'High') {
      color = '#f97316';
      outerColor = 'rgba(249, 115, 22, 0.22)';
    } else if (emergency.severity === 'Medium') {
      color = '#eab308';
      outerColor = 'rgba(234, 179, 8, 0.20)';
    } else if (emergency.severity === 'Low') {
      color = '#3b82f6';
      outerColor = 'rgba(59, 130, 246, 0.18)';
    }

    // Pulsing circle wave
    const pulsePhase = (timestamp % 1500) / 1500;
    const pulseRadius = (10 + pulsePhase * 24) * this.zoomLevel;
    const pulseOpacity = 1 - pulsePhase;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = pulseOpacity;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Solid inner core
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = outerColor;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 9 * this.zoomLevel, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4.5 * this.zoomLevel, 0, Math.PI * 2);
    ctx.fill();

    // Beacon label
    ctx.font = `bold ${Math.max(9, 10 * this.zoomLevel)}px monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(emergency.id, pt.x, pt.y + (16 * this.zoomLevel));

    ctx.restore();
  }

  drawAmbulanceMarker(ctx, ambulance, lat, lng, timestamp) {
    const pt = this.projectCoord(lat, lng);
    const isDispatched = ambulance.status === 'Dispatched';
    const isOnScene = ambulance.status === 'On Scene';
    const isMaintenance = ambulance.status === 'Maintenance';

    let color = '#10b981'; // Green: Available
    if (isDispatched) color = '#f59e0b'; // Amber: Dispatched / Transit
    if (isOnScene) color = '#3b82f6'; // Blue: On Scene
    if (isMaintenance) color = '#6b7280'; // Gray: Maintenance

    ctx.save();

    // Halo pulse for moving / active unit
    if (isDispatched) {
      const pulse = (timestamp % 1000) / 1000;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1 - pulse;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, (10 + pulse * 14) * this.zoomLevel, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // Vehicle Marker Box
    const size = 18 * this.zoomLevel;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(pt.x - size / 2, pt.y - size / 2, size, size, 4);
    ctx.fill();

    // Inner icon: Cross glyph (+)
    ctx.fillStyle = '#ffffff';
    const barW = 3 * this.zoomLevel;
    const barL = 10 * this.zoomLevel;
    ctx.fillRect(pt.x - barW / 2, pt.y - barL / 2, barW, barL);
    ctx.fillRect(pt.x - barL / 2, pt.y - barW / 2, barL, barW);

    // Call sign tag
    ctx.font = `600 ${Math.max(9, 10 * this.zoomLevel)}px monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(ambulance.id, pt.x, pt.y - (12 * this.zoomLevel));

    ctx.restore();
  }

  drawRadarSweep(ctx, w, h, isWhiteTheme) {
    ctx.save();
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.45;

    ctx.strokeStyle = isWhiteTheme ? 'rgba(0,0,0,0.06)' : 'rgba(16, 185, 129, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Radial beam
    const beamGrad = ctx.createLinearGradient(cx, cy, cx + Math.cos(this.radarAngle) * r, cy + Math.sin(this.radarAngle) * r);
    beamGrad.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    beamGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, this.radarAngle - 0.25, this.radarAngle);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawTelemetryHUD(ctx, isWhiteTheme) {
    if (this.activeSimulations.size === 0) return;

    // Get the first active simulation for telemetry feed
    const firstSim = Array.from(this.activeSimulations.values())[0];
    if (!firstSim) return;

    ctx.save();
    const boxW = 240;
    const boxH = 96;
    const boxX = 20;
    const boxY = 20;

    ctx.fillStyle = isWhiteTheme ? 'rgba(255, 255, 255, 0.94)' : 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = isWhiteTheme ? '#cbd5e1' : '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    // Header
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('LIVE DISPATCH TELEMETRY', boxX + 12, boxY + 22);

    // Details
    ctx.fillStyle = isWhiteTheme ? '#0f172a' : '#f8fafc';
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillText(`Target: ${firstSim.emergencyId} | Unit: ${firstSim.ambulanceId}`, boxX + 12, boxY + 40);

    ctx.fillText(`Speed: ${firstSim.speedKmh} km/h (Priority Siren)`, boxX + 12, boxY + 58);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`Dist: ${firstSim.remainingDistKm} km | ETA: ~${firstSim.liveEtaMinutes} min`, boxX + 12, boxY + 76);

    // Progress bar inside HUD
    const barW = boxW - 24;
    const barH = 4;
    ctx.fillStyle = isWhiteTheme ? '#e2e8f0' : '#1e293b';
    ctx.fillRect(boxX + 12, boxY + 84, barW, barH);

    ctx.fillStyle = '#10b981';
    ctx.fillRect(boxX + 12, boxY + 84, barW * firstSim.progress, barH);

    ctx.restore();
  }

  handleMapClick(clickX, clickY) {
    const ambulances = StorageService.getAmbulances();
    const emergencies = StorageService.getEmergencies();

    // Check emergency hit
    for (const emg of emergencies) {
      if (emg.status === 'Resolved') continue;
      const pt = this.projectCoord(emg.location.latitude, emg.location.longitude);
      const dist = Math.hypot(clickX - pt.x, clickY - pt.y);
      if (dist < 15) {
        if (typeof window.onMapEntitySelected === 'function') {
          window.onMapEntitySelected('emergency', emg);
        }
        return;
      }
    }

    // Check ambulance hit
    for (const amb of ambulances) {
      let lat = amb.location.latitude;
      let lng = amb.location.longitude;
      if (amb.currentEmergency && this.activeSimulations.has(amb.currentEmergency)) {
        const sim = this.activeSimulations.get(amb.currentEmergency);
        lat = sim.currentCoord.lat;
        lng = sim.currentCoord.lng;
      }
      const pt = this.projectCoord(lat, lng);
      const dist = Math.hypot(clickX - pt.x, clickY - pt.y);
      if (dist < 15) {
        if (typeof window.onMapEntitySelected === 'function') {
          window.onMapEntitySelected('ambulance', amb);
        }
        return;
      }
    }
  }

  resetView() {
    this.zoomLevel = 1.0;
    this.panOffset = { x: 0, y: 0 };
  }
}

// Global Map Instance Reference
let astraMapInstance = null;
