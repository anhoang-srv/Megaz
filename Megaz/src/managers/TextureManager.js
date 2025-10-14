import * as PIXI from 'pixi.js';
import { TEX_TYPE } from '../utils/constants.js';

/**
 * Texture class - base class for texture management
 */
class Texture {
  constructor() {
    this.textures = new Map();
  }

  /**
   * Insert a texture
   * @param {string} fileName - Path to texture file
   * @param {string} stateKey - State key for multi textures
   * @param {number} count - Frame count for multi textures
   */
  async insertTexture(fileName, stateKey, count) {
    throw new Error('insertTexture must be implemented by subclass');
  }

  /**
   * Get texture
   * @param {string} stateKey - State key
   * @param {number} index - Frame index
   */
  getTexture(stateKey, index) {
    throw new Error('getTexture must be implemented by subclass');
  }

  destroy() {
    this.textures.clear();
  }
}

/**
 * Single texture - equivalent to CSingleTexture in C++
 */
class SingleTexture extends Texture {
  constructor() {
    super();
    this.texture = null;
  }

  async insertTexture(fileName) {
    try {
      this.texture = await PIXI.Assets.load(fileName);
      return true;
    } catch (error) {
      console.error(`Failed to load single texture: ${fileName}`, error);
      return false;
    }
  }

  getTexture() {
    return this.texture;
  }
}

/**
 * Multi texture - equivalent to CMultiTexture in C++
 */
class MultiTexture extends Texture {
  constructor() {
    super();
    this.stateTextures = new Map();
  }

  async insertTexture(fileName, stateKey, count) {
    try {
      const textures = [];
      
      if (count === 1) {
        // Single frame for this state
        const texture = await PIXI.Assets.load(fileName);
        textures.push(texture);
      } else {
        // Multiple frames - load each frame
        for (let i = 0; i < count; i++) {
          const frameFileName = fileName.replace('%d', i.toString());
          const texture = await PIXI.Assets.load(frameFileName);
          textures.push(texture);
        }
      }
      
      this.stateTextures.set(stateKey, textures);
      return true;
    } catch (error) {
      console.error(`Failed to load multi texture: ${fileName} (${stateKey})`, error);
      return false;
    }
  }

  getTexture(stateKey, index = 0) {
    const textures = this.stateTextures.get(stateKey);
    if (textures && textures.length > index) {
      return textures[index];
    }
    return null;
  }

  seekStateKey(stateKey) {
    return this.stateTextures.has(stateKey);
  }
}

/**
 * TextureManager class - equivalent to CTextureMgr in C++
 * Manages all game textures
 */
export class TextureManager {
  constructor() {
    this.textureMap = new Map();
  }

  /**
   * Insert a texture into the manager
   * @param {string} fileName - Path to texture file
   * @param {number} type - TEX_TYPE.SINGLE or TEX_TYPE.MULTI
   * @param {string} objKey - Object key identifier
   * @param {string} stateKey - State key for multi textures
   * @param {number} count - Frame count for multi textures
   */
  async insertTexture(fileName, type, objKey, stateKey = null, count = 0) {
    try {
      let texture = this.textureMap.get(objKey);

      // Create new texture if doesn't exist
      if (!texture) {
        switch (type) {
          case TEX_TYPE.SINGLE:
            texture = new SingleTexture();
            break;
          case TEX_TYPE.MULTI:
            texture = new MultiTexture();
            break;
          default:
            console.error('Invalid texture type');
            return false;
        }

        const success = await texture.insertTexture(fileName, stateKey, count);
        if (success) {
          this.textureMap.set(objKey, texture);
        }
        return success;
      } else {
        // Handle existing texture
        if (type === TEX_TYPE.SINGLE) {
          console.error(`Single texture already exists for key: ${objKey}`);
          return false;
        } else if (type === TEX_TYPE.MULTI) {
          // Add new state to existing multi texture
          if (texture instanceof MultiTexture) {
            if (texture.seekStateKey(stateKey)) {
              console.error(`State key already exists: ${stateKey}`);
              return false;
            }
            return await texture.insertTexture(fileName, stateKey, count);
          }
        }
      }
    } catch (error) {
      console.error('Error inserting texture:', error);
      return false;
    }
  }

  /**
   * Get a texture
   * @param {string} objKey - Object key
   * @param {string} stateKey - State key for multi textures
   * @param {number} index - Frame index for multi textures
   */
  getTexture(objKey, stateKey = null, index = 0) {
    const texture = this.textureMap.get(objKey);
    if (!texture) {
      return null;
    }

    if (texture instanceof SingleTexture) {
      return texture.getTexture();
    } else if (texture instanceof MultiTexture) {
      return texture.getTexture(stateKey, index);
    }

    return null;
  }

  /**
   * Load a single texture (simplified method for direct loading)
   * @param {string} key - Texture key identifier
   * @param {string} path - Path to texture file
   * @returns {PIXI.Texture|null} Loaded texture or null if failed
   */
  async loadTexture(key, path) {
    try {
      console.log(`Loading texture: ${key} from ${path}`);
      
      // Check if already loaded
      const existing = this.textureMap.get(key);
      if (existing instanceof SingleTexture) {
        console.log(`Texture ${key} already loaded`);
        return existing.getTexture();
      }

      // Load new texture
      const texture = await PIXI.Assets.load(path);
      if (texture) {
        // Store as SingleTexture
        const singleTexture = new SingleTexture();
        singleTexture.texture = texture;
        this.textureMap.set(key, singleTexture);
        
        console.log(`Successfully loaded texture: ${key}`);
        return texture;
      } else {
        console.error(`Failed to load texture from path: ${path}`);
        return null;
      }
    } catch (error) {
      console.error(`Error loading texture ${key} from ${path}:`, error);
      return null;
    }
  }

  /**
   * Cleanup all textures
   */
  destroy() {
    for (const texture of this.textureMap.values()) {
      texture.destroy();
    }
    this.textureMap.clear();
  }
}

// Singleton instance
let textureManagerInstance = null;

export const getTextureManager = () => {
  if (!textureManagerInstance) {
    textureManagerInstance = new TextureManager();
  }
  return textureManagerInstance;
};