import { OBJ_NUM } from '../utils/constants.js';

/**
 * ObjectSortManager class - equivalent to CObjSortMgr in C++
 * Manages game objects in sorted layers for proper rendering order
 */
export class ObjectSortManager {
  constructor() {
    this.objectLayers = [];
    this.scrollOffset = { x: -600, y: 30, z: 0 }; // Initial scroll like in C++
    this.initialized = false;

    this.initializeLayers();
  }

  /**
   * Initialize object layers
   */
  initializeLayers() {
    // Create 20 layers as in the C++ version
    for (let i = 0; i < 20; i++) {
      this.objectLayers[i] = [];
    }
    this.initialized = true;
  }

  /**
   * Add an object to the appropriate layer
   * @param {GameObject} obj - Object to add
   * @returns {boolean} Success status
   */
  addSortedObject(obj) {
    if (!obj || !this.initialized) return false;

    const sortID = obj.getSortID();
    if (sortID >= 0 && sortID < this.objectLayers.length) {
      this.objectLayers[sortID].push(obj);
      return true;
    }

    console.warn(`Invalid sort ID: ${sortID}`);
    return false;
  }

  /**
   * Insert object - alias for addSortedObject for compatibility
   * @param {GameObject} obj - Object to add
   * @returns {boolean} Success status
   */
  insertObject(obj) {
    return this.addSortedObject(obj);
  }

  /**
   * Remove an object from its layer
   * @param {GameObject} obj - Object to remove
   * @returns {boolean} Success status
   */
  removeSortedObject(obj) {
    if (!obj || !this.initialized) return false;

    const sortID = obj.getSortID();
    if (sortID >= 0 && sortID < this.objectLayers.length) {
      const layer = this.objectLayers[sortID];
      const index = layer.indexOf(obj);
      if (index !== -1) {
        layer.splice(index, 1);
        return true;
      }
    }

    return false;
  }

  /**
   * Update all objects - equivalent to ProgressObjects in C++
   * @param {number} deltaTime - Time since last frame
   */
  updateObjects(deltaTime) {
    if (!this.initialized) return;

    for (let i = 0; i < this.objectLayers.length; i++) {
      const layer = this.objectLayers[i];
      
      // Update objects in reverse order to handle removal safely
      for (let j = layer.length - 1; j >= 0; j--) {
        const obj = layer[j];
        
        if (obj.isDestroyed()) {
          // Remove destroyed objects
          layer.splice(j, 1);
          continue;
        }

        // Update active objects
        if (obj.active) {
          obj.update(deltaTime);
        }
      }
    }
  }

  /**
   * Render all objects - equivalent to RenderObjects in C++
   */
  renderObjects() {
    if (!this.initialized) return;

    // Render from background to foreground (layer 0 to highest)
    for (let i = 0; i < this.objectLayers.length; i++) {
      const layer = this.objectLayers[i];
      
      for (const obj of layer) {
        if (obj.visible && !obj.isDestroyed()) {
          obj.render();
        }
      }
    }
  }

  /**
   * Get all objects in a specific layer
   * @param {number} layerIndex - Layer index
   * @returns {Array} Array of objects in the layer
   */
  getLayer(layerIndex) {
    if (layerIndex >= 0 && layerIndex < this.objectLayers.length) {
      return this.objectLayers[layerIndex];
    }
    return [];
  }

  /**
   * Get all objects of a specific type across all layers
   * @param {Function} objectType - Object constructor/class
   * @returns {Array} Array of objects of the specified type
   */
  getObjectsByType(objectType) {
    const objects = [];
    
    for (const layer of this.objectLayers) {
      for (const obj of layer) {
        if (obj instanceof objectType) {
          objects.push(obj);
        }
      }
    }
    
    return objects;
  }

  /**
   * Get scroll offset - equivalent to m_vecScroll in C++
   * @returns {Object} Scroll offset {x, y, z}
   */
  getScrollOffset() {
    return { ...this.scrollOffset };
  }

  /**
   * Set scroll offset
   * @param {number} x - X offset
   * @param {number} y - Y offset
   * @param {number} z - Z offset
   */
  setScrollOffset(x, y, z = 0) {
    this.scrollOffset.x = x;
    this.scrollOffset.y = y;
    this.scrollOffset.z = z;
  }

  /**
   * Update scroll offset
   * @param {number} deltaX - Change in X offset
   * @param {number} deltaY - Change in Y offset
   * @param {number} deltaZ - Change in Z offset
   */
  updateScrollOffset(deltaX, deltaY, deltaZ = 0) {
    this.scrollOffset.x += deltaX;
    this.scrollOffset.y += deltaY;
    this.scrollOffset.z += deltaZ;
  }

  /**
   * Get total object count across all layers
   * @returns {number} Total number of objects
   */
  getTotalObjectCount() {
    let count = 0;
    for (const layer of this.objectLayers) {
      count += layer.length;
    }
    return count;
  }

  /**
   * Get object count for a specific layer
   * @param {number} layerIndex - Layer index
   * @returns {number} Number of objects in the layer
   */
  getLayerObjectCount(layerIndex) {
    if (layerIndex >= 0 && layerIndex < this.objectLayers.length) {
      return this.objectLayers[layerIndex].length;
    }
    return 0;
  }

  /**
   * Clear all objects from all layers
   */
  clearAllObjects() {
    for (const layer of this.objectLayers) {
      for (const obj of layer) {
        obj.destroy();
      }
      layer.length = 0;
    }
  }

  /**
   * Clear objects from a specific layer
   * @param {number} layerIndex - Layer index to clear
   */
  clearLayer(layerIndex) {
    if (layerIndex >= 0 && layerIndex < this.objectLayers.length) {
      const layer = this.objectLayers[layerIndex];
      for (const obj of layer) {
        obj.destroy();
      }
      layer.length = 0;
    }
  }

  /**
   * Cleanup all resources
   */
  destroy() {
    this.clearAllObjects();
    this.objectLayers = [];
    this.initialized = false;
  }
}

// Singleton instance
let objectSortManagerInstance = null;

export const getObjectSortManager = () => {
  if (!objectSortManagerInstance) {
    objectSortManagerInstance = new ObjectSortManager();
  }
  return objectSortManagerInstance;
};