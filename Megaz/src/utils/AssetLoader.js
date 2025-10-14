import { getTextureManager } from '../managers/TextureManager.js';
import { getSoundManager } from '../managers/SoundManager.js';
import { TEX_TYPE } from '../utils/constants.js';

/**
 * AssetLoader class - handles loading all game assets
 * Loads textures and sounds based on manifest file
 */
export class AssetLoader {
  constructor() {
    this.manifest = null;
    this.loadedAssets = new Map();
    this.loadProgress = 0;
    this.totalAssets = 0;
    this.loadedCount = 0;
    
    this.textureManager = getTextureManager();
    this.soundManager = getSoundManager();
  }

  /**
   * Load the asset manifest
   * @returns {Promise<boolean>} Success status
   */
  async loadManifest() {
    try {
      const response = await fetch('/assets/manifest.json');
      this.manifest = await response.json();
      console.log('Asset manifest loaded');
      return true;
    } catch (error) {
      console.error('Failed to load asset manifest:', error);
      return false;
    }
  }

  /**
   * Load all assets specified in manifest
   * @param {Function} progressCallback - Called with progress (0-1)
   * @returns {Promise<boolean>} Success status
   */
  async loadAllAssets(progressCallback = null) {
    if (!this.manifest) {
      console.error('Manifest not loaded');
      return false;
    }

    try {
      // Count total assets
      this.totalAssets = this.countAssets();
      this.loadedCount = 0;

      console.log(`Loading ${this.totalAssets} assets...`);

      // Load textures
      await this.loadTextures(progressCallback);

      // Load sounds
      await this.loadSounds(progressCallback);

      console.log('All assets loaded successfully');
      return true;

    } catch (error) {
      console.error('Failed to load assets:', error);
      return false;
    }
  }

  /**
   * Count total number of assets
   * @returns {number} Total asset count
   */
  countAssets() {
    let count = 0;

    // Count textures
    if (this.manifest.textures) {
      for (const category of Object.values(this.manifest.textures)) {
        for (const item of Object.values(category)) {
          if (item.type === 'single') {
            count++;
          } else if (item.type === 'multi') {
            count += item.frameCount || 1;
          } else {
            // Handle nested multi textures (like Zero animations)
            for (const subItem of Object.values(item)) {
              if (subItem.frameCount) {
                count += subItem.frameCount;
              } else {
                count++;
              }
            }
          }
        }
      }
    }

    // Count sounds
    if (this.manifest.sounds) {
      count += Object.keys(this.manifest.sounds).length;
    }

    return count;
  }

  /**
   * Load all textures from manifest
   * @param {Function} progressCallback - Progress callback
   */
  async loadTextures(progressCallback) {
    if (!this.manifest.textures) return;

    for (const [categoryName, category] of Object.entries(this.manifest.textures)) {
      for (const [itemName, item] of Object.entries(category)) {
        await this.loadTextureItem(itemName, item, progressCallback);
      }
    }
  }

  /**
   * Load a single texture item
   * @param {string} itemName - Item name
   * @param {Object} item - Item data from manifest
   * @param {Function} progressCallback - Progress callback
   */
  async loadTextureItem(itemName, item, progressCallback) {
    if (item.type === 'single') {
      // Single texture
      await this.textureManager.insertTexture(
        item.path,
        TEX_TYPE.SINGLE,
        itemName
      );
      this.updateProgress(progressCallback);

    } else if (item.type === 'multi') {
      // Multi texture with frame count
      await this.textureManager.insertTexture(
        item.path,
        TEX_TYPE.MULTI,
        itemName,
        'default',
        item.frameCount
      );
      this.loadedCount += item.frameCount;
      this.updateProgress(progressCallback);

    } else {
      // Nested multi textures (like player animations)
      for (const [stateName, stateData] of Object.entries(item)) {
        if (stateData.type === 'multi') {
          await this.textureManager.insertTexture(
            stateData.path,
            TEX_TYPE.MULTI,
            itemName,
            stateName,
            stateData.frameCount
          );
          this.loadedCount += stateData.frameCount;
        } else {
          await this.textureManager.insertTexture(
            stateData.path,
            TEX_TYPE.SINGLE,
            itemName,
            stateName
          );
          this.loadedCount++;
        }
        this.updateProgress(progressCallback);
      }
    }
  }

  /**
   * Load all sounds from manifest
   * @param {Function} progressCallback - Progress callback
   */
  async loadSounds(progressCallback) {
    if (!this.manifest.sounds) return;

    for (const [soundName, soundData] of Object.entries(this.manifest.sounds)) {
      try {
        await this.soundManager.loadSound(soundData.path, soundName);
        this.updateProgress(progressCallback);
      } catch (error) {
        console.warn(`Failed to load sound: ${soundName}`, error);
        this.updateProgress(progressCallback);
      }
    }
  }

  /**
   * Update loading progress
   * @param {Function} progressCallback - Progress callback
   */
  updateProgress(progressCallback) {
    this.loadedCount++;
    this.loadProgress = this.loadedCount / this.totalAssets;
    
    if (progressCallback) {
      progressCallback(this.loadProgress);
    }
  }

  /**
   * Get loading progress
   * @returns {number} Progress (0-1)
   */
  getProgress() {
    return this.loadProgress;
  }

  /**
   * Check if all assets are loaded
   * @returns {boolean} True if all loaded
   */
  isComplete() {
    return this.loadProgress >= 1.0;
  }

  /**
   * Load specific assets for a scene
   * @param {Array<string>} assetNames - Asset names to load
   * @param {Function} progressCallback - Progress callback
   * @returns {Promise<boolean>} Success status
   */
  async loadSceneAssets(assetNames, progressCallback = null) {
    if (!this.manifest) {
      console.error('Manifest not loaded');
      return false;
    }

    try {
      const totalAssets = assetNames.length;
      let loadedAssets = 0;

      for (const assetName of assetNames) {
        // Find asset in manifest
        const asset = this.findAssetInManifest(assetName);
        if (asset) {
          await this.loadTextureItem(assetName, asset, null);
        }
        
        loadedAssets++;
        if (progressCallback) {
          progressCallback(loadedAssets / totalAssets);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to load scene assets:', error);
      return false;
    }
  }

  /**
   * Find asset in manifest by name
   * @param {string} assetName - Asset name to find
   * @returns {Object|null} Asset data or null if not found
   */
  findAssetInManifest(assetName) {
    if (!this.manifest.textures) return null;

    for (const category of Object.values(this.manifest.textures)) {
      if (category[assetName]) {
        return category[assetName];
      }
    }

    return null;
  }

  /**
   * Preload critical assets first
   * @param {Function} progressCallback - Progress callback
   * @returns {Promise<boolean>} Success status
   */
  async preloadCriticalAssets(progressCallback = null) {
    const criticalAssets = [
      'BG',
      'BG2', 
      'IDLE',
      'UI'
    ];

    return await this.loadSceneAssets(criticalAssets, progressCallback);
  }
}

// Singleton instance
let assetLoaderInstance = null;

export const getAssetLoader = () => {
  if (!assetLoaderInstance) {
    assetLoaderInstance = new AssetLoader();
  }
  return assetLoaderInstance;
};