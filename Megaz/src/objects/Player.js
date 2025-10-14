import * as PIXI from 'pixi.js';
import { GameObject } from './GameObject.js';
import { STATUS, POS_STATION, OBJ_NUM, DIRECTION } from '../utils/constants.js';
import { getKeyManager } from '../managers/KeyManager.js';
import { getSoundManager } from '../managers/SoundManager.js';
import { getTextureManager } from '../managers/TextureManager.js';
import { getRenderManager } from '../managers/RenderManager.js';
import { getObjectSortManager } from '../managers/ObjectSortManager.js';
import { getTimeManager } from '../managers/TimeManager.js';

/**
 * Player class - equivalent to CPlayer in C++
 * Handles Zero character movement, animation, and combat
 */
export class Player extends GameObject {
  constructor() {
    console.log('CREATING NEW PLAYER INSTANCE');
    
    super();
    
    // Set sort ID for player layer
    this.setSortID(OBJ_NUM.PLAYER);
    
    // Player state
    this.status = STATUS.IDLE;
    this.direction = DIRECTION.RIGHT;
    this.positionStation = POS_STATION.GROUND;
    
    // Position and movement
    this.x = 400; // Start in center
    this.y = 480; // Ground level
    this.maxYPosition = 480; // Ground level (matches scene ground)
    this.speed = 220;
    this.highSpeed = 350; // Dash speed
    this.jumpPower = 15;
    this.angle = 0;
    
    // Physics
    this.velocityX = 0;
    this.velocityY = 0;
    this.gravity = 300; // Slower gravity for more natural falling
    this.maxFallSpeed = 400; // Terminal velocity to prevent super fast falling
    this.isOnGround = true;
    this.canJump = true; // Prevent jump spam
    this.jumpKeyWasPressed = false; // Track if jump key was already pressed
    this.dashKeyWasPressed = false; // Track if dash key was already pressed
    
    // Dash properties for full animation sequence
    this.isDashing = false; // Track if currently dashing
    this.dashDistance = 300; // Total dash distance (increased from 190 for longer dash time)
    this.dashSpeed = 350; // Dash speed during movement (slightly reduced for better control)
    this.dashProgress = 0; // Current dash progress
    this.dashPhase = 'none'; // 'start', 'moving', 'end'
    this.canDashAgain = true; // Flag to control when can dash again for continuous dashing
    this.dashDirection = DIRECTION.RIGHT; // Direction of current dash (can be different from facing direction)
    this.canChangeDashDirection = true; // Allow changing direction during dash for smoother control
    
    // Dash easing for smoother movement
    this.dashEasing = {
      startAcceleration: 0.4, // Accelerate at start of dash (0-40%)
      endDeceleration: 0.6,   // Decelerate at end of dash (60-100%)
      current: 0              // Current easing value (0-1)
    };
    
    // Attack properties
    this.attackTimer = 0; // Timer to prevent stuck attack states
    this.maxAttackDuration = 1.0; // Maximum attack duration in seconds
    
    // Super Jump properties (X + Z combo)
    this.isSuperJumping = false; // Track if currently doing super jump
    this.superJumpVelocityX = 300; // Horizontal velocity for super jump
    this.superJumpMultiplier = 1.5; // Vertical multiplier for higher jump
    
    // Animation
    this.currentAnimation = 'IDLE';
    this.animationFrame = 0;
    this.animationSpeed = 5;
    this.frameTime = 0;
    this.currentTexturePath = ''; // Track current texture for optimization
    
    // Animation data for different states
    this.animations = {
      IDLE: { 
        path: '/assets/textures/Single/IDLE.png', 
        frames: 5, 
        speed: 0.5, // Very slow for natural breathing effect
        isMultiFile: false 
      },
      WALK: { 
        path: '/assets/textures/Multi/Walk', 
        frames: 14, 
        speed: 12,
        isMultiFile: true 
      },
      JUMP_START: { 
        path: '/assets/textures/Multi/JumpStart', 
        frames: 4, 
        speed: 8,
        isMultiFile: true 
      },
      JUMP_DOWN: { 
        path: '/assets/textures/Multi/JumpDown', 
        frames: 6, 
        speed: 8,
        isMultiFile: true 
      },
      DASH: { 
        path: '/assets/textures/Multi/DashStart', 
        frames: 7, 
        speed: 10, // Reduced from 15 to 10 for smoother animation
        isMultiFile: true 
      },
      DASH_END: { 
        path: '/assets/textures/Multi/DashEnd', 
        frames: 4, 
        speed: 8, // Reduced from 12 to 8 for smoother transition
        isMultiFile: true 
      },
      ATTACK: { 
        path: '/assets/textures/Multi/Attack_M1_', 
        frames: 7, 
        speed: 12,
        isMultiFile: true 
      }
    };
    
    // Preloaded textures cache
    this.textureCache = new Map();
    
    // Player flags
    this.isSpawning = false;
    this.isStarted = false;
    this.isControlEnabled = false;
    this.isGrounded = false;
    this.dashFrame = 0;
    
    // Jump frame tracking
    this.jumpFrames = {
      jumpStart: 0,
      jumpOff: 0,
      jumpDown: 0
    };
    
    // Spawn animation
    this.spawnFrame = 1;
    this.spawnY = 0;
    
    // Managers
    this.keyManager = getKeyManager();
    this.soundManager = getSoundManager();
    this.textureManager = getTextureManager();
    this.renderManager = getRenderManager();
    this.objectSortManager = getObjectSortManager();
    this.timeManager = getTimeManager();
  }

  /**
   * Initialize player
   * @returns {boolean} Success status
   */
  async initialize() {
    try {
      // Set initial position
      this.transform.position.x = this.x;
      this.transform.position.y = this.y;
      
      // Enable collision
      this.collisionEnabled = true;
      
      // Set initial spawn state
      this.isSpawning = false; // Skip spawn for testing
      this.isStarted = true;
      this.isControlEnabled = true;
      this.status = STATUS.IDLE;
      
      // Preload animation textures
      await this.preloadAnimations();
      
      // Create sprite immediately
      await this.createSprite();
      
      console.log('Player initialized at position:', this.x, this.y);
      return true;
    } catch (error) {
      console.error('Failed to initialize player:', error);
      return false;
    }
  }

  /**
   * Preload all animation textures
   */
  async preloadAnimations() {
    console.log('Preloading Player animations...');
    
    for (const [animName, animData] of Object.entries(this.animations)) {
      try {
        const textures = [];
        
        if (animData.isMultiFile) {
          // Load multiple files (Walk0.PNG, Walk1.PNG, etc.)
          for (let i = 0; i < animData.frames; i++) {
            let texture = null;
            
            // Try both .PNG and .png extensions
            try {
              texture = await PIXI.Assets.load(`${animData.path}${i}.PNG`);
            } catch (error) {
              try {
                texture = await PIXI.Assets.load(`${animData.path}${i}.png`);
              } catch (error2) {
                console.warn(`Could not load texture: ${animData.path}${i} (tried both .PNG and .png)`);
              }
            }
            
            if (texture) {
              textures.push(texture);
            }
          }
        } else {
          // Load sprite sheet and split into frames (IDLE.png)
          const fullTexture = await PIXI.Assets.load(animData.path);
          if (fullTexture) {
            const frameWidth = fullTexture.width / animData.frames;
            const frameHeight = fullTexture.height;
            
            for (let i = 0; i < animData.frames; i++) {
              const frameRect = new PIXI.Rectangle(i * frameWidth, 0, frameWidth, frameHeight);
              const frameTexture = new PIXI.Texture(fullTexture.baseTexture, frameRect);
              textures.push(frameTexture);
            }
          }
        }
        
        this.textureCache.set(animName, textures);
        console.log(`Loaded ${textures.length} frames for ${animName}`);
        
      } catch (error) {
        console.error(`Failed to load ${animName} animation:`, error);
        this.textureCache.set(animName, []); // Set empty array as fallback
      }
    }
    
    console.log('Animation preloading completed');
  }

  /**
   * Create player sprite
   */
  async createSprite() {
    if (this.sprite) return;
    
    console.log('Creating Player sprite...');
    
    try {
      // Load IDLE texture (sprite sheet with 5 frames)
      console.log('Attempting to load IDLE texture from:', '/assets/textures/Single/IDLE.png');
      const fullTexture = await PIXI.Assets.load('/assets/textures/Single/IDLE.png');
      
      if (fullTexture) {
        console.log('Full IDLE texture loaded:', fullTexture.width, 'x', fullTexture.height);
        
        // IDLE.png contains 5 frames horizontally
        // Calculate frame width (total width / 5 frames)
        const frameWidth = fullTexture.width / 5;
        const frameHeight = fullTexture.height;
        
        console.log('Frame dimensions:', frameWidth, 'x', frameHeight);
        
        // Create texture for first frame only (frame 0)
        const frameRect = new PIXI.Rectangle(0, 0, frameWidth, frameHeight);
        const singleFrameTexture = new PIXI.Texture(fullTexture.baseTexture, frameRect);
        
        this.sprite = new PIXI.Sprite(singleFrameTexture);
        
        // Set sprite properties
        this.sprite.anchor.set(0.5, 1.0); // Bottom center anchor like in C++
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        
        console.log('Player sprite created with single IDLE frame');
      } else {
        console.warn('IDLE texture is null, using fallback rectangle');
        // Fallback to colored rectangle if texture fails
        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(0x00FF00);
        this.sprite.drawRect(-20, -40, 40, 40);
        this.sprite.endFill();
        this.sprite.x = this.x;
        this.sprite.y = this.y;
      }
    } catch (error) {
      console.error('Error creating player sprite:', error);
      // Fallback to rectangle
      this.sprite = new PIXI.Graphics();
      this.sprite.beginFill(0x00FF00);
      this.sprite.drawRect(-20, -40, 40, 40);
      this.sprite.endFill();
      this.sprite.x = this.x;
      this.sprite.y = this.y;
    }
  }

  /**
   * Update player - called every frame
   * @param {number} deltaTime - Time since last frame
   * @returns {boolean} Success status
   */
  update(deltaTime) {
    if (this.destroyed) return false;
    
    // Skip spawn handling for now
    
    // Check input and update movement
    if (this.isControlEnabled) {
      this.checkInput();
    }
    
    // Update physics
    this.updatePhysics(deltaTime);
    
    // Update animation
    this.updateAnimation(deltaTime);
    
    // Update position in transform
    this.transform.position.x = this.x;
    this.transform.position.y = this.y;
    
    return super.update(deltaTime);
  }

  /**
   * Debug method to trigger dash manually
   */
  triggerDash() {
    if (this.isOnGround) {
      console.log('Manual dash triggered!');
      this.status = STATUS.DASH;
      return true;
    }
    console.log('Cannot dash - not on ground');
    return false;
  }

  /**
   * Handle spawn animation sequence
   * @param {number} deltaTime - Time since last frame
   */
  updateSpawn(deltaTime) {
    // Move down during spawn
    this.spawnY += 15 * deltaTime * 60; // Adjust for 60fps
    
    if (this.spawnY >= this.maxYPosition) {
      this.spawnY = this.maxYPosition;
      this.spawnFrame += 35 * deltaTime;
      
      // Spawn animation sequence
      if (this.spawnFrame >= 17) {
        this.isSpawning = false;
        this.isStarted = true;
        this.isControlEnabled = true;
        this.spawnFrame = 1;
        this.y = this.maxYPosition;
        this.transform.position.y = this.y;
      }
    } else {
      this.y = this.spawnY;
      this.transform.position.y = this.y;
    }
  }

  /**
   * Check keyboard input and update player state
   */
  checkInput() {
    if (!this.isControlEnabled) return;
    
    const deltaTime = this.timeManager.getTime();
    
    // Get all key states once at the beginning
    const xKeyDown = this.keyManager.isKeyDown('X');
    const zKeyDown = this.keyManager.isKeyDown('Z');
    const leftKeyDown = this.keyManager.isKeyDown('LEFT');
    const rightKeyDown = this.keyManager.isKeyDown('RIGHT');
    const cKeyDown = this.keyManager.isKeyDown('C');
    const vKeyDown = this.keyManager.isKeyDown('V');
    
    // Debug: Log key states and current state machine info
    if ((xKeyDown || zKeyDown) || (this.jumpKeyWasPressed || this.dashKeyWasPressed)) {
      console.log('Debug keys:', {
        xKeyDown,
        zKeyDown,
        jumpKeyWasPressed: this.jumpKeyWasPressed,
        dashKeyWasPressed: this.dashKeyWasPressed,
        status: this.status,
        canJump: this.canJump,
        isOnGround: this.isOnGround,
        isDashing: this.isDashing,
        positionStation: this.positionStation,
        velocityY: this.velocityY,
        state: STATUS[this.status] || this.status // Show state name for better debugging
      });
    }
    
    // -------- GROUND DETECTION (always runs first) --------
    // Ground position check - ensure consistent state
    if (this.y >= this.maxYPosition) {
      this.positionStation = POS_STATION.GROUND;
      this.isOnGround = true;
      this.jumpFrames.jumpDown = 0;
      
      if (!this.isGrounded) {
        this.soundManager.playSound('plat', false, 0.5);
        this.isGrounded = true;
      }
      this.angle = 0;
      
      // Clear dash state when landing
      if (this.status === STATUS.JUMPDOWN && this.isDashing) {
        this.isDashing = false;
      }
    } else {
      this.positionStation = POS_STATION.AIR;
      this.isOnGround = false;
      this.isGrounded = false;
    }

    // -------- 1. ALWAYS RESET KEY TRACKING FIRST --------
    // This must happen every frame regardless of state
    if (!xKeyDown) {
      this.jumpKeyWasPressed = false;
      // Reset jump ability when landing and key is released
      if (this.isOnGround) {
        this.canJump = true;
      }
    }
    
    // IMPORTANT: Don't reset dashKeyWasPressed here when Z is released
    // This will be handled in animation completion for continuous dashing
    // Only reset if not currently dashing
    if (!zKeyDown && !this.isDashing) {
      this.dashKeyWasPressed = false;
    }
    
    // -------- 2. STATE MACHINE APPROACH --------
    // Handle different states explicitly
    switch (this.status) {
      case STATUS.IDLE:
      case STATUS.WALK:
        // Basic attack (ground only)
        if (cKeyDown && this.isOnGround) {
          this.animationFrame = 0;
          this.status = STATUS.A1;
          this.attackTimer = 0; // Reset attack timer
          this.soundManager.playSound('a1', false, 0.7);
          this.soundManager.playSound('sword', false, 0.7);
          return;
        }
        
        // Fire attack
        if (vKeyDown && this.isOnGround) {
          this.soundManager.playSound('fire', false, 0.7);
          this.status = STATUS.FIREATTACK;
          this.attackTimer = 0; // Reset attack timer
          this.positionStation = POS_STATION.AIR;
          return;
        }
        
        // Check for SUPER JUMP (X + Z simultaneously) - highest priority
        if (xKeyDown && zKeyDown && !this.jumpKeyWasPressed && !this.dashKeyWasPressed && 
            this.isOnGround && this.canJump && this.canDashAgain) {
          // SUPER JUMP - combo move!
          this.status = STATUS.JUMPSTART;
          this.velocityY = -this.jumpPower * 10 * this.superJumpMultiplier; // Higher jump (1.5x)
          
          // Add horizontal velocity based on direction
          if (this.direction === DIRECTION.RIGHT) {
            this.velocityX = this.superJumpVelocityX;
          } else {
            this.velocityX = -this.superJumpVelocityX;
          }
          
          this.isOnGround = false;
          this.canJump = false;
          this.jumpKeyWasPressed = true;
          this.dashKeyWasPressed = true; // Mark both keys as pressed
          this.positionStation = POS_STATION.AIR;
          this.jumpFrames.jumpStart = 0;
          this.animationFrame = 0;
          this.isGrounded = false;
          this.isSuperJumping = true; // Flag this as super jump
          
          // Play enhanced sound effects
          this.soundManager.playSound('jump', false, 0.6);
          this.soundManager.playSound('dash', false, 0.4);
          
          console.log('SUPER JUMP triggered! Enhanced jump with horizontal momentum');
          return;
        }
        
        // Regular jump (only if not doing super jump)
        if (xKeyDown && !this.jumpKeyWasPressed && this.isOnGround && this.canJump) {
          this.status = STATUS.JUMPSTART;
          this.velocityY = -this.jumpPower * 10; // Fixed jump height
          this.isOnGround = false;
          this.canJump = false; // Block further jumps until landing
          this.jumpKeyWasPressed = true; // Mark that jump key is being held
          this.positionStation = POS_STATION.AIR;
          this.jumpFrames.jumpStart = 0;
          this.animationFrame = 0;
          this.isGrounded = false;
          this.soundManager.playSound('jump', false, 0.5);
          return; // Exit after processing jump
        }
        
        // Can initiate dash from ground states
        if (zKeyDown && !this.dashKeyWasPressed && this.isOnGround && !this.isDashing && this.canDashAgain) {
          this.status = STATUS.DASH;
          this.isDashing = true;
          this.dashProgress = 0;
          this.dashPhase = 'start'; // Start with DASH animation
          this.dashKeyWasPressed = true; // Prevent spam
          this.canDashAgain = false; // Cannot dash again until animation completes
          
          // Determine dash direction based on arrow keys
          if (leftKeyDown) {
            this.dashDirection = DIRECTION.LEFT;
            this.direction = DIRECTION.LEFT; // Update facing direction
            console.log('Dash triggered in LEFT direction');
          } else if (rightKeyDown) {
            this.dashDirection = DIRECTION.RIGHT;
            this.direction = DIRECTION.RIGHT; // Update facing direction
            console.log('Dash triggered in RIGHT direction');
          } else {
            // No arrow key pressed, use current facing direction
            this.dashDirection = this.direction;
            console.log(`Dash triggered in current facing direction: ${this.direction === DIRECTION.RIGHT ? 'RIGHT' : 'LEFT'}`);
          }
          
          this.soundManager.playSound('dash', false, 0.6);
          return; // Exit after processing dash
        }
        
        // If no special action, handle walking
        this.handleWalking(leftKeyDown, rightKeyDown, deltaTime);
        break;
        
      case STATUS.JUMPSTART:
      case STATUS.JUMPDOWN:
        // Handle attack inputs during jump
        if (cKeyDown) {
          this.soundManager.playSound('sword', false, 0.7);
          this.status = STATUS.JUMPATTACK;
          this.attackTimer = 0; // Reset attack timer
          this.angle = 120;
          return;
        }
        
        // Update jump physics
        if (this.status === STATUS.JUMPSTART) {
          // Continue jump if still in jump start phase
          if (this.velocityY < 0) {
            this.y -= this.jumpPower * Math.cos(this.angle * Math.PI / 180 * 2);
            const scrollOffset = this.objectSortManager.getScrollOffset();
            this.objectSortManager.setScrollOffset(
              scrollOffset.x,
              Math.min(scrollOffset.y + this.speed * deltaTime, 80),
              scrollOffset.z
            );
            this.isGrounded = false;
          }
          
          // Switch to JUMPDOWN when velocity becomes positive
          if (this.velocityY >= 0) {
            this.status = STATUS.JUMPDOWN;
            this.jumpFrames.jumpDown = 0;
          }
          
          // Handle jump release
          if (!xKeyDown) {
            this.status = STATUS.JUMPDOWN;
            this.jumpFrames.jumpStart = 0;
            this.jumpFrames.jumpDown = 0;
            this.angle = 90;
          }
        }
        
        // Can't initiate dash while jumping, but can control air movement
        this.handleAirMovement(leftKeyDown, rightKeyDown, deltaTime);
        break;
        
      case STATUS.DASH:
        // Locked in dash state, no other inputs processed
        break;
        
      case STATUS.DASHEND:
        // Transitioning out of dash, no inputs processed
        break;
        
      case STATUS.A1:
      case STATUS.JUMPATTACK:
      case STATUS.FIREATTACK:
        // Attacking - update attack timer and check for timeout
        this.attackTimer += deltaTime;
        
        // Safety timeout - if attack takes too long, force return to IDLE
        if (this.attackTimer >= this.maxAttackDuration) {
          console.log('Attack timeout - forcing return to IDLE');
          this.attackTimer = 0;
          
          if (this.status === STATUS.JUMPATTACK && !this.isOnGround) {
            this.status = STATUS.JUMPDOWN;
          } else {
            this.status = STATUS.IDLE;
          }
        }
        break;
        
      default:
        // For any unhandled state, check if we're in the air
        if (this.positionStation === POS_STATION.AIR) {
          this.status = STATUS.JUMPDOWN;
        }
        break;
    }
    
    // -------- 3. SAFETY RESETS --------
    // Reset stuck states when on ground (stricter reset conditions)
    if (this.isOnGround) {
      // If keys are released, reset tracking flags
      if (!xKeyDown) {
        this.jumpKeyWasPressed = false;
        this.canJump = true;
      }
      
      if (!zKeyDown) {
        this.dashKeyWasPressed = false;
        // Also reset dash ability if dash sequence is completely finished
        if (!this.isDashing) {
          this.canDashAgain = true;
        }
      }
      
      // Always reset dash state if we're on ground and not in dash animation
      if (this.isDashing && 
          this.status !== STATUS.DASH && 
          this.status !== STATUS.DASHEND) {
        console.log('Safety reset: Clearing stuck dash state');
        this.isDashing = false;
        this.dashPhase = 'none';
        this.canDashAgain = true;
        this.dashDirection = this.direction; // Reset to current facing direction
      }
      
      // Force return to IDLE if in an inconsistent state and no keys pressed
      if (!xKeyDown && !zKeyDown && !leftKeyDown && !rightKeyDown &&
          this.status !== STATUS.IDLE && 
          this.status !== STATUS.WALK && 
          this.status !== STATUS.DASH &&
          this.status !== STATUS.DASHEND &&
          !this.isAttacking()) {
        console.log('Safety reset: Returning to IDLE from inconsistent state');
        this.status = STATUS.IDLE;
        this.canDashAgain = true;
      }
    }
  }
  
  /**
   * Helper method for walking logic
   * @param {boolean} leftKeyDown - Is left key pressed
   * @param {boolean} rightKeyDown - Is right key pressed
   * @param {number} deltaTime - Time since last frame
   */
  handleWalking(leftKeyDown, rightKeyDown, deltaTime) {
    if (leftKeyDown) {
      this.direction = DIRECTION.LEFT;
      this.status = STATUS.WALK;
      this.x -= this.speed * deltaTime;
      this.updateScroll(this.speed * deltaTime);
    } 
    else if (rightKeyDown) {
      this.direction = DIRECTION.RIGHT;
      this.status = STATUS.WALK;
      this.x += this.speed * deltaTime;
      this.updateScroll(-this.speed * deltaTime);
    }
    else {
      if (this.isOnGround && !this.isDashing) {
        this.status = STATUS.IDLE;
      }
    }
  }
  
  /**
   * Helper method for air movement
   * @param {boolean} leftKeyDown - Is left key pressed
   * @param {boolean} rightKeyDown - Is right key pressed
   * @param {number} deltaTime - Time since last frame
   */
  handleAirMovement(leftKeyDown, rightKeyDown, deltaTime) {
    const airControlSpeed = this.speed * 0.7;
    
    if (leftKeyDown) {
      this.direction = DIRECTION.LEFT;
      this.x -= airControlSpeed * deltaTime;
      this.updateScroll(airControlSpeed * deltaTime);
    } 
    else if (rightKeyDown) {
      this.direction = DIRECTION.RIGHT;
      this.x += airControlSpeed * deltaTime;
      this.updateScroll(-airControlSpeed * deltaTime);
    }
  }

  /**
   * Update scroll based on player position
   * @param {number} scrollDelta - Change in scroll
   */
  updateScroll(scrollDelta) {
    if (this.x > 400 && this.x < 1200) {
      const scrollOffset = this.objectSortManager.getScrollOffset();
      this.objectSortManager.setScrollOffset(
        scrollOffset.x + scrollDelta,
        scrollOffset.y,
        scrollOffset.z
      );
    }
  }

  /**
   * Update physics
   * @param {number} deltaTime - Time since last frame
   */
  updatePhysics(deltaTime) {
    // Apply gravity if not on ground
    if (!this.isOnGround) {
      this.velocityY += this.gravity * deltaTime;
      
      // Apply terminal velocity to prevent super fast falling
      if (this.velocityY > this.maxFallSpeed) {
        this.velocityY = this.maxFallSpeed;
      }
    }
    
    // Handle super jump physics
    if (this.isSuperJumping) {
      // Apply horizontal velocity with slight air drag for realistic momentum
      this.x += this.velocityX * deltaTime;
      this.velocityX *= 0.98; // Very slight drag to maintain momentum but feel natural
      
      // Update scroll based on super jump movement
      if (this.velocityX > 0) {
        this.updateScroll(-this.velocityX * deltaTime * 0.5); // Smooth camera follow
      } else {
        this.updateScroll(-this.velocityX * deltaTime * 0.5);
      }
      
      // End super jump state when starting to fall significantly
      if (this.velocityY > this.jumpPower * 2) {
        this.isSuperJumping = false;
        this.velocityX *= 0.5; // Reduce horizontal velocity when super jump ends
      }
    }
    
    // Handle different states with proper physics
    switch (this.status) {
      case STATUS.DASH:
        // Handle dash movement with full animation sequence
        if (this.dashPhase === 'start') {
          // During DASH animation (frames 0-5), no movement yet
          // Movement will start when DASH animation completes
        } else if (this.dashPhase === 'moving') {
          // Apply dash movement with easing for smoother acceleration/deceleration
          const baseDashMovement = this.dashSpeed * deltaTime;
          
          // Calculate easing factor for smoother movement
          const progress = this.dashProgress / this.dashDistance;
          let easingFactor = 1.0;
          
          if (progress < this.dashEasing.startAcceleration) {
            // Smooth acceleration at start (ease-in)
            easingFactor = 0.3 + (progress / this.dashEasing.startAcceleration) * 0.7;
          } else if (progress > (1.0 - this.dashEasing.endDeceleration)) {
            // Smooth deceleration at end (ease-out)
            const endProgress = (progress - (1.0 - this.dashEasing.endDeceleration)) / 
                                this.dashEasing.endDeceleration;
            easingFactor = 1.0 - (endProgress * 0.4); // Decelerate to 60% of max speed
          }
          
          // Apply easing to movement
          const dashMovement = baseDashMovement * easingFactor;
          
          // Allow direction change during dash for smoother control
          if (this.canChangeDashDirection) {
            const leftKeyDown = this.keyManager.isKeyDown('LEFT');
            const rightKeyDown = this.keyManager.isKeyDown('RIGHT');
            
            if (leftKeyDown && !rightKeyDown) {
              // Change dash direction to left while dashing
              this.dashDirection = DIRECTION.LEFT;
              this.direction = DIRECTION.LEFT; // Update facing direction
            } else if (rightKeyDown && !leftKeyDown) {
              // Change dash direction to right while dashing
              this.dashDirection = DIRECTION.RIGHT;
              this.direction = DIRECTION.RIGHT; // Update facing direction
            }
          }
          
          // Apply movement based on current dash direction
          if (this.dashDirection === DIRECTION.RIGHT) {
            this.x += dashMovement;
            this.updateScroll(-dashMovement);
          } else {
            this.x -= dashMovement;
            this.updateScroll(dashMovement);
          }
          
          // Update dash progress using base speed to maintain consistent distance
          this.dashProgress += baseDashMovement;
          
          // Start DASH_END early for smoother transition (at 85% progress)
          if (this.dashProgress >= this.dashDistance * 0.85) {
            this.dashPhase = 'end';
            this.status = STATUS.DASHEND;
          }
        }
        break;
        
      case STATUS.DASHEND:
        // During DASH_END animation, no movement
        // Will return to IDLE when animation completes
        break;
        
      case STATUS.JUMPSTART:
      case STATUS.JUMPDOWN:
        // Normal physics apply during jumps
        // Already handled by gravity above
        break;
        
      default:
        // Apply friction when not in special state
        this.velocityX *= 0.8;
        break;
    }

    // Apply velocities to position
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;

    // Ground collision
    if (this.y >= this.maxYPosition) {
      this.y = this.maxYPosition;
      this.velocityY = 0;
      this.isOnGround = true;
      this.positionStation = POS_STATION.GROUND;
      
      // Important: Only reset jump ability when we've actually landed
      if (!this.jumpKeyWasPressed) {
        this.canJump = true;
      }
      
      // Reset super jump state when landing
      if (this.isSuperJumping) {
        this.isSuperJumping = false;
        console.log('Super jump ended on landing');
      }
      
      // Return to IDLE when landing (except during dash sequence)
      if ((this.status === STATUS.JUMPSTART || this.status === STATUS.JUMPDOWN) && !this.isDashing) {
        this.status = STATUS.IDLE;
        // Clear any potential stuck dash state
        this.isDashing = false; 
        this.dashPhase = 'none';
      }
      
      // Ensure positionStation and isOnGround are in sync
      this.positionStation = POS_STATION.GROUND;
    } else {
      this.isOnGround = false;
      this.positionStation = POS_STATION.AIR;
      
      // Update jump status based on velocity
      if (this.velocityY > 0 && this.status === STATUS.JUMPSTART) {
        this.status = STATUS.JUMPDOWN; // Falling down
      }
    }

    // Screen boundaries
    if (this.x < 20) {
      this.x = 20;
      this.velocityX = 0;
    }
    if (this.x > 780) {
      this.x = 780;
      this.velocityX = 0;
    }

    // Update transform
    this.transform.position.x = this.x;
    this.transform.position.y = this.y;
  }

  /**
   * Update animation based on current status
   * @param {number} deltaTime - Time since last frame
   */
  updateAnimation(deltaTime) {
    // Determine target animation based on status
    let targetAnimation = 'IDLE';
    
    switch (this.status) {
      case STATUS.IDLE:
        targetAnimation = 'IDLE';
        break;
      case STATUS.WALK:
        targetAnimation = 'WALK';
        break;
      case STATUS.DASH:
        targetAnimation = 'DASH';
        break;
      case STATUS.DASHEND:
        targetAnimation = 'DASH_END';
        break;
      case STATUS.JUMPSTART:
        targetAnimation = 'JUMP_START';
        break;
      case STATUS.JUMPDOWN:
        targetAnimation = 'JUMP_DOWN';
        break;
      case STATUS.A1:
        targetAnimation = 'ATTACK';
        break;
      case STATUS.JUMPATTACK:
        targetAnimation = 'ATTACK'; // Use same attack animation
        break;
      case STATUS.FIREATTACK:
        targetAnimation = 'ATTACK'; // Use same attack animation
        break;
      default:
        targetAnimation = 'IDLE';
        break;
    }

    // Change animation if needed
    if (this.currentAnimation !== targetAnimation) {
      this.changeAnimation(targetAnimation);
    }

    // Update frame timing
    const animData = this.animations[this.currentAnimation];
    if (animData) {
      this.frameTime += animData.speed * deltaTime;
      
      if (this.frameTime >= 1.0) {
        // Handle different animations
        this.animationFrame = Math.floor(this.frameTime) % animData.frames;
        
        // Early transition for smoother dash: start movement at frame 4 of DASH animation
        if (this.currentAnimation === 'DASH' && this.dashPhase === 'start' && this.animationFrame >= 4) {
          this.dashPhase = 'moving';
          this.dashProgress = 0;
        }
        
        // Update sprite texture to current frame
        this.updateSpriteFrame();
        
        // Handle animation completion events
        if (this.frameTime >= animData.frames) {
          this.frameTime = 0; // Reset for next cycle
          
          // Handle specific animation completions
          if (this.currentAnimation === 'DASH' && this.dashPhase === 'start') {
            // DASH animation completed (frames 0-6), start movement
            this.dashPhase = 'moving';
            this.dashProgress = 0;
          } else if (this.currentAnimation === 'DASH_END' && this.dashPhase === 'end') {
            // DASH_END animation completed (frames 0-3), return to IDLE
            this.isDashing = false;
            this.dashPhase = 'none';
            this.status = STATUS.IDLE;
            
            // CRITICAL: Reset dash flags to allow continuous dashing
            this.canDashAgain = true;
            
            // Check if Z is still held down for continuous dashing
            const zKeyDown = this.keyManager.isKeyDown('Z');
            if (zKeyDown) {
              this.dashKeyWasPressed = false; // Allow dash to trigger again
              console.log('DASH_END completed, Z still held - ready for next dash');
            } else {
              this.dashKeyWasPressed = false; // Reset normally if Z is released
              console.log('DASH_END completed, Z released - dash sequence finished');
            }
            
            // Reset dashDirection to current facing direction for next dash
            this.dashDirection = this.direction;
          } else if (this.currentAnimation === 'ATTACK') {
            // ATTACK animation completed (frames 0-6), return to appropriate state
            console.log('Attack animation completed, returning to appropriate state');
            this.attackTimer = 0; // Reset attack timer
            
            if (this.status === STATUS.JUMPATTACK) {
              // If we were doing jump attack, return to appropriate jump state
              if (this.isOnGround) {
                this.status = STATUS.IDLE;
              } else {
                this.status = STATUS.JUMPDOWN;
              }
            } else if (this.status === STATUS.FIREATTACK) {
              // Fire attack can return to IDLE
              this.status = STATUS.IDLE;
            } else {
              // Regular attack (A1) returns to IDLE
              this.status = STATUS.IDLE;
            }
          }
        }
      }
    }
  }

  /**
   * Change to new animation
   * @param {string} newAnimation - Animation name
   */
  changeAnimation(newAnimation) {
    if (this.currentAnimation === newAnimation) return;
    
    console.log(`Changing animation from ${this.currentAnimation} to ${newAnimation}`);
    this.currentAnimation = newAnimation;
    this.animationFrame = 0;
    this.frameTime = 0;
    
    // Immediately update to first frame of new animation
    this.updateSpriteFrame();
  }

  /**
   * Update sprite to current animation frame
   */
  updateSpriteFrame() {
    if (!this.sprite || !this.textureCache.has(this.currentAnimation)) return;
    
    const textures = this.textureCache.get(this.currentAnimation);
    if (textures.length > 0 && this.animationFrame < textures.length) {
      const newTexture = textures[this.animationFrame];
      if (newTexture && this.sprite instanceof PIXI.Sprite) {
        this.sprite.texture = newTexture;
        // Maintain anchor after texture change
        this.sprite.anchor.set(0.5, 1.0);
      }
    }
  }

  /**
   * Check if player is currently attacking
   * @returns {boolean} True if attacking
   */
  isAttacking() {
    return this.status === STATUS.A1 || 
           this.status === STATUS.A2 || 
           this.status === STATUS.A3 || 
           this.status === STATUS.FIREATTACK || 
           this.status === STATUS.JUMPATTACK;
  }

  /**
   * Render player with proper sprite
   * @returns {boolean} Success status
   */
  render() {
    if (!this.visible || this.destroyed || !this.sprite) return true;

    try {
      // Add sprite to stage if not already added - WITH SAFETY CHECK
      const app = this.device?.getApp();
      if (app && app.stage && !this.sprite.parent) {
        app.stage.addChild(this.sprite);
        console.log('Player sprite added to stage via render() - should only happen ONCE');
      }

      // Update sprite position
      this.sprite.x = this.x;
      this.sprite.y = this.y;

      // Set scale based on direction (flip horizontally for left)
      this.sprite.scale.x = this.direction === DIRECTION.LEFT ? -1 : 1;
      this.sprite.scale.y = 1;

      // Add dash trail effect for visual enhancement
      if (this.isDashing && this.dashPhase === 'moving') {
        this.renderDashTrail();
      }

      // Add super jump trail effect for visual enhancement
      if (this.isSuperJumping) {
        this.renderSuperJumpTrail();
      }

      // For now, just keep IDLE texture - don't change textures frequently
      // We'll implement animation system later
      
      return true;

    } catch (error) {
      console.error('Error rendering player:', error);
      return false;
    }
  }

  /**
   * Update sprite texture based on current status
   */
  async updateSpriteTexture() {
    if (!this.sprite || this.sprite instanceof PIXI.Graphics) return;

    try {
      let texturePath = '';
      
      // For now, just show IDLE texture regardless of status
      // We'll implement full animation system later
      switch (this.status) {
        case STATUS.IDLE:
        default:
          texturePath = '/assets/textures/Single/IDLE.png';
          break;
      }

      // Only load new texture if it's different
      if (this.currentTexturePath !== texturePath) {
        const texture = await this.textureManager.loadTexture('CURRENT_SPRITE', texturePath);
        if (texture && this.sprite instanceof PIXI.Sprite) {
          this.sprite.texture = texture;
          this.currentTexturePath = texturePath;
          
          // Update anchor after texture change
          this.sprite.anchor.set(0.5, 1.0);
        }
      }
    } catch (error) {
      console.error('Error updating sprite texture:', error);
    }
  }

  /**
   * Render spawn animation
   */
  renderSpawn() {
    // Implementation for spawn animation rendering
    // This would show the teleport-in effect
    console.log('Rendering spawn animation');
  }

  /**
   * Static method to trigger spawn
   */
  static setSpawn() {
    // This would be called to spawn the player
    console.log('Player spawn triggered');
  }

  /**
   * Get player position
   * @returns {Object} Position {x, y}
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Render dash trail effect for visual enhancement
   */
  renderDashTrail() {
    if (!this.isDashing || this.dashPhase !== 'moving') return;
    
    try {
      // Create a simple trail effect using PIXI Graphics
      const device = this.device || this.objectSortManager?.device;
      if (!device?.getApp()?.stage) return;
      
      const trail = new PIXI.Graphics();
      trail.beginFill(0xAACCFF, 0.4); // Light blue with transparency
      trail.drawRect(-15, -20, 30, 40); // Rectangle behind player
      trail.endFill();
      
      // Position trail slightly behind player based on direction
      const offsetX = this.direction === DIRECTION.RIGHT ? -25 : 25;
      trail.x = this.x + offsetX;
      trail.y = this.y - 20;
      trail.alpha = 0.6;
      
      // Add to stage with lower z-index (below player)
      device.getApp().stage.addChildAt(trail, 0);
      
      // Simple fade out using timeout (fallback if no animation library)
      setTimeout(() => {
        if (trail && trail.parent) {
          let alpha = 0.6;
          const fadeInterval = setInterval(() => {
            alpha -= 0.05;
            if (alpha <= 0 || !trail.parent) {
              clearInterval(fadeInterval);
              if (trail.parent) {
                trail.parent.removeChild(trail);
              }
              trail.destroy();
            } else {
              trail.alpha = alpha;
            }
          }, 16); // ~60fps
        }
      }, 50);
      
    } catch (error) {
      console.warn('Error creating dash trail:', error);
    }
  }

  /**
   * Render super jump trail effect for visual enhancement
   */
  renderSuperJumpTrail() {
    if (!this.isSuperJumping) return;
    
    try {
      // Create a more dramatic trail effect for super jump
      const device = this.device || this.objectSortManager?.device;
      if (!device?.getApp()?.stage) return;
      
      const trail = new PIXI.Graphics();
      // Orange/yellow trail for super jump
      trail.beginFill(0xFFAA00, 0.5); // Orange with transparency
      trail.drawRect(-20, -25, 40, 50); // Larger rectangle for super jump
      trail.endFill();
      
      // Create additional energy effect
      const energy = new PIXI.Graphics();
      energy.beginFill(0xFFFF00, 0.3); // Yellow energy
      energy.drawCircle(0, -10, 25); // Circle around player
      energy.endFill();
      
      // Position trail behind and around player
      trail.x = this.x;
      trail.y = this.y - 25;
      trail.alpha = 0.7;
      
      energy.x = this.x;
      energy.y = this.y - 15;
      energy.alpha = 0.5;
      
      // Add to stage with lower z-index (below player)
      device.getApp().stage.addChildAt(trail, 0);
      device.getApp().stage.addChildAt(energy, 0);
      
      // Enhanced fade out with pulsing effect
      setTimeout(() => {
        if (trail && trail.parent && energy && energy.parent) {
          let alpha = 0.7;
          let energyAlpha = 0.5;
          const fadeInterval = setInterval(() => {
            alpha -= 0.04;
            energyAlpha -= 0.03;
            
            if (alpha <= 0 || !trail.parent || !energy.parent) {
              clearInterval(fadeInterval);
              if (trail.parent) {
                trail.parent.removeChild(trail);
              }
              if (energy.parent) {
                energy.parent.removeChild(energy);
              }
              trail.destroy();
              energy.destroy();
            } else {
              trail.alpha = alpha;
              energy.alpha = energyAlpha;
              // Add slight scaling effect
              energy.scale.set(1 + (0.5 - energyAlpha) * 0.5);
            }
          }, 16); // ~60fps
        }
      }, 30);
      
    } catch (error) {
      console.warn('Error creating super jump trail:', error);
    }
  }

  /**
   * Set player position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.transform.position.x = x;
    this.transform.position.y = y;
  }
}