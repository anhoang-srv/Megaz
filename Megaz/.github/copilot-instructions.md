# MegaMan X4 Web - Development Guidelines

## Project Overview
MegaMan X4 Web is a JavaScript port of the MegaMan X4 game from C++ to run in modern web browsers. It uses PIXI.js for rendering, with a modular architecture similar to the original C++ codebase.

## Architecture

### Core Components
- **Device.js**: PIXI.js wrapper (C++ DirectX equivalent)
- **MainGame.js**: Game loop and main controller
- **Managers**: Singleton classes accessed via getter functions (e.g., `getKeyManager()`)
- **GameObjects**: Player, enemies, and environment elements

### Key Design Patterns
- **Singleton Pattern**: All managers follow this pattern - import with `getXManager()` functions
- **State Machine**: Player and enemy states use explicit state transitions (see `STATUS` enum)
- **Layer System**: Objects are sorted by `OBJ_NUM` enum values for correct rendering order

## Code Conventions

<!-- ### State Management
- Use state enums from `constants.js` (STATUS, DIRECTION, etc.) instead of magic strings/numbers
- Implement state transitions in switch-case blocks for clarity
- Track state changes with explicit flags (e.g., `isDashing`, `isOnGround`)

```javascript
// Example state machine pattern from Player.js
switch (this.status) {
  case STATUS.IDLE:
  case STATUS.WALK:
    // Handle ground states
    break;
  case STATUS.JUMPSTART:
  case STATUS.JUMPDOWN:
    // Handle air states
    break;
}
``` -->

### State Management
**State Machine Architecture**
  - **Core Principles**
    - **Single Source of Truth**: Each character has exactly one state at any time
    - **Clear Transitions**: Define explicit conditions for state transitions
    - **Priority System**: Implement input priority to resolve conflicts
    - **State Isolation**: Each state handles its own update logic and transitions
Implementation Structure:
- State Definition:
    // In constants.js
export const STATUS = {
  IDLE: 0,
  WALK: 1,
  DASH: 2,
  JUMPSTART: 3,
  JUMPUP: 4,
  JUMPDOWN: 5,
  WALLJUMP: 6,
  DASH_JUMP: 7,
  ATTACK: 8,
  SPECIAL: 9,
  DAMAGED: 10,
  // Add more as needed
};
- State Manager Pattern:
// Character class structure
class Character extends GameObject {
  constructor() {
    super();
    this.status = STATUS.IDLE;
    this.previousStatus = STATUS.IDLE;
    this.stateTimer = 0;
    this.inputBuffer = [];
    this.inputBufferTime = 8; // Frames to remember input
  }
  
  update(deltaTime) {
    this.updateInputBuffer();
    this.updateState(deltaTime);
    this.updateAnimation();
    this.updatePhysics(deltaTime);
  }
  
  updateState(deltaTime) {
    this.previousStatus = this.status;
    this.stateTimer += deltaTime;
    
    // Call current state handler
    switch(this.status) {
      case STATUS.IDLE:    this.handleIdleState(deltaTime);    break;
      case STATUS.WALK:    this.handleWalkState(deltaTime);    break;
      case STATUS.DASH:    this.handleDashState(deltaTime);    break;
      case STATUS.JUMPUP:  this.handleJumpUpState(deltaTime);  break;
      // Additional states...
    }
    
    // Reset timer if state changed
    if (this.status !== this.previousStatus) {
      this.stateTimer = 0;
      this.onStateEnter(this.status);
    }
  }
}

**Input Handling**
- Input Priority System:
updateInputBuffer() {
  const keyManager = getKeyManager();
  
  // Clear expired inputs
  this.inputBuffer = this.inputBuffer.filter(input => 
    input.timeRemaining > 0);
  
  // Add new inputs with priority values
  if (keyManager.isKeyDown(KEY.JUMP) && !this.wasKeyDown(KEY.JUMP)) {
    this.inputBuffer.push({
      key: KEY.JUMP,
      priority: 3,
      timeRemaining: this.inputBufferTime
    });
  }
  
  if (keyManager.isKeyDown(KEY.ATTACK) && !this.wasKeyDown(KEY.ATTACK)) {
    this.inputBuffer.push({
      key: KEY.ATTACK,
      priority: 2,
      timeRemaining: this.inputBufferTime
    });
  }
  
  // Decrease remaining time for buffered inputs
  this.inputBuffer.forEach(input => {
    input.timeRemaining--;
  });
}

getHighestPriorityInput() {
  if (this.inputBuffer.length === 0) return null;
  return this.inputBuffer.reduce((highest, current) => 
    current.priority > highest.priority ? current : highest,
    this.inputBuffer[0]);
}

- State Transition Logic:
handleIdleState(deltaTime) {
  const keyManager = getKeyManager();
  const highPriorityInput = this.getHighestPriorityInput();
  
  // Handle transitions based on priority
  if (highPriorityInput && highPriorityInput.key === KEY.JUMP) {
    this.status = STATUS.JUMPSTART;
    this.removeInputFromBuffer(KEY.JUMP);
    return;
  }
  
  if (highPriorityInput && highPriorityInput.key === KEY.ATTACK) {
    this.status = STATUS.ATTACK;
    this.removeInputFromBuffer(KEY.ATTACK);
    return;
  }
  
  // Lower priority inputs
  if (keyManager.isKeyDown(KEY.LEFT) || keyManager.isKeyDown(KEY.RIGHT)) {
    if (keyManager.isKeyDoublePressed(KEY.LEFT) || 
        keyManager.isKeyDoublePressed(KEY.RIGHT)) {
      this.status = STATUS.DASH;
    } else {
      this.status = STATUS.WALK;
    }
    return;
  }
  
  // Default behavior for this state
  // ...
}

**Preventing Common Issues**
- State Lock Prevention:
// For states that need to complete (like attacks)
handleAttackState(deltaTime) {
  // Animation must complete before state change
  if (this.stateTimer < this.attackDuration) {
    // Allow only emergency transitions during attack
    if (this.health <= 0) {
      this.status = STATUS.DAMAGED;
    }
    return;
  }
  
  // After completion, allow transitions
  this.status = STATUS.IDLE;
}

- Interrupt System:
// Define which states can interrupt others
canInterruptCurrentState(newState) {
  // Damaged state can interrupt almost anything
  if (newState === STATUS.DAMAGED) {
    return this.status !== STATUS.SPECIAL_INVULNERABLE;
  }
  
  // Jump can interrupt idle or walk
  if (newState === STATUS.JUMPSTART) {
    return [STATUS.IDLE, STATUS.WALK].includes(this.status);
  }
  
  // Add more rules as needed...
  return false;
}

// Use this when attempting state changes
attemptStateChange(newState) {
  if (this.status === newState) return true; // Already in this state
  
  if (this.canInterruptCurrentState(newState)) {
    this.status = newState;
    return true;
  }
  
  return false;
}

**State Entry/Exit Actions**
onStateEnter(newState) {
  switch(newState) {
    case STATUS.JUMPSTART:
      this.velocity.y = this.jumpPower;
      this.playSound("jump");
      break;
    case STATUS.DASH:
      this.dashVelocity = this.facing === DIRECTION.RIGHT ? 
        this.dashSpeed : -this.dashSpeed;
      this.dashTimeRemaining = this.dashDuration;
      break;
    // Handle other states...
  }
}

onStateExit(oldState) {
  switch(oldState) {
    case STATUS.DASH:
      this.velocity.x = 0; // Reset velocity after dash
      break;
    // Handle other states...
  }
}




### Animation System
- Animations defined in object classes with frame count, speed, and path properties
- Support both single spritesheet and multi-file animation formats
- Use `changeAnimation()` method to switch animations

### Physics Implementation
- Each game object handles its own physics in `updatePhysics(deltaTime)`
- Use deltaTime from TimeManager for frame-rate independent movement
- Gravity applies to objects with `positionStation === POS_STATION.AIR`

## Development Workflow

### Setup & Run
```bash
npm install    # Install dependencies
npm run dev    # Start development server
npm run build  # Build for production
```

### Asset Requirements
- Textures go in `public/assets/textures/`
- Audio files go in `public/assets/sounds/` (convert from WAV to OGG/MP3)
- Update `manifest.json` when adding new assets

## Common Tasks

### Adding a New Game Object
1. Create class that extends GameObject
2. Define states, animations, and physics
3. Register with ObjectSortManager using appropriate `OBJ_NUM` layer
4. Implement `update()` and `render()` methods

### Debugging
- Use browser DevTools console for logging
- Debug flags can be toggled in constants.js
- Player spawn position can be adjusted with O key
- Enemy spawn for testing with P key

## Known Issues & Limitations
- Simultaneous key presses can cause state conflicts (use state machine approach)
- Animation frame timing depends on requestAnimationFrame precision
- Touch controls not yet implemented for mobile