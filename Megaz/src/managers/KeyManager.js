/**
 * KeyManager class - equivalent to CKeyMgr in C++
 * Handles keyboard input using modern web APIs
 */
export class KeyManager {
  constructor() {
    this.keys = new Map();
    this.prevKeys = new Map();
    this.initialized = false;
    this.gamepadIndex = -1;
    
    // Key mappings for the game
    this.keyMappings = {
      // Arrow keys
      'ArrowLeft': 'LEFT',
      'ArrowRight': 'RIGHT',
      'ArrowUp': 'UP',
      'ArrowDown': 'DOWN',
      
      // Action keys
      'KeyZ': 'Z',      // Dash
      'KeyX': 'X',      // Jump
      'KeyC': 'C',      // Attack 1
      'KeyV': 'V',      // Fire attack
      'KeyO': 'O',      // Spawn (debug)
      'KeyP': 'P',      // Monster spawn (debug)
      
      // Alternative keys
      'Space': 'SPACE',
      'Enter': 'ENTER',
      'Escape': 'ESCAPE',
    };
  }

  /**
   * Initialize keyboard input handling
   */
  init() {
    this.setupEventListeners();
    this.setupGamepadSupport();
    this.initialized = true;
    console.log('KeyManager initialized');
    return true;
  }

  /**
   * Set up keyboard event listeners
   */
  setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (event) => {
      const key = this.keyMappings[event.code];
      if (key) {
        this.keys.set(key, true);
        event.preventDefault();
      }
    });

    window.addEventListener('keyup', (event) => {
      const key = this.keyMappings[event.code];
      if (key) {
        this.keys.set(key, false);
        event.preventDefault();
      }
    });

    // Handle focus events to reset keys
    window.addEventListener('blur', () => {
      this.keys.clear();
    });

    window.addEventListener('focus', () => {
      this.keys.clear();
    });
  }

  /**
   * Set up gamepad support
   */
  setupGamepadSupport() {
    window.addEventListener('gamepadconnected', (event) => {
      console.log('Gamepad connected:', event.gamepad.id);
      this.gamepadIndex = event.gamepad.index;
    });

    window.addEventListener('gamepaddisconnected', (event) => {
      console.log('Gamepad disconnected');
      this.gamepadIndex = -1;
    });
  }

  /**
   * Update input state - call this every frame
   */
  update() {
    if (!this.initialized) return;

    // Store previous frame's key states
    this.prevKeys.clear();
    for (const [key, pressed] of this.keys) {
      this.prevKeys.set(key, pressed);
    }

    // Update gamepad state
    this.updateGamepad();
  }

  /**
   * Update gamepad input
   */
  updateGamepad() {
    if (this.gamepadIndex === -1) return;

    const gamepad = navigator.getGamepads()[this.gamepadIndex];
    if (!gamepad) return;

    // D-pad and analog stick
    const threshold = 0.3;
    
    // D-pad or left stick for movement
    const leftPressed = gamepad.buttons[14]?.pressed || gamepad.axes[0] < -threshold;
    const rightPressed = gamepad.buttons[15]?.pressed || gamepad.axes[0] > threshold;
    const upPressed = gamepad.buttons[12]?.pressed || gamepad.axes[1] < -threshold;
    const downPressed = gamepad.buttons[13]?.pressed || gamepad.axes[1] > threshold;

    this.keys.set('LEFT', leftPressed);
    this.keys.set('RIGHT', rightPressed);
    this.keys.set('UP', upPressed);
    this.keys.set('DOWN', downPressed);

    // Action buttons
    this.keys.set('X', gamepad.buttons[0]?.pressed || false); // A button -> Jump
    this.keys.set('Z', gamepad.buttons[1]?.pressed || false); // B button -> Dash
    this.keys.set('C', gamepad.buttons[2]?.pressed || false); // X button -> Attack
    this.keys.set('V', gamepad.buttons[3]?.pressed || false); // Y button -> Fire
  }

  /**
   * Check if a key is currently pressed
   * @param {string} key - Key name
   * @returns {boolean} True if key is pressed
   */
  isKeyDown(key) {
    return this.keys.get(key) === true;
  }

  /**
   * Check if a key was just pressed this frame
   * @param {string} key - Key name
   * @returns {boolean} True if key was just pressed
   */
  isKeyPressed(key) {
    return this.keys.get(key) === true && this.prevKeys.get(key) !== true;
  }

  /**
   * Check if a key was just released this frame
   * @param {string} key - Key name
   * @returns {boolean} True if key was just released
   */
  isKeyReleased(key) {
    return this.keys.get(key) !== true && this.prevKeys.get(key) === true;
  }

  /**
   * Check if key is up (not pressed)
   * @param {string} key - Key name
   * @returns {boolean} True if key is not pressed
   */
  isKeyUp(key) {
    return !this.isKeyDown(key);
  }

  /**
   * Get all currently pressed keys
   * @returns {Array<string>} Array of pressed key names
   */
  getPressedKeys() {
    const pressed = [];
    for (const [key, isPressed] of this.keys) {
      if (isPressed) {
        pressed.push(key);
      }
    }
    return pressed;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.keys.clear();
    this.prevKeys.clear();
    this.initialized = false;
  }
}

// Singleton instance
let keyManagerInstance = null;

export const getKeyManager = () => {
  if (!keyManagerInstance) {
    keyManagerInstance = new KeyManager();
  }
  return keyManagerInstance;
};