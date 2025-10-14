import * as PIXI from 'pixi.js';
import { GAME_CONFIG } from '../utils/constants.js';

/**
 * Device class - equivalent to CDevice in C++
 * Manages the PIXI.js application and rendering context
 */
export class Device {
  constructor() {
    this.app = null;
    this.initialized = false;
  }

  /**
   * Initialize the PIXI application
   * @param {HTMLCanvasElement} canvas - The canvas element to render to
   * @returns {Promise<boolean>} Success status
   */
  async initDevice(canvas) {
    try {
      // Create PIXI application
      this.app = new PIXI.Application({
        view: canvas,
        width: GAME_CONFIG.WINDOW_WIDTH,
        height: GAME_CONFIG.WINDOW_HEIGHT,
        backgroundColor: 0x000000,
        antialias: false, // Pixel art style
        resolution: 1,
        autoDensity: true,
      });

      // Set up ticker for consistent frame rate
      this.app.ticker.maxFPS = GAME_CONFIG.TARGET_FPS;
      
      // Enable nearest neighbor filtering for pixel art
      PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

      this.initialized = true;
      console.log('Device initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Device:', error);
      return false;
    }
  }

  /**
   * Begin rendering frame - equivalent to RenderBegin in C++
   */
  renderBegin() {
    if (!this.initialized) return;
    // PIXI handles this automatically
  }

  /**
   * End rendering frame - equivalent to RenderEnd in C++
   */
  renderEnd() {
    if (!this.initialized) return;
    // PIXI handles this automatically
  }

  /**
   * Get the PIXI application instance
   * @returns {PIXI.Application} The PIXI app
   */
  getApp() {
    return this.app;
  }

  /**
   * Get the main stage container
   * @returns {PIXI.Container} The main stage
   */
  getStage() {
    return this.app ? this.app.stage : null;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
      this.app = null;
    }
    this.initialized = false;
  }

  /**
   * Resize the application
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    if (this.app) {
      this.app.renderer.resize(width, height);
    }
  }
}

// Singleton instance - equivalent to GET_SINGLE macro in C++
let deviceInstance = null;

export const getDevice = () => {
  if (!deviceInstance) {
    deviceInstance = new Device();
  }
  return deviceInstance;
};