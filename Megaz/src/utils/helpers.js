// Utility functions and helpers

export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  add(other) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
    return this;
  }

  subtract(other) {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
    return this;
  }

  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }
}

export class Transform {
  constructor() {
    this.position = new Vector3();
    this.direction = new Vector3();
    this.look = new Vector3();
    this.center = new Vector3();
    this.scale = new Vector3(1, 1, 1);
    this.rotation = 0;
  }
}

// Key input utilities
export class KeyState {
  constructor() {
    this.keys = new Set();
    this.prevKeys = new Set();
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }

  update() {
    this.prevKeys = new Set(this.keys);
  }

  isDown(keyCode) {
    return this.keys.has(keyCode);
  }

  isPressed(keyCode) {
    return this.keys.has(keyCode) && !this.prevKeys.has(keyCode);
  }

  isReleased(keyCode) {
    return !this.keys.has(keyCode) && this.prevKeys.has(keyCode);
  }
}

// Simplified version of C++ macros
export const SAFE_DELETE = (obj) => {
  if (obj && obj.destroy) {
    obj.destroy();
  }
  return null;
};

// Math utilities
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

export const lerp = (start, end, t) => {
  return start + (end - start) * t;
};

// Convert degrees to radians
export const degToRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Rectangle collision detection
export const rectCollision = (rect1, rect2) => {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
};