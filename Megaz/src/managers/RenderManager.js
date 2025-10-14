import * as PIXI from 'pixi.js';
import { RENDER_TYPE } from '../utils/constants.js';
import { getTimeManager } from './TimeManager.js';

/**
 * RenderManager class - equivalent to CRenderMgr in C++
 * Handles sprite rendering with various effects
 */
export class RenderManager {
  constructor() {
    this.app = null;
    this.fadeState = {
      FADE_IN: 1,
      FADE_OUT: 2,
      FADE_DONE: 3
    };
    this.currentFadeState = this.fadeState.FADE_DONE;
    this.fadeAlpha = 0;
    this.initialized = false;
  }

  /**
   * Initialize the render manager
   * @param {PIXI.Application} app - PIXI application instance
   */
  init(app) {
    this.app = app;
    this.initialized = true;
    console.log('RenderManager initialized');
  }

  /**
   * Get the PIXI application instance
   * @returns {PIXI.Application} PIXI app
   */
  getApp() {
    return this.app;
  }

  /**
   * Render a single texture - equivalent to SingleRender in C++
   * @param {PIXI.Texture} texture - Texture to render
   * @param {Object} transform - Transform data {position, scale, rotation}
   * @param {Object} center - Center point for rendering
   * @param {number} renderType - Render type (STRAIGHT, FLASH, FADING)
   * @param {Object} sourceRect - Source rectangle for texture clipping
   * @param {number} alpha - Alpha value (0-1)
   * @returns {PIXI.Sprite} Created sprite
   */
  renderSingle(texture, transform, center = {x: 0, y: 0}, renderType = RENDER_TYPE.STRAIGHT, sourceRect = null, alpha = 1.0) {
    if (!this.initialized || !texture) return null;

    let sprite;

    // Handle source rectangle for sprite sheet frames
    if (sourceRect) {
      const rect = new PIXI.Rectangle(sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
      const clippedTexture = new PIXI.Texture(texture.baseTexture, rect);
      sprite = new PIXI.Sprite(clippedTexture);
    } else {
      sprite = new PIXI.Sprite(texture);
    }

    // Set transform
    if (transform.position) {
      sprite.x = transform.position.x;
      sprite.y = transform.position.y;
    }

    if (transform.scale) {
      sprite.scale.x = transform.scale.x || 1;
      sprite.scale.y = transform.scale.y || 1;
    }

    if (transform.rotation !== undefined) {
      sprite.rotation = transform.rotation;
    }

    // Set anchor point
    sprite.anchor.x = center.x / sprite.width || 0.5;
    sprite.anchor.y = center.y / sprite.height || 1.0;

    // Apply render effects
    switch (renderType) {
      case RENDER_TYPE.STRAIGHT:
        sprite.alpha = alpha;
        break;
      
      case RENDER_TYPE.FLASH:
        // Flash effect - invert colors or apply tint
        sprite.tint = 0x000000; // Black tint for flash effect
        sprite.alpha = alpha;
        break;
      
      case RENDER_TYPE.FADING:
        this.applyFadeEffect(sprite);
        break;
    }

    return sprite;
  }

  /**
   * Render multiple frames (animation) - equivalent to MultiRender in C++
   * @param {Array<PIXI.Texture>} textures - Array of textures for animation
   * @param {Object} transform - Transform data
   * @param {number} frameIndex - Current frame index
   * @param {number} renderType - Render type
   * @returns {PIXI.Sprite} Created sprite
   */
  renderMulti(textures, transform, frameIndex = 0, renderType = RENDER_TYPE.STRAIGHT) {
    if (!this.initialized || !textures || textures.length === 0) return null;

    const currentTexture = textures[frameIndex % textures.length];
    return this.renderSingle(currentTexture, transform, {x: 0, y: 0}, renderType);
  }

  /**
   * Apply fade effect to sprite
   * @param {PIXI.Sprite} sprite - Sprite to apply effect to
   */
  applyFadeEffect(sprite) {
    const timeManager = getTimeManager();
    const deltaTime = timeManager.getTime();
    const fadeSpeed = 100;

    switch (this.currentFadeState) {
      case this.fadeState.FADE_IN:
        if (this.fadeAlpha < 255) {
          this.fadeAlpha += fadeSpeed * deltaTime;
        }
        if (this.fadeAlpha >= 255) {
          this.fadeAlpha = 255;
          this.currentFadeState = this.fadeState.FADE_DONE;
        }
        sprite.alpha = this.fadeAlpha / 255;
        break;

      case this.fadeState.FADE_OUT:
        if (this.fadeAlpha > 0) {
          this.fadeAlpha -= fadeSpeed * deltaTime;
        }
        if (this.fadeAlpha <= 0) {
          this.fadeAlpha = 0;
          this.currentFadeState = this.fadeState.FADE_DONE;
        }
        sprite.alpha = this.fadeAlpha / 255;
        break;

      case this.fadeState.FADE_DONE:
        sprite.alpha = 1.0;
        break;
    }
  }

  /**
   * Start fade in effect
   */
  startFadeIn() {
    this.currentFadeState = this.fadeState.FADE_IN;
    this.fadeAlpha = 0;
  }

  /**
   * Start fade out effect
   */
  startFadeOut() {
    this.currentFadeState = this.fadeState.FADE_OUT;
    this.fadeAlpha = 255;
  }

  /**
   * Create an animated sprite from texture array
   * @param {Array<PIXI.Texture>} textures - Array of textures
   * @param {number} animationSpeed - Animation speed (frames per second)
   * @returns {PIXI.AnimatedSprite} Animated sprite
   */
  createAnimatedSprite(textures, animationSpeed = 0.1) {
    if (!textures || textures.length === 0) return null;

    const animatedSprite = new PIXI.AnimatedSprite(textures);
    animatedSprite.animationSpeed = animationSpeed;
    animatedSprite.loop = true;
    
    return animatedSprite;
  }

  /**
   * Create a container for grouping sprites
   * @returns {PIXI.Container} New container
   */
  createContainer() {
    return new PIXI.Container();
  }

  /**
   * Add sprite to stage
   * @param {PIXI.DisplayObject} displayObject - Object to add
   * @param {PIXI.Container} parent - Parent container (optional)
   */
  addToStage(displayObject, parent = null) {
    if (!this.app) return;

    const container = parent || this.app.stage;
    container.addChild(displayObject);
  }

  /**
   * Remove sprite from stage
   * @param {PIXI.DisplayObject} displayObject - Object to remove
   */
  removeFromStage(displayObject) {
    if (displayObject && displayObject.parent) {
      displayObject.parent.removeChild(displayObject);
    }
  }

  /**
   * Create a tiled sprite for backgrounds
   * @param {PIXI.Texture} texture - Texture to tile
   * @param {number} width - Width of tiled area
   * @param {number} height - Height of tiled area
   * @returns {PIXI.TilingSprite} Tiling sprite
   */
  createTilingSprite(texture, width, height) {
    if (!texture) return null;
    return new PIXI.TilingSprite(texture, width, height);
  }

  /**
   * Get current fade state
   * @returns {number} Current fade state
   */
  getFadeState() {
    return this.currentFadeState;
  }

  /**
   * Check if fade is complete
   * @returns {boolean} True if fade is done
   */
  isFadeComplete() {
    return this.currentFadeState === this.fadeState.FADE_DONE;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.app = null;
    this.initialized = false;
  }
}

// Singleton instance
let renderManagerInstance = null;

export const getRenderManager = () => {
  if (!renderManagerInstance) {
    renderManagerInstance = new RenderManager();
  }
  return renderManagerInstance;
};