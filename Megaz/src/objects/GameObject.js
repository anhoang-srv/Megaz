import * as PIXI from 'pixi.js';
import { Transform } from '../utils/helpers.js';

/**
 * Base Object class - equivalent to CObj in C++
 * All game objects inherit from this class
 */
export class GameObject {
  constructor() {
    this.transform = new Transform();
    this.sprite = null;
    this.sortID = 0;
    this.visible = true;
    this.active = true;
    this.destroyed = false;
    
    // Animation properties
    this.frameIndex = 0;
    this.frameSpeed = 0;
    this.frameTime = 0;
    this.maxFrames = 1;
    
    // Physics properties
    this.velocity = { x: 0, y: 0 };
    this.speed = 0;
    
    // Collision properties
    this.collisionBox = { x: 0, y: 0, width: 0, height: 0 };
    this.collisionEnabled = false;
  }

  /**
   * Initialize the object - must be implemented by subclasses
   * @returns {boolean} Success status
   */
  initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Update the object - called every frame
   * @param {number} deltaTime - Time since last frame
   * @returns {boolean} Success status
   */
  update(deltaTime) {
    if (!this.active || this.destroyed) return true;

    // Update animation
    this.updateAnimation(deltaTime);
    
    // Update physics
    this.updatePhysics(deltaTime);
    
    // Update collision box
    this.updateCollisionBox();

    return true;
  }

  /**
   * Render the object
   * @returns {boolean} Success status
   */
  render() {
    if (!this.visible || this.destroyed || !this.sprite) return true;

    // Update sprite transform
    this.sprite.x = this.transform.position.x;
    this.sprite.y = this.transform.position.y;
    this.sprite.scale.x = this.transform.scale.x;
    this.sprite.scale.y = this.transform.scale.y;
    this.sprite.rotation = this.transform.rotation;
    this.sprite.visible = this.visible;

    return true;
  }

  /**
   * Update animation frame
   * @param {number} deltaTime - Time since last frame
   */
  updateAnimation(deltaTime) {
    if (this.frameSpeed <= 0 || this.maxFrames <= 1) return;

    this.frameTime += this.frameSpeed * deltaTime;
    
    if (this.frameTime >= 1.0) {
      this.frameIndex = (this.frameIndex + 1) % this.maxFrames;
      this.frameTime = 0;
    }
  }

  /**
   * Update physics
   * @param {number} deltaTime - Time since last frame
   */
  updatePhysics(deltaTime) {
    this.transform.position.x += this.velocity.x * deltaTime;
    this.transform.position.y += this.velocity.y * deltaTime;
  }

  /**
   * Update collision box based on current position
   */
  updateCollisionBox() {
    if (!this.collisionEnabled || !this.sprite) return;

    this.collisionBox.x = this.transform.position.x - (this.sprite.width / 2);
    this.collisionBox.y = this.transform.position.y - this.sprite.height;
    this.collisionBox.width = this.sprite.width;
    this.collisionBox.height = this.sprite.height;
  }

  /**
   * Get the sort ID for layer management
   * @returns {number} Sort ID
   */
  getSortID() {
    return this.sortID;
  }

  /**
   * Set the sort ID
   * @param {number} id - Sort ID
   */
  setSortID(id) {
    this.sortID = id;
  }

  /**
   * Get collision box
   * @returns {Object} Collision box {x, y, width, height}
   */
  getCollisionBox() {
    return this.collisionBox;
  }

  /**
   * Check collision with another object
   * @param {GameObject} other - Other object to check collision with
   * @returns {boolean} True if objects are colliding
   */
  checkCollision(other) {
    if (!this.collisionEnabled || !other.collisionEnabled) return false;

    const box1 = this.getCollisionBox();
    const box2 = other.getCollisionBox();

    return box1.x < box2.x + box2.width &&
           box1.x + box1.width > box2.x &&
           box1.y < box2.y + box2.height &&
           box1.y + box1.height > box2.y;
  }

  /**
   * Set position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPosition(x, y) {
    this.transform.position.x = x;
    this.transform.position.y = y;
  }

  /**
   * Get position
   * @returns {Object} Position {x, y}
   */
  getPosition() {
    return {
      x: this.transform.position.x,
      y: this.transform.position.y
    };
  }

  /**
   * Set visibility
   * @param {boolean} visible - Visibility state
   */
  setVisible(visible) {
    this.visible = visible;
    if (this.sprite) {
      this.sprite.visible = visible;
    }
  }

  /**
   * Mark object for destruction
   */
  destroy() {
    this.destroyed = true;
    this.active = false;
    
    if (this.sprite) {
      if (this.sprite.parent) {
        this.sprite.parent.removeChild(this.sprite);
      }
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  /**
   * Check if object is destroyed
   * @returns {boolean} True if destroyed
   */
  isDestroyed() {
    return this.destroyed;
  }

  /**
   * Cleanup resources - called when object is removed
   */
  release() {
    this.destroy();
  }
}