# AstraResQ – Academic AI Usage Disclosure Statement

This document provides transparent disclosure of AI assistance during the architectural design, algorithmic implementation, and refinement of **AstraResQ – Intelligent Emergency Response & Ambulance Dispatch System**, in accordance with academic integrity guidelines.

---

## 1. Primary AI Prompts & Directives

The following high-level directives guided the development of this project:

1. **System Concept & Architectural Design:**
   > *"Act as a senior full-stack JavaScript architect and design an intelligent emergency dispatch system for Bangalore using modular Vanilla JavaScript ES6+, HTML5, and CSS3. Avoid all external frameworks like React, Angular, or Vue."*

2. **Mathematical Modeling (Haversine & Scoring Engine):**
   > *"Formulate the great-circle Haversine distance formula in pure JavaScript to calculate distance in kilometers between Bangalore geographic coordinates. Create a composite scoring algorithm that balances physical proximity with vehicle capabilities (Advanced Life Support vs. Basic Life Support) and triage urgency."*

3. **Motion & Simulation Graphics:**
   > *"Design an interactive HTML5 2D Canvas radar map of Bangalore with coordinate projection, road network corridors, beacon pulses, and smooth ambulance transit movement using requestAnimationFrame and linear interpolation (LERP)."*

4. **Data Structures Implementation:**
   > *"Ensure comprehensive and genuine implementation of Objects, Arrays (filter, map, reduce, sort, find, forEach), Sets (unique IDs, duplicate prevention), and Maps (ambulance-to-emergency mappings, sector statistics)."*

---

## 2. AI Suggestions & Contributions

During the ideation phase, AI proposed:
- **Web Audio API Procedural Synthesis:** Instead of relying on external `.mp3` audio files which may fail to load due to CORS or file-path issues in offline classroom environments, synthesize siren pulses and dispatch confirmation chimes procedurally using `AudioContext` oscillators.
- **Race Condition Prevention:** Utilize an in-memory `assignmentLocks` Set to ensure an ambulance cannot be concurrently dispatched by simultaneous operator clicks.
- **Controlled Failure Simulation:** Include a toggle switch in the UI allowing academic examiners to intentionally trigger network timeouts to observe `try...catch...finally` exception handling in real time.
- **Dual Theme Support:** Use CSS Custom Properties (`--bg-primary`, `--bg-card`, etc.) to enable seamless switching between Black Mode (`#080808`) and White Mode (`#FFFFFF`) while dynamically updating Chart.js palette colors on the fly.

---

## 3. Limitations Identified in AI Prototypes

During initial code generation, the following limitations were identified and addressed:
1. **Hardcoded Analytical Metrics:** Early drafts contained static numbers for the bottleneck detector. This was rejected and refactored into a dynamic aggregation pipeline that inspects live emergency and dispatch arrays using JavaScript `Map` and `reduce()`.
2. **Generic Layout:** Standard Bootstrap-style layouts looked like generic admin templates. This was replaced with a custom CSS design system featuring futuristic command hub typography (*Rajdhani*, *JetBrains Mono*), radar sweeps, and glowing status borders.
3. **Map Coordinate Projection:** Standard Cartesian canvas coordinates distorted latitude and longitude distances. A custom bounding box projection algorithm was implemented to scale Bangalore coordinates ($12.825^\circ\text{N} - 13.065^\circ\text{N}$, $77.515^\circ\text{E} - 77.780^\circ\text{E}$) accurately onto canvas pixels.

---

## 4. Manual Refinements & Modifications

The student/developer performed the following manual interventions:
- **Bangalore Sector Modeling:** Curated accurate geographic coordinates and traffic nodes for 12 key Bangalore areas (Koramangala, Indiranagar, Whitefield, Electronic City, Jayanagar, Hebbal, Marathahalli, MG Road, Malleshwaram, HSR Layout, Banashankari, Rajajinagar).
- **Clinical Triage Logic:** Tuned the vehicle assignment heuristic so that **Critical** emergencies (cardiac arrests, acute strokes) receive a $+25$ match score bonus when paired with **Advanced Life Support (ALS)** units with ventilators, while penalizing Patient Transport Vehicles (PTVs) by $-20$.
- **Graceful LocalStorage Recovery:** Wrapped all `localStorage.getItem` and `localStorage.setItem` calls inside a resilient `StorageService` that safely falls back to default seed data if corrupted JSON or browser storage quotas are encountered.
- **Accessibility & Motion Preference:** Integrated `window.matchMedia('(prefers-reduced-motion: reduce)')` checks to disable animations automatically for users with motion sensitivity.

---

## 5. Defense Readiness & Code Comprehension

The student is prepared to demonstrate and explain:
- Every line of the Haversine mathematical implementation.
- How the canvas render loop manages coordinate interpolation across animation frames.
- How higher-order array methods (`reduce`, `filter`, `map`) drive both the KPI counters and Chart.js datasets.
- The exact lifecycle of an asynchronous dispatch promise from initiation to resolution.
