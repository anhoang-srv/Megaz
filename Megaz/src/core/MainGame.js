import { getDevice } from './Device.js';
import { getTimeManager } from '../managers/TimeManager.js';
import { getSoundManager } from '../managers/SoundManager.js';
import { getSceneManager } from '../managers/SceneManager.js';
import { getObjectSortManager } from '../managers/ObjectSortManager.js';
import { getKeyManager } from '../managers/KeyManager.js';
import { getRenderManager } from '../managers/RenderManager.js';
import { getTextureManager } from '../managers/TextureManager.js';
import { FIELD } from '../utils/constants.js';
import * as PIXI from 'pixi.js';

/**
 * MainGame class - equivalent to CMainGame in C++
 * Main game controller that manages initialization and game loop
 */
export class MainGame {
  constructor() {
    this.initialized = false;
    this.running = false;
    this.canvas = null;
    
    // Manager instances
    this.device = getDevice();
    this.timeManager = getTimeManager();
    this.soundManager = getSoundManager();
    this.sceneManager = getSceneManager();
    this.objectSortManager = getObjectSortManager();
    this.keyManager = getKeyManager();
    this.renderManager = getRenderManager();
    this.textureManager = getTextureManager();
    
    // Game loop
    this.lastFrameTime = 0;
    this.targetFrameTime = 16; // 60 FPS
  }

  /**
   * Initialize the game - equivalent to Initialize() in C++
   * @param {HTMLCanvasElement} canvas - Canvas element for rendering
   * @returns {boolean} Success status
   */
  async initialize(canvas) {
    try {
      console.log('Initializing MegaMan X4 Web...');
      this.canvas = canvas;

      // Initialize Object Sort Manager first
      this.objectSortManager.initializeLayers();

      // Initialize Device (PIXI.js)
      const deviceSuccess = await this.device.initDevice(canvas);
      if (!deviceSuccess) {
        throw new Error('Failed to initialize Device');
      }

      // Initialize Render Manager
      this.renderManager.init(this.device.getApp());

      // Initialize Sound Manager
      const soundSuccess = await this.soundManager.init();
      if (!soundSuccess) {
        console.warn('Sound initialization failed - continuing without audio');
      }

      // Initialize Key Manager
      const keySuccess = this.keyManager.init();
      if (!keySuccess) {
        throw new Error('Failed to initialize KeyManager');
      }

      // Initialize Time Manager
      this.timeManager.initTimeMgr();

      // Register scenes
      await this.registerScenes();

      // Initialize first scene (Logo or Stage One)
      const sceneSuccess = await this.sceneManager.initScene('STAGE_ONE');
      if (!sceneSuccess) {
        throw new Error('Failed to initialize initial scene');
      }

      this.initialized = true;
      console.log('Game initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize game:', error);
      return false;
    }
  }

  /**
   * Register all game scenes
   */
  async registerScenes() {
    // Import Scene class
    const { Scene } = await import('../managers/SceneManager.js');
    
    // Register Logo scene
    this.sceneManager.registerScene('STAGE_LOGO', () => {
      return new (class LogoScene extends Scene {
        async initialize() {
          console.log('Logo scene initialized');
          return true;
        }
        update(deltaTime) {
          return true;
        }
        render() {
          return true;
        }
      })();
    });

    // Register Stage One scene  
    this.sceneManager.registerScene('STAGE_ONE', () => {
      const device = this.device; // Capture device reference
      const textureManager = this.textureManager;
      const objectSortManager = this.objectSortManager;
      
      return new (class StageOneScene extends Scene {
        constructor() {
          super();
          this.device = device;
          this.textureManager = textureManager;
          this.objectSortManager = objectSortManager;
          this.player = null;
          this.testSprite = null;
          this.testText = null;
        }

        async initialize() {
          console.log('Stage One scene initialized');
          
          // Get PIXI app
          const app = this.device.getApp();
          
          // CLEAR STAGE FIRST to avoid duplicates
          app.stage.removeChildren();
          console.log('Stage cleared to prevent duplicates');
          
          // Create simple player for testing (without assets)
          const { Player } = await import('../objects/Player.js');
          this.player = new Player();
          
          // Pass device reference to player
          this.player.device = this.device;
          
          await this.player.initialize();
          
          // Add player to object manager
          this.objectSortManager.insertObject(this.player);
          
          // Expose player for debugging
          window.debugPlayer = this.player;
          console.log('Player exposed as window.debugPlayer for testing');
          
          // Create test background
          this.testSprite = new PIXI.Graphics();
          this.testSprite.beginFill(0x001122); // Dark blue background
          this.testSprite.drawRect(0, 0, 800, 600);
          this.testSprite.endFill();
          app.stage.addChild(this.testSprite);
          
          // Create ground
          const ground = new PIXI.Graphics();
          ground.beginFill(0x444444); // Gray ground
          ground.drawRect(0, 480, 800, 120);
          ground.endFill();
          app.stage.addChild(ground);
          
          // Create test text
          this.testText = new PIXI.Text('MegaMan X4 - Player Test\nUse Arrow Keys, X (Jump), Z (Dash), C (Attack)', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF,
            align: 'center'
          });
          this.testText.x = 400;
          this.testText.y = 30;
          this.testText.anchor.set(0.5, 0);
          app.stage.addChild(this.testText);
          
          console.log('Player scene initialized (test mode)');
          return true;
        }
        
        async loadPlayerAssets() {
          // Load basic player textures for testing
          try {
            const { AssetLoader } = await import('../utils/AssetLoader.js');
            const assetLoader = new AssetLoader();
            
            await assetLoader.loadManifest();
            await assetLoader.loadAllAssets((progress) => {
              console.log(`Loading assets: ${Math.round(progress * 100)}%`);
            });
            
            console.log('Player assets loaded');
          } catch (error) {
            console.error('Failed to load player assets:', error);
          }
        }
        
        update(deltaTime) {
          // Update player
          if (this.player) {
            this.player.update(deltaTime);
          }
          return true;
        }
        
        render() {
          // Render player
          if (this.player) {
            this.player.render();
          }
          return true;
        }
        
        destroy() {
          if (this.player) {
            this.player.destroy();
          }
          super.destroy();
        }
      })();
    });
  }

  /**
   * Update game state - equivalent to Update() in C++
   * @param {number} currentTime - Current timestamp
   */
  update(currentTime) {
    if (!this.initialized || !this.running) return;

    // Calculate delta time
    this.timeManager.setTime();
    const deltaTime = this.timeManager.getTime();

    // Update input
    this.keyManager.update();

    // Update scene
    this.sceneManager.update(deltaTime);

    // Update all objects
    this.objectSortManager.updateObjects(deltaTime);
  }

  /**
   * Render game - equivalent to Render() in C++
   */
  render() {
    if (!this.initialized || !this.running) return;

    // Begin rendering
    this.device.renderBegin();

    // Render scene
    this.sceneManager.render();

    // Render all objects
    this.objectSortManager.renderObjects();

    // End rendering
    this.device.renderEnd();
  }

  /**
   * Start the game loop
   */
  start() {
    if (!this.initialized) {
      console.error('Game not initialized');
      return;
    }

    this.running = true;
    this.lastFrameTime = performance.now();
    
    // Start the game loop
    this.gameLoop();
    
    console.log('Game started');
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.running = false;
    console.log('Game stopped');
  }

  /**
   * Main game loop
   */
  gameLoop() {
    if (!this.running) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;

    // Maintain target frame rate
    if (deltaTime >= this.targetFrameTime) {
      this.update(currentTime);
      this.render();
      this.lastFrameTime = currentTime;
    }

    // Continue the loop
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Handle window resize
   * @param {number} width - New width
   * @param {number} height - New height
   */
  handleResize(width, height) {
    if (this.device && this.device.getApp()) {
      this.device.resize(width, height);
    }
  }

  /**
   * Handle window focus/blur for audio context
   */
  handleFocus() {
    if (this.soundManager) {
      this.soundManager.resume();
    }
  }

  handleBlur() {
    // Pause game or mute audio if needed
  }

  /**
   * Cleanup all resources
   */
  destroy() {
    this.stop();

    // Cleanup managers
    this.sceneManager.destroy();
    this.objectSortManager.destroy();
    this.textureManager.destroy();
    this.soundManager.destroy();
    this.renderManager.destroy();
    this.keyManager.destroy();
    this.device.destroy();

    this.initialized = false;
    console.log('Game destroyed');
  }

  /**
   * Get game statistics
   * @returns {Object} Game stats
   */
  getStats() {
    return {
      fps: this.timeManager.getFPS(),
      objectCount: this.objectSortManager.getTotalObjectCount(),
      currentScene: this.sceneManager.getCurrentScene()?.constructor.name || 'None',
      initialized: this.initialized,
      running: this.running
    };
  }
}