/**
 * AstraResQ - Intelligent Ambulance Dispatch Engine & Async Coordinator
 * Academic Demonstration: Haversine Calculation, Composite Scoring Algorithm,
 * Async/Await, JavaScript Promises, Error Resilience, and Race Condition Prevention.
 */

const DispatchEngine = {
  // Lock mechanism to prevent race conditions during concurrent assignments
  assignmentLocks: new Set(),
  
  // Controlled simulation mode flags (for professor/examiner demonstration)
  simulationFlags: {
    simulateNetworkFailure: false,
    simulateNoAmbulances: false,
    simulateInTransitBreakdown: false
  },

  /**
   * Core Recommendation Algorithm:
   * Finds the best matching available ambulance for a given emergency.
   * Returns a recommendation object with ranking score, distance, ETA, and rationale.
   */
  findBestAmbulanceRecommendation(emergencyId) {
    const emergencies = StorageService.getEmergencies();
    const ambulances = StorageService.getAmbulances();

    const emergency = emergencies.find(e => e.id === emergencyId);
    if (!emergency) {
      throw new Error(`Emergency record ${emergencyId} not found.`);
    }

    if (emergency.status === 'Resolved' || emergency.status === 'Assigned' || emergency.status === 'On Scene') {
      return {
        success: false,
        reason: `Emergency ${emergencyId} is already in state '${emergency.status}'.`
      };
    }

    // Filter available ambulances (must not be Dispatched, On Scene, Maintenance, or locked)
    const availableAmbulances = ambulances.filter(amb => {
      const isAvailableStatus = amb.status === 'Available';
      const isNotAssigned = !amb.currentEmergency;
      const isNotLocked = !this.assignmentLocks.has(amb.id);
      return isAvailableStatus && isNotAssigned && isNotLocked;
    });

    if (availableAmbulances.length === 0 || this.simulationFlags.simulateNoAmbulances) {
      return {
        success: false,
        reason: 'CRITICAL ALERT: No suitable available ambulances currently idle in network.',
        candidates: []
      };
    }

    // Calculate distances & suitability scores for every candidate
    const scoredCandidates = availableAmbulances.map(amb => {
      const distanceKm = calculateHaversineDistance(
        amb.location.latitude,
        amb.location.longitude,
        emergency.location.latitude,
        emergency.location.longitude
      );

      const etaMinutes = estimateTravelTimeMinutes(distanceKm, emergency.severity, amb.type);

      // Scoring factors:
      // Lower distance is better (+ score)
      // Equipment suitability matching:
      let suitabilityBonus = 0;
      let suitabilityExplanation = "";

      if (emergency.severity === 'Critical') {
        if (amb.type === 'Advanced Life Support') {
          suitabilityBonus = 25; // Massive preference for ALS on critical calls
          suitabilityExplanation = "Optimal match: ALS unit equipped with ICU ventilator & defibrillator.";
        } else if (amb.type === 'Basic Life Support') {
          suitabilityBonus = 5;
          suitabilityExplanation = "Sub-optimal: BLS unit available; secondary ALS rendezvous advised.";
        } else {
          suitabilityBonus = -20; // PTV is not suitable for critical calls
          suitabilityExplanation = "Not recommended: Patient Transport vehicle lacks trauma equipment.";
        }
      } else if (emergency.severity === 'High') {
        if (amb.type === 'Advanced Life Support') {
          suitabilityBonus = 20;
          suitabilityExplanation = "Strong match: Full ALS paramedic support.";
        } else if (amb.type === 'Basic Life Support') {
          suitabilityBonus = 18;
          suitabilityExplanation = "Suitable: BLS unit equipped with emergency oxygen and splints.";
        } else {
          suitabilityBonus = -10;
          suitabilityExplanation = "Low priority vehicle type for high trauma.";
        }
      } else { // Medium or Low
        if (amb.type === 'Basic Life Support' || amb.type === 'Patient Transport Vehicle') {
          suitabilityBonus = 15; // Preserve ALS for critical calls
          suitabilityExplanation = "Resource-efficient: Conserves ALS units for life-threatening emergencies.";
        } else {
          suitabilityBonus = 8;
          suitabilityExplanation = "ALS unit available, but exceeds minimum equipment requirement.";
        }
      }

      // Proximity score (closer distance = higher score)
      // Score formula: (100 - distanceKm * 3.5) + suitabilityBonus
      const proximityScore = Math.max(10, 100 - (distanceKm * 3.5));
      const compositeScore = Math.round((proximityScore + suitabilityBonus) * 10) / 10;

      return {
        ambulance: amb,
        distanceKm,
        etaMinutes,
        compositeScore,
        suitabilityExplanation
      };
    });

    // Sort descending by composite score (highest first)
    scoredCandidates.sort((a, b) => b.compositeScore - a.compositeScore);

    const topCandidate = scoredCandidates[0];

    return {
      success: true,
      emergency,
      recommended: topCandidate.ambulance,
      distanceKm: topCandidate.distanceKm,
      etaMinutes: topCandidate.etaMinutes,
      score: topCandidate.compositeScore,
      rationale: topCandidate.suitabilityExplanation,
      allCandidates: scoredCandidates
    };
  },

  /**
   * Asynchronous Dispatch Confirmation
   * Implements Promises, Async/Await, validation checks, and error boundaries.
   */
  async confirmDispatch(emergencyId, ambulanceId, operatorNotes = "Authorized via AstraResQ Command Hub") {
    // Check simulated failure condition (Demonstration requirement)
    if (this.simulationFlags.simulateNetworkFailure) {
      throw new Error("NETWORK_TIMEOUT: Command hub disconnected from telemetry gateway. Please retry.");
    }

    // Prevent race condition using assignment lock
    if (this.assignmentLocks.has(ambulanceId)) {
      throw new Error(`CONCURRENCY_ERROR: Ambulance ${ambulanceId} is currently undergoing assignment.`);
    }

    // Acquire lock
    this.assignmentLocks.add(ambulanceId);

    try {
      // Simulate real-world network negotiation latency (600ms)
      await new Promise(resolve => setTimeout(resolve, 600));

      const ambulances = StorageService.getAmbulances();
      const emergencies = StorageService.getEmergencies();
      const dispatches = StorageService.getDispatches();

      const ambulance = ambulances.find(a => a.id === ambulanceId);
      const emergency = emergencies.find(e => e.id === emergencyId);

      if (!ambulance || !emergency) {
        throw new Error("DATA_INTEGRITY_ERROR: Ambulance or Emergency record missing.");
      }

      if (ambulance.status !== 'Available') {
        throw new Error(`DISPATCH_REJECTED: Ambulance ${ambulance.id} status changed to '${ambulance.status}'.`);
      }

      if (emergency.status !== 'Pending') {
        throw new Error(`DISPATCH_REJECTED: Emergency ${emergency.id} already processed.`);
      }

      // Calculate distance and travel time
      const distanceKm = calculateHaversineDistance(
        ambulance.location.latitude,
        ambulance.location.longitude,
        emergency.location.latitude,
        emergency.location.longitude
      );
      const etaMinutes = estimateTravelTimeMinutes(distanceKm, emergency.severity, ambulance.type);

      // Create new Dispatch Record
      const newDispatch = {
        dispatchId: `DSP-${Date.now().toString().slice(-4)}`,
        emergencyId: emergency.id,
        ambulanceId: ambulance.id,
        distanceKm,
        estimatedMinutes: etaMinutes,
        dispatchedAt: new Date().toISOString(),
        completedAt: null,
        status: "In-Transit",
        notes: operatorNotes
      };

      // Mutate Records atomically
      ambulance.status = "Dispatched";
      ambulance.currentEmergency = emergency.id;

      emergency.status = "Assigned";
      emergency.assignedAmbulance = ambulance.id;
      emergency.assignedAt = new Date().toISOString();

      dispatches.unshift(newDispatch);

      // Persist to LocalStorage
      StorageService.saveAmbulances(ambulances);
      StorageService.saveEmergencies(emergencies);
      StorageService.saveDispatches(dispatches);

      // Sync Maps and Sets
      AstraDataStructures.syncStructures(ambulances, emergencies);

      // Audio & UI Feedback
      AnimationEngine.playDispatchConfirmed();
      AnimationEngine.showToast(
        "DISPATCH AUTHORIZED",
        `Ambulance ${ambulance.id} dispatched to ${emergency.location.area} (ETA ~${etaMinutes} mins).`,
        "success"
      );

      // Start dynamic vehicle movement on the Bangalore Map
      if (astraMapInstance) {
        astraMapInstance.startAmbulanceTransit(newDispatch, ambulance, emergency, (sim) => {
          this.handleAmbulanceArrival(emergency.id, ambulance.id);
        });
      }

      return {
        success: true,
        dispatch: newDispatch
      };

    } finally {
      // Release lock unconditionally
      this.assignmentLocks.delete(ambulanceId);
    }
  },

  /**
   * Handle Arrival on Scene Callback
   */
  handleAmbulanceArrival(emergencyId, ambulanceId) {
    const ambulances = StorageService.getAmbulances();
    const emergencies = StorageService.getEmergencies();

    const amb = ambulances.find(a => a.id === ambulanceId);
    const emg = emergencies.find(e => e.id === emergencyId);

    if (amb && emg) {
      amb.status = "On Scene";
      emg.status = "On Scene";
      emg.arrivedAt = new Date().toISOString();

      StorageService.saveAmbulances(ambulances);
      StorageService.saveEmergencies(emergencies);
      AstraDataStructures.syncStructures(ambulances, emergencies);

      AnimationEngine.playTone(800, 'sine', 0.2, 0.1);
      AnimationEngine.showToast(
        "AMBULANCE ON SCENE",
        `Unit ${amb.id} arrived at ${emg.location.area}. Paramedics initiating triage.`,
        "info"
      );

      if (typeof window.refreshAllUIViews === 'function') {
        window.refreshAllUIViews();
      }
    }
  },

  /**
   * Complete Emergency & Return Ambulance to Available Status
   */
  async completeEmergency(emergencyId, outcomeNotes = "Patient stabilized and admitted to nearest tertiary hospital.") {
    const ambulances = StorageService.getAmbulances();
    const emergencies = StorageService.getEmergencies();
    const dispatches = StorageService.getDispatches();

    const emg = emergencies.find(e => e.id === emergencyId);
    if (!emg) throw new Error("Emergency record not found.");

    const ambId = emg.assignedAmbulance;
    const amb = ambulances.find(a => a.id === ambId);

    const now = new Date();
    emg.status = "Resolved";
    emg.resolvedAt = now.toISOString();

    // Calculate total response time in minutes
    if (emg.reportedAt) {
      const diffMs = now.getTime() - new Date(emg.reportedAt).getTime();
      emg.responseTimeMinutes = Math.max(3, Math.round(diffMs / (60 * 1000)));
    } else {
      emg.responseTimeMinutes = 8;
    }

    if (amb) {
      amb.status = "Available";
      amb.currentEmergency = null;
      amb.totalTrips = (amb.totalTrips || 0) + 1;
      // Re-position ambulance to completed location area
      amb.location.area = emg.location.area;
      amb.location.latitude = emg.location.latitude;
      amb.location.longitude = emg.location.longitude;
    }

    const dsp = dispatches.find(d => d.emergencyId === emergencyId && d.status === "In-Transit");
    if (dsp) {
      dsp.status = "Completed";
      dsp.completedAt = now.toISOString();
      dsp.notes += ` | ${outcomeNotes}`;
    }

    StorageService.saveAmbulances(ambulances);
    StorageService.saveEmergencies(emergencies);
    StorageService.saveDispatches(dispatches);
    AstraDataStructures.syncStructures(ambulances, emergencies);

    AnimationEngine.playSuccessBeep();
    AnimationEngine.showToast(
      "INCIDENT RESOLVED",
      `Emergency ${emg.id} closed. Unit ${ambId || 'Ambulance'} restored to Available status.`,
      "success"
    );

    if (typeof window.refreshAllUIViews === 'function') {
      window.refreshAllUIViews();
    }

    return true;
  }
};
