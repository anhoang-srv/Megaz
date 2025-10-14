import { MainGame } from './core/MainGame.js';

/**
 * Main entry point for MegaMan X4 Web
 */
class GameLauncher {
  constructor() {
    this.game = null;
    this.canvas = null;
    this.loadingElement = null;
  }

  /**
   * Initialize and start the game
   */
  async init() {
    try {
      console.log('Starting MegaMan X4 Web...');
      
      // Get DOM elements
      this.canvas = document.getElementById('game-canvas');
      this.loadingElement = document.getElementById('loading');
      
      if (!this.canvas) {
        throw new Error('Canvas element not found');
      }

      // Show loading message
      this.updateLoadingMessage('Initializing game engine...');

      // Create game instance
      this.game = new MainGame();

      // Initialize game
      this.updateLoadingMessage('Loading game systems...');
      const success = await this.game.initialize(this.canvas);
      
      if (!success) {
        throw new Error('Failed to initialize game');
      }

      // Setup event listeners
      this.setupEventListeners();

      // Hide loading and show canvas
      this.hideLoading();
      
      // Start game
      this.updateLoadingMessage('Starting game...');
      this.game.start();

      console.log('Game started successfully!');

    } catch (error) {
      console.error('Failed to start game:', error);
      this.showError(error.message);
    }
  }

  /**
   * Update loading message
   * @param {string} message - Loading message
   */
  updateLoadingMessage(message) {
    if (this.loadingElement) {
      this.loadingElement.textContent = message;
    }
  }

  /**
   * Hide loading screen and show game canvas
   */
  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'none';
    }
    if (this.canvas) {
      this.canvas.classList.remove('hidden');
    }
  }

  /**
   * Show error message
   * @param {string} error - Error message
   */
  showError(error) {
    if (this.loadingElement) {
      this.loadingElement.innerHTML = `
        <div style="color: red;">
          <h3>Error loading game</h3>
          <p>${error}</p>
          <p>Please check the console for more details.</p>
          <button onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  /**
   * Setup event listeners for window events
   */
  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => {
      if (this.game) {
        const rect = this.canvas.getBoundingClientRect();
        this.game.handleResize(rect.width, rect.height);
      }
    });

    // Handle focus/blur events
    window.addEventListener('focus', () => {
      if (this.game) {
        this.game.handleFocus();
      }
    });

    window.addEventListener('blur', () => {
      if (this.game) {
        this.game.handleBlur();
      }
    });

    // Handle first user interaction to resume AudioContext
    const resumeAudio = async () => {
      if (this.game && this.game.soundManager) {
        await this.game.soundManager.resumeAudioContext();
        // Remove listeners after first interaction
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
      }
    };

    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);
    document.addEventListener('touchstart', resumeAudio);

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      if (this.game) {
        this.game.destroy();
      }
    });

    // Handle visibility change (mobile/tab switching)
    document.addEventListener('visibilitychange', () => {
      if (this.game) {
        if (document.hidden) {
          this.game.handleBlur();
        } else {
          this.game.handleFocus();
        }
      }
    });

    // Debug: Show game stats
    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'F12' && this.game) {
          console.log('Game Stats:', this.game.getStats());
        }
      });
    }
  }

  /**
   * Handle user interaction to start audio (browser autoplay policy)
   */
  setupAudioInteraction() {
    const startAudio = async () => {
      if (this.game && this.game.soundManager) {
        await this.game.soundManager.resume();
      }
      // Remove the listener after first interaction
      document.removeEventListener('click', startAudio);
      document.removeEventListener('keydown', startAudio);
      document.removeEventListener('touchstart', startAudio);
    };

    // Add listeners for user interaction
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
    document.addEventListener('touchstart', startAudio);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const launcher = new GameLauncher();
    launcher.setupAudioInteraction();
    launcher.init();
  });
} else {
  const launcher = new GameLauncher();
  launcher.setupAudioInteraction();
  launcher.init();
}

// Export for potential external access
window.GameLauncher = GameLauncher;