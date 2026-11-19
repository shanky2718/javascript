/**
 * AstraResQ - LocalStorage Persistence Layer
 * Academic Demonstration: Resilient Web Storage, Serialization & Error Handling
 */

const STORAGE_KEYS = {
  THEME: "astraresq_theme",
  SOUND_ENABLED: "astraresq_sound_enabled",
  AMBULANCES: "astraresq_ambulances_data",
  EMERGENCIES: "astraresq_emergencies_data",
  DISPATCHES: "astraresq_dispatches_data",
  NOTIFICATIONS: "astraresq_notifications_data",
  HAS_SEEDED: "astraresq_seeded_v1"
};

const StorageService = {
  /**
   * Safe JSON parse with try/catch fallback
   */
  safeGet(key, fallbackValue) {
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === undefined || item === "undefined") {
        return fallbackValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.warn(`[StorageService] Corrupted data encountered for key "${key}". Restoring fallback.`, error);
      return fallbackValue;
    }
  },

  /**
   * Safe JSON write with quota and exception handling
   */
  safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[StorageService] Failed to persist key "${key}" to LocalStorage:`, error);
      return false;
    }
  },

  /**
   * Initialize or verify stored collections
   */
  initStorage() {
    try {
      const hasSeeded = localStorage.getItem(STORAGE_KEYS.HAS_SEEDED);
      if (!hasSeeded) {
        this.resetToDefaults();
      } else {
        // Validate that essential keys exist and are arrays
        const amb = this.safeGet(STORAGE_KEYS.AMBULANCES, null);
        const emg = this.safeGet(STORAGE_KEYS.EMERGENCIES, null);
        const dsp = this.safeGet(STORAGE_KEYS.DISPATCHES, null);

        if (!Array.isArray(amb) || !Array.isArray(emg) || !Array.isArray(dsp)) {
          console.warn("[StorageService] Incomplete data structures found. Re-seeding storage.");
          this.resetToDefaults();
        }
      }
    } catch (e) {
      console.error("[StorageService] Initialization error:", e);
      this.resetToDefaults();
    }
  },

  /**
   * Reset demonstration data back to initial seeds
   */
  resetToDefaults() {
    this.safeSet(STORAGE_KEYS.AMBULANCES, INITIAL_AMBULANCES);
    this.safeSet(STORAGE_KEYS.EMERGENCIES, INITIAL_EMERGENCIES);
    this.safeSet(STORAGE_KEYS.DISPATCHES, INITIAL_DISPATCHES);
    this.safeSet(STORAGE_KEYS.NOTIFICATIONS, [
      {
        id: "NTF-01",
        title: "System Online",
        message: "AstraResQ Command Centre initialized in standby monitoring mode.",
        type: "info",
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: "NTF-02",
        title: "Active Incident Assigned",
        message: "AMB-107 en route to Marathahalli road accident.",
        type: "warning",
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        read: false
      }
    ]);
    
    if (localStorage.getItem(STORAGE_KEYS.THEME) === null) {
      this.safeSet(STORAGE_KEYS.THEME, "black");
    }
    if (localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) === null) {
      this.safeSet(STORAGE_KEYS.SOUND_ENABLED, false); // Disabled by default as required
    }

    localStorage.setItem(STORAGE_KEYS.HAS_SEEDED, "true");
    console.log("[StorageService] Application seeded with demonstration data.");
  },

  // Ambulances
  getAmbulances() {
    return this.safeGet(STORAGE_KEYS.AMBULANCES, INITIAL_AMBULANCES);
  },
  saveAmbulances(ambulances) {
    return this.safeSet(STORAGE_KEYS.AMBULANCES, ambulances);
  },

  // Emergencies
  getEmergencies() {
    return this.safeGet(STORAGE_KEYS.EMERGENCIES, INITIAL_EMERGENCIES);
  },
  saveEmergencies(emergencies) {
    return this.safeSet(STORAGE_KEYS.EMERGENCIES, emergencies);
  },

  // Dispatches
  getDispatches() {
    return this.safeGet(STORAGE_KEYS.DISPATCHES, INITIAL_DISPATCHES);
  },
  saveDispatches(dispatches) {
    return this.safeSet(STORAGE_KEYS.DISPATCHES, dispatches);
  },

  // Notifications
  getNotifications() {
    return this.safeGet(STORAGE_KEYS.NOTIFICATIONS, []);
  },
  saveNotifications(notifications) {
    return this.safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  // Theme
  getTheme() {
    return this.safeGet(STORAGE_KEYS.THEME, "black");
  },
  saveTheme(theme) {
    return this.safeSet(STORAGE_KEYS.THEME, theme);
  },

  // Audio mute/unmute
  getSoundEnabled() {
    return this.safeGet(STORAGE_KEYS.SOUND_ENABLED, false);
  },
  saveSoundEnabled(enabled) {
    return this.safeSet(STORAGE_KEYS.SOUND_ENABLED, !!enabled);
  }
};
