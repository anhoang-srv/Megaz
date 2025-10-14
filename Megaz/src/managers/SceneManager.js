/**
 * Base Scene class - equivalent to CMyScene in C++
 * All game scenes inherit from this class
 */
export class Scene {
  constructor() {
    this.initialized = false;
    this.active = true;
  }

  /**
   * Initialize the scene - must be implemented by subclasses
   * @returns {boolean} Success status
   */
  initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Update the scene - called every frame
   * @param {number} deltaTime - Time since last frame
   * @returns {boolean} Success status
   */
  update(deltaTime) {
    throw new Error('update() must be implemented by subclass');
  }

  /**
   * Render the scene
   * @returns {boolean} Success status
   */
  render() {
    throw new Error('render() must be implemented by subclass');
  }

  /**
   * Cleanup scene resources
   */
  destroy() {
    this.initialized = false;
    this.active = false;
  }
}

/**
 * SceneManager class - equivalent to CSceneMgr in C++
 * Manages game scenes and transitions
 */
export class SceneManager {
  constructor() {
    this.currentScene = null;
    this.nextScene = null;
    this.transitioning = false;
    this.sceneFactories = new Map();
    
    this.registerDefaultScenes();
  }

  /**
   * Register default scene factories
   */
  registerDefaultScenes() {
    // Scene factories will be registered here
    // For now, we'll add them as they're created
  }

  /**
   * Register a scene factory
   * @param {string} sceneKey - Scene identifier
   * @param {Function} factory - Factory function that creates the scene
   */
  registerScene(sceneKey, factory) {
    this.sceneFactories.set(sceneKey, factory);
  }

  /**
   * Initialize and switch to a scene
   * @param {string} sceneKey - Scene identifier
   * @returns {boolean} Success status
   */
  async initScene(sceneKey) {
    try {
      // Clean up current scene
      if (this.currentScene) {
        this.currentScene.destroy();
        this.currentScene = null;
      }

      // Create new scene
      const factory = this.sceneFactories.get(sceneKey);
      if (!factory) {
        console.error(`Scene factory not found: ${sceneKey}`);
        return false;
      }

      this.currentScene = factory();
      
      // Initialize the scene
      const success = await this.currentScene.initialize();
      if (!success) {
        console.error(`Failed to initialize scene: ${sceneKey}`);
        this.currentScene = null;
        return false;
      }

      console.log(`Scene initialized: ${sceneKey}`);
      return true;
    } catch (error) {
      console.error(`Error initializing scene ${sceneKey}:`, error);
      return false;
    }
  }

  /**
   * Queue a scene transition
   * @param {string} sceneKey - Scene to transition to
   */
  queueSceneTransition(sceneKey) {
    this.nextScene = sceneKey;
    this.transitioning = true;
  }

  /**
   * Update current scene - equivalent to Progress in C++
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    // Handle scene transition
    if (this.transitioning && this.nextScene) {
      this.initScene(this.nextScene);
      this.nextScene = null;
      this.transitioning = false;
      return;
    }

    // Update current scene
    if (this.currentScene && this.currentScene.active) {
      this.currentScene.update(deltaTime);
    }
  }

  /**
   * Render current scene
   */
  render() {
    if (this.currentScene && this.currentScene.active) {
      this.currentScene.render();
    }
  }

  /**
   * Get current scene
   * @returns {Scene} Current scene instance
   */
  getCurrentScene() {
    return this.currentScene;
  }

  /**
   * Check if currently transitioning
   * @returns {boolean} True if transitioning
   */
  isTransitioning() {
    return this.transitioning;
  }

  /**
   * Cleanup all resources
   */
  destroy() {
    if (this.currentScene) {
      this.currentScene.destroy();
      this.currentScene = null;
    }
    this.nextScene = null;
    this.transitioning = false;
    this.sceneFactories.clear();
  }
}

// Singleton instance
let sceneManagerInstance = null;

export const getSceneManager = () => {
  if (!sceneManagerInstance) {
    sceneManagerInstance = new SceneManager();
  }
  return sceneManagerInstance;
};