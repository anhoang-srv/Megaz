/**
 * TimeManager class - equivalent to CTimeMgr in C++
 * Manages game timing and delta time calculations
 */
export class TimeManager {
  constructor() {
    this.lastTime = 0;
    this.currentTime = 0;
    this.deltaTime = 0;
    this.frameTime = 0;
    this.initialized = false;
  }

  /**
   * Initialize the time manager
   */
  initTimeMgr() {
    this.lastTime = performance.now();
    this.currentTime = this.lastTime;
    this.frameTime = this.lastTime;
    this.initialized = true;
  }

  /**
   * Update time calculations - called every frame
   * Equivalent to SetTime() in C++
   */
  setTime() {
    if (!this.initialized) return;

    this.currentTime = performance.now();
    this.deltaTime = (this.currentTime - this.lastTime) / 1000.0; // Convert to seconds
    this.lastTime = this.currentTime;

    // Clamp delta time to prevent large jumps
    if (this.deltaTime > 0.05) { // Max 50ms
      this.deltaTime = 0.05;
    }
  }

  /**
   * Get delta time in seconds
   * @returns {number} Delta time since last frame
   */
  getTime() {
    return this.deltaTime;
  }

  /**
   * Get current timestamp
   * @returns {number} Current time in milliseconds
   */
  getCurrentTime() {
    return this.currentTime;
  }

  /**
   * Get FPS based on current delta time
   * @returns {number} Current FPS
   */
  getFPS() {
    return this.deltaTime > 0 ? 1.0 / this.deltaTime : 0;
  }
}

// Singleton instance
let timeManagerInstance = null;

export const getTimeManager = () => {
  if (!timeManagerInstance) {
    timeManagerInstance = new TimeManager();
  }
  return timeManagerInstance;
};