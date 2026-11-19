# AstraResQ – Intelligent Emergency Response & Ambulance Dispatch System

![AstraResQ System](https://img.shields.io/badge/System-AstraResQ%20v2.4-ef4444?style=for-the-badge)
![Architecture](https://img.shields.io/badge/Architecture-Vanilla%20JS%20ES6+-10b981?style=for-the-badge)
![Status](https://img.shields.io/badge/Academic-Demonstration%20Ready-3b82f6?style=for-the-badge)

> **Academic Simulation Disclaimer:** AstraResQ is an educational simulator for algorithmic dispatch and resource planning using simulated Bangalore geographic models. It does not interface with or reflect real-world 108/112 ambulance services or live GPS beacons.

---

## 1. Project Introduction

**AstraResQ** is a high-performance web-based command operations platform designed to simulate modern metropolitan emergency medical services (EMS). The system pairs a high-contrast operations dashboard with an intelligent dispatch engine that pairs emergency victims with optimal life-support units using real-time mathematical calculations, equipment-urgency matching, and predictive bottleneck analysis.

Designed with an aesthetic inspired by military aerospace operations and smart-city dispatch command rooms, AstraResQ operates natively in both **Black Mode** (`#080808`) and **White Mode** (`#FFFFFF`), providing dispatch officers with situational clarity, interactive Bangalore transit simulations, and live visual telemetry.

---

## 2. Problem Statement

Emergency Medical Services in expanding metropolises face four chronic operational vulnerabilities:
1. **Inefficient Dispatch Allocation:** Dispatchers manually matching ambulances frequently assign vehicles based solely on base locations, ignoring real-time transit distance or clinical equipment matching (e.g., assigning a basic transport vehicle to a patient suffering acute myocardial infarction).
2. **Golden-Hour Delays:** Inability to project arrival times (ETA) accurately through high-density urban corridors results in lost minutes during acute trauma and stroke events.
3. **Double Assignment & Race Conditions:** Concurrent dispatches by multiple operators can cause conflicting vehicle commitments.
4. **Unidentified Regional Hotspots:** Dispatch logs are rarely synthesized in real time, preventing emergency planners from pre-positioning ambulances in areas experiencing recurring cardiac or road accident spikes.

---

## 3. Project Objectives

- **Automated Recommendation:** Implement the **Haversine great-circle distance algorithm** combined with equipment-suitability scoring to recommend the best vehicle in milliseconds.
- **Visual Transit Simulation:** Render an interactive simulated canvas map of Bangalore with real-time vector movement, moving vehicles along arterial corridors with live distance and ETA telemetry.
- **Original Intelligent Enhancement:** Develop the **Smart Emergency Bottleneck Detector** to isolate systemic latency and recommend strategic vehicle re-positioning.
- **Academic Rubric Compliance:** Demonstrate exhaustive, genuine implementation of pure JavaScript ES6+ features—Objects, Arrays, Sets, Maps, Promises, async/await, DOM event delegation, Web Audio API synthesis, and LocalStorage persistence.

---

## 4. Technology Stack

- **Markup & Layout:** HTML5 Semantic Architecture (ARIA accessible, role dialogs, landmark regions).
- **Styling:** CSS3 Custom Properties (Design Tokens), Flexbox, CSS Grid, Hardware-accelerated CSS Keyframe animations.
- **Scripting:** Pure Vanilla JavaScript (ES6+), Object-Oriented and Functional paradigms (no React/Angular/Vue).
- **Visualization:** [Chart.js 4.4.x](https://www.chartjs.org/) for responsive charts (Doughnut, Polar Area, Bar, Line).
- **Icons & Typography:** Font Awesome 6.5.1, Google Fonts (*Inter*, *Rajdhani*, *JetBrains Mono*).
- **Sound Generation:** Native Web Audio API Synthesizer (Zero MP3 audio files; pure procedural waveform synthesis).
- **Storage:** LocalStorage with fault-tolerant JSON serialization, schema migration, and seed restoration.

---

## 5. Application Modules

```
astraresq/
├── index.html                  # Master Single Page Application structure & modal definitions
├── css/
│   └── style.css               # Futuristic Command Center styles, tokens, and animations
├── js/
│   ├── data.js                 # Bangalore coordinates, seed records, Sets, Maps & Haversine formula
│   ├── storage.js              # Resilient LocalStorage persistence layer with fallback recovery
│   ├── animations.js           # Web Audio API synthesizer, counters, toasts, and intro splash
│   ├── map.js                  # Canvas 2D Bangalore radar grid, coordinate projection, LERP movement
│   ├── dispatch.js             # Scoring engine, async dispatch confirmation, concurrency locks
│   ├── analytics.js            # Smart Bottleneck Detector and Chart.js theme-aware rendering
│   └── app.js                  # Master orchestrator, view routing, forms, and test scenario harness
├── assets/                     # Application assets directory
├── README.md                   # Comprehensive technical documentation
└── AI_USAGE.md                 # Academic AI transparency disclosure log
```

### Module Roles:
1. **Command Dashboard (`#view-dashboard`):** Real-time KPI counters (animated from zero), active incident queue with triage color bands, fleet status matrix, and real-time activity log.
2. **Live Dispatch Center (`#view-dispatch`):** 3-panel command setup containing the Left Queue Panel, Center Bangalore Canvas Map, and Right Decision Engine Console.
3. **Emergency Intake (`#view-emergencies`):** Interactive reporting module with strict input validation, Bangalore coordinate auto-filling, duplicate detection via Sets, and priority classification.
4. **Ambulance Fleet (`#view-ambulances`):** Registry of Advanced Life Support (ALS), Basic Life Support (BLS), and Patient Transport (PTV) units with status overrides and station reallocation.
5. **Analytics & Bottleneck Hub (`#view-analytics`):** Dynamic intelligence insights identifying demand spikes and 6 interactive Chart.js graphs reflecting live system state.

---

## 6. Data Modelling

### Ambulance Object Schema
```javascript
{
  id: "AMB-101",
  vehicleNumber: "KA-01-EA-1011",
  driverName: "Rajesh Kumar",
  driverPhone: "+91 98450 12345",
  type: "Advanced Life Support", // "Advanced Life Support" | "Basic Life Support" | "Patient Transport Vehicle"
  equipment: ["Ventilator", "Defibrillator", "Oxygen", "Multipara Monitor"],
  location: {
    area: "Koramangala",
    latitude: 12.9352,
    longitude: 77.6245
  },
  status: "Available", // "Available" | "Dispatched" | "On Scene" | "Returning" | "Maintenance"
  currentEmergency: null,
  totalTrips: 18,
  fuelLevel: 88,
  speedKmH: 0
}
```

### Emergency Incident Object Schema
```javascript
{
  id: "EMG-8001",
  patientName: "Arunachalam Verma",
  contactNumber: "+91 98765 11001",
  type: "Cardiac Emergency", // "Cardiac Emergency" | "Road Accident" | "Stroke" | "Fire Injury" | "Medical Emergency" | "Other"
  severity: "Critical",       // "Critical" | "High" | "Medium" | "Low"
  location: {
    area: "Koramangala",
    latitude: 12.9352,
    longitude: 77.6245,
    landmark: "Near Forum Mall 7th Block"
  },
  description: "Acute chest pain, severe diaphoresis, unconscious on floor.",
  status: "Pending",          // "Pending" | "Assigned" | "On Scene" | "Resolved"
  assignedAmbulance: null,
  reportedAt: "2026-11-19T02:22:19.000Z",
  assignedAt: null,
  arrivedAt: null,
  resolvedAt: null,
  responseTimeMinutes: null
}
```

---

## 7. JavaScript Data Structures (Academic Evaluation Criteria)

AstraResQ avoids trivial declarations; all data structures perform essential functions:

### Objects
Used to encapsulate domain entities (`Ambulance`, `Emergency`, `DispatchRecord`, `SimulationState`, and `StorageService`).

### Arrays
Collections of entities are manipulated using higher-order functional methods:
- `.filter()`: Filters idle units (`amb.status === 'Available'`), isolates active critical calls, and applies user search parameters.
- `.map()`: Transforms raw ambulances into scored candidate objects containing distance, ETA, and composite scores.
- `.reduce()`: Computes total response times across resolved incidents to produce fleet average response metrics and groups area incident frequencies.
- `.sort()`: Arranges dispatch queues by clinical priority (`Critical` > `High` > `Medium` > `Low`) and ranks vehicle suitability descending.
- `.find()`: Pinpoints unique vehicles and emergency records by identifier.
- `.forEach()`: Iterates through coordinate nodes to render Bangalore arterial road links.

### Sets
- `registeredEmergencyIds` (`Set`): Enforces global uniqueness of incident records.
- `registeredAreas` (`Set`): Maintains canonical list of validated Bangalore sector nodes.
- `activeAssignedAmbulances` (`Set`): Atomic tracking of units committed to incidents, preventing duplicate dispatch attempts.
- `assignmentLocks` (`Set`): Concurrency lock container preventing race conditions.

### Maps
- `ambulanceToEmergencyMap` (`Map`): Direct $O(1)$ key-value linkage between vehicles and assigned calls.
- `areaDemandMap` (`Map`): Aggregates historical incident statistics per sector (total reports, critical tallies, cumulative response minutes).
- `ambulanceUtilisationMap` (`Map`): Tracks mileage, completed trips, and active run-time per unit.

---

## 8. Event Handling Architecture

The application uses an event-driven architecture with clean delegation:
- **Navigation & Routing:** Dynamic view switching via `data-view` attributes without browser reloads.
- **Interactive Forms:** Form submission listeners with multi-stage input validation preventing invalid or incomplete records.
- **Real-Time Search & Filtering:** Dynamic input listeners on search bars and drop-downs that re-render tables instantly.
- **Theme Switching:** Instant toggle between Black and White modes with immediate chart recoloring.
- **Audio Control:** Toggle button controlling Web Audio API state.
- **Map Interaction:** Canvas `mousedown`, `mousemove`, `mouseup`, `wheel`, and `click` listeners supporting panning, zooming, and marker inspection.

---

## 9. Asynchronous Programming

Asynchronous paradigms are integrated into the core dispatch lifecycle:
1. **Network Simulation:** `DispatchEngine.confirmDispatch()` simulates network handshake latency using `await new Promise(resolve => setTimeout(resolve, 600))`.
2. **Animation Loop:** `BangaloreSimulationMap.startRenderLoop()` utilizes `requestAnimationFrame()` for 60 FPS coordinate interpolation, radar sweeps, and telemetry computations.
3. **Controlled Failure Simulation:** A toggle switch in the UI allows examiners to simulate network dropouts, testing `try...catch...finally` exception boundaries and user retry feedback.

---

## 10. Intelligent Enhancement: Smart Emergency Bottleneck Detector

Located in the **Analytics & Bottlenecks** module, this algorithm analyses all historical dispatches and active calls to identify systemic weaknesses:
- **Hotspot Identification:** Detects sectors where call volume exceeds statistical thresholds.
- **Critical Vulnerability Index:** Flags areas with high critical incident frequencies where stationed ALS ambulances are deficient (e.g., Koramangala with 4 critical calls but only 1 nearby unit).
- **Latency Diagnostics:** Flags corridors where average response time exceeds the national SLA benchmark of 8 minutes.
- **Automated Recommendations:** Dynamically generates tactical resource allocation advice (e.g., *"Re-allocate at least 1 dedicated ALS unit permanently to Koramangala"*).

---

## 11. How to Run the Application

Because AstraResQ is built using standard Vanilla JavaScript (ES6+), it requires no build tools or package managers:

1. Clone or extract the repository folder:
   ```
   astraresq/
   ```
2. Open using any static HTTP development server (e.g., Python, Node, or VS Code Live Server):
   ```bash
   # Using Python 3:
   cd astraresq
   python -m http.server 8000
   ```
   *Alternatively, open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari).*
3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

---

## 12. Academic Demonstration Workflow (Examiner Walkthrough)

Follow this 5-minute walkthrough to verify every evaluation requirement:

1. **Cinematic Intro:** Observe the radar boot sequence and emergency pulse (or click *"Skip Intro"*).
2. **Theme Switching:** Click the **Sun/Moon** icon in the top header to switch between Black and White modes. Verify that canvas backgrounds, tables, cards, and charts adjust instantly.
3. **Sound Activation:** Click the **Volume** icon in the header to unmute procedural audio chimes.
4. **Inject Critical Incident:** Click the **"Quick Test: Critical Call"** button in the header. Notice the instant toast alert and automated transition into the **Live Dispatch Center**.
5. **Review Recommendation:** In the Right Console, observe the automated AI recommendation:
   - Composite match score (e.g., 94/100).
   - Haversine distance in km and estimated ETA.
   - Clinical equipment matching rationale.
6. **Authorize Dispatch:** Click **"AUTHORIZE DISPATCH"**:
   - Hear the procedural confirmation chime.
   - Observe the ambulance marker on the Bangalore map move in real time along the transit corridor.
   - Watch live telemetry updates (remaining distance, speed, ETA) inside the HUD.
7. **Simulate Failure Boundary:** Check the **"Simulate Network Timeout"** switch in the top right, select another pending incident, and attempt dispatch. Observe the red error toast and retry capability. Uncheck the switch to restore normal operation.
8. **Incident Completion:** When the moving ambulance arrives on scene, click **"Complete Incident & Return Unit"**. Observe the unit return to `Available` status and log to history.
9. **Inspect Bottleneck Detector:** Click **Bottleneck & Analytics** in the sidebar. Review the dynamically generated bottleneck cards and interactive Chart.js graphs.
10. **Reset Demo Data:** Click **"Reset Demo Data"** in the sidebar footer to restore default baseline seeds at any time.

---

## 13. Limitations & Future Roadmap

- **Simulated Coordinates:** Uses Bangalore landmark coordinates with Euclidean and Haversine road projections rather than live GIS vector layers.
- **Single-tenant Storage:** Uses LocalStorage; enterprise deployments would connect to a distributed PostgreSQL/PostGIS database via WebSockets.
- **Future Enhancements:** Integration with real-time OpenStreetMap/Leaflet tiles and integration with hospital emergency department bed availability APIs.
