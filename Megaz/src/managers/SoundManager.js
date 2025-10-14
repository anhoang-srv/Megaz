/**
 * SoundManager class - equivalent to CSoundMgr in C++
 * Manages game audio using Web Audio API
 */
export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = new Map();
    this.soundBuffers = [];
    this.masterVolume = 1.0;
    this.initialized = false;
  }

  /**
   * Initialize the sound manager
   */
  async init() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Handle browser autoplay policy - don't wait for it
      if (this.audioContext.state === 'suspended') {
        console.warn('AudioContext suspended - will resume on user interaction');
        // Don't await here - let it resume later
        this.audioContext.resume().catch(e => {
          console.warn('Could not resume AudioContext:', e.message);
        });
      }

      this.initialized = true;
      console.log('SoundManager initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize SoundManager:', error);
      // Don't fail the whole game just because of audio
      console.warn('Continuing without audio...');
      return true; // Return true to continue game initialization
    }
  }

  /**
   * Load a sound file
   * @param {string} fileName - Path to sound file
   * @param {string} key - Sound key identifier
   */
  async loadSound(fileName, key) {
    if (!this.initialized) {
      console.error('SoundManager not initialized');
      return false;
    }

    try {
      const response = await fetch(fileName);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.sounds.set(key, audioBuffer);
      console.log(`Sound loaded: ${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to load sound ${fileName}:`, error);
      return false;
    }
  }

  /**
   * Play a sound
   * @param {string} key - Sound key
   * @param {boolean} loop - Whether to loop the sound
   * @param {number} volume - Volume (0-1)
   */
  playSound(key, loop = false, volume = 1.0) {
    if (!this.initialized || !this.sounds.has(key)) {
      console.warn(`Sound not found: ${key}`);
      return null;
    }

    try {
      const audioBuffer = this.sounds.get(key);
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = audioBuffer;
      source.loop = loop;
      
      gainNode.gain.value = volume * this.masterVolume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
      
      return { source, gainNode };
    } catch (error) {
      console.error(`Error playing sound ${key}:`, error);
      return null;
    }
  }

  /**
   * Stop a sound
   * @param {Object} soundInstance - Sound instance returned by playSound
   */
  stopSound(soundInstance) {
    if (soundInstance && soundInstance.source) {
      try {
        soundInstance.source.stop();
      } catch (error) {
        // Sound might already be stopped
      }
    }
  }

  /**
   * Set master volume
   * @param {number} volume - Volume (0-1)
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Resume AudioContext after user interaction
   * Call this on first user click/touch
   */
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('AudioContext resumed successfully');
        return true;
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * Resume audio context (for handling autoplay policy)
   */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.sounds.clear();
    this.soundBuffers = [];
    this.initialized = false;
  }
}

// Singleton instance
let soundManagerInstance = null;

export const getSoundManager = () => {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
};