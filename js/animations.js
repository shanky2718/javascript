/**
 * AstraResQ - Cinematic Animations, Sound Synthesizer & UI Motion Engine
 * Academic Demonstration: CSS Animations, Web Audio API, DOM Transitions, and Accessibility
 */

const AnimationEngine = {
  audioCtx: null,
  isAudioInitialized: false,

  /**
   * Check if reduced motion is requested by user OS
   */
  prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Synthesize audio beeps & chimes via Web Audio API (Zero external MP3 dependencies)
   */
  initAudio() {
    if (!this.isAudioInitialized) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioCtx = new AudioContext();
          this.isAudioInitialized = true;
        }
      } catch (e) {
        console.warn("[AnimationEngine] Web Audio API not supported:", e);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  },

  playTone(frequency, type = 'sine', duration = 0.15, volume = 0.08) {
    if (!StorageService.getSoundEnabled()) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (err) {
      // Audio playback safety catch
    }
  },

  playEmergencySiren() {
    if (!StorageService.getSoundEnabled()) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.25);
      osc.frequency.linearRampToValueAtTime(440, now + 0.5);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {}
  },

  playDispatchConfirmed() {
    this.playTone(523.25, 'triangle', 0.12, 0.08); // C5
    setTimeout(() => this.playTone(659.25, 'triangle', 0.15, 0.09), 120); // E5
    setTimeout(() => this.playTone(783.99, 'triangle', 0.25, 0.10), 250); // G5
  },

  playSuccessBeep() {
    this.playTone(587.33, 'sine', 0.12, 0.07);
    setTimeout(() => this.playTone(880, 'sine', 0.20, 0.08), 110);
  },

  playWarningBeep() {
    this.playTone(330, 'square', 0.15, 0.05);
    setTimeout(() => this.playTone(280, 'square', 0.20, 0.06), 140);
  },

  playClick() {
    this.playTone(900, 'sine', 0.03, 0.02);
  },

  /**
   * Animated numeric counter from startVal to endVal
   * Academic Requirement: Smooth stats counting
   */
  animateCounter(element, startVal, endVal, duration = 1000, suffix = "") {
    if (!element) return;
    if (this.prefersReducedMotion() || duration <= 0) {
      element.textContent = `${endVal}${suffix}`;
      return;
    }

    const startTime = performance.now();
    const diff = endVal - startVal;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic: 1 - pow(1 - x, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.floor(startVal + diff * easeProgress);

      element.textContent = `${currentVal}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = `${endVal}${suffix}`;
      }
    };

    requestAnimationFrame(step);
  },

  /**
   * Toast notification system
   */
  showToast(title, message, type = 'info', durationMs = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-card toast-${type} animate-slide-in`;

    const iconMap = {
      critical: 'fa-triangle-exclamation',
      warning: 'fa-circle-exclamation',
      success: 'fa-circle-check',
      info: 'fa-bell'
    };
    const icon = iconMap[type] || 'fa-info-circle';

    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${icon}"></i></div>
      <div class="toast-body">
        <h4 class="toast-title">${title}</h4>
        <p class="toast-message">${message}</p>
      </div>
      <button class="toast-close" aria-label="Close Notification">&times;</button>
    `;

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.dismissToast(toast);
    });

    container.appendChild(toast);

    // Audio cue
    if (type === 'critical') this.playEmergencySiren();
    else if (type === 'warning') this.playWarningBeep();
    else if (type === 'success') this.playSuccessBeep();
    else this.playTone(700, 'sine', 0.08, 0.04);

    // Auto dismiss
    if (durationMs > 0) {
      setTimeout(() => {
        this.dismissToast(toast);
      }, durationMs);
    }
  },

  dismissToast(toast) {
    if (!toast || toast.classList.contains('toast-fading')) return;
    toast.classList.add('toast-fading');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 350);
  },

  /**
   * Intro Splash Controller
   */
  initIntroSplash() {
    const splash = document.getElementById('intro-splash');
    const skipBtn = document.getElementById('skip-intro-btn');
    if (!splash) return;

    const hideSplash = () => {
      splash.classList.add('splash-fade-out');
      setTimeout(() => {
        splash.style.display = 'none';
      }, 700);
    };

    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideSplash();
      });
    }

    // Auto dismiss after 2.8 seconds
    const timer = setTimeout(hideSplash, 2800);
    splash.addEventListener('click', () => {
      clearTimeout(timer);
      hideSplash();
    });
  },

  /**
   * Attach button ripple effect
   */
  initRipples() {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.btn-ripple, .btn-primary, .btn-secondary, .btn-danger');
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const circle = document.createElement('span');
      const diameter = Math.max(rect.width, rect.height);
      const radius = diameter / 2;

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.classList.add('ripple');

      const existingRipple = button.querySelector('.ripple');
      if (existingRipple) {
        existingRipple.remove();
      }

      button.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  }
};
