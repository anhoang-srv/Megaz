// Game constants ported from C++ Define.h
export const GAME_CONFIG = {
  WINDOW_WIDTH: 800,
  WINDOW_HEIGHT: 600,
  TARGET_FPS: 60,
  FRAME_TIME: 16, // 60 FPS = 16ms per frame
};

// Direction enum (from C++ Enum.h)
export const DIRECTION = {
  LEFT: 0,
  RIGHT: 1,
  UP: 2,
  DOWN: 3,
};

// Field/Stage enum
export const FIELD = {
  STAGE_LOGO: 0,
  STAGE_ONE: 1,
  STAGE_TWO: 2,
};

// Object layer numbers for sorting
export const OBJ_NUM = {
  BG: 0,          // Background 1
  BG2: 1,         // Background 2
  BG3: 2,         // Background 3
  BG4: 3,         // Background 4
  WALL: 4,        // Walls
  PLATFORM: 5,    // Platforms
  MONSTER: 6,     // Monsters
  PLAYER: 7,      // Player
  UI: 8,          // UI elements
};

// Sound indices
export const SOUND_INDEX = {
  THEME: 0,
  READY: 1,
  LAZER: 2,
  DASH: 3,
  JUMP: 4,
  PLAT: 5,
  A1: 6,
  A2: 7,
  A3: 8,
  SWORD: 9,
  BOMB: 10,
  FIRE: 11,
  DAMAGED: 12,
  DESTROY: 13,
};

// Player status enum
export const STATUS = {
  ATTACKED: 0,
  IDLE: 1,
  WALK: 2,
  DASH: 3,
  DASHEND: 4,
  JUMPSTART: 5,
  JUMPOFF: 6,
  JUMPDOWN: 7,
  WALL: 8,
  DAMAGED: 9,
  A1: 10,
  A2: 11,
  A3: 12,
  FIREATTACK: 13,
  JUMPATTACK: 14,
};

// Position station for collision detection
export const POS_STATION = {
  GROUND: 0,
  AIR: 1,
  ATTACH_WALL: 2,
};

// Render types
export const RENDER_TYPE = {
  STRAIGHT: 0,
  FLASH: 1,
  FADING: 2,
};

// Texture types
export const TEX_TYPE = {
  SINGLE: 0,
  MULTI: 1,
};