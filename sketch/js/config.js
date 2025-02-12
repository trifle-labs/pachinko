// Base dimensions that everything will be relative to
export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

// Game settings
export const BALL_RADIUS = 10;
export const BALL_SPEED = 5;
export const GRAVITY = 0.2;
export const STARTING_BALANCE = 100;
export const BALL_RELEASE_DELAY = 20;

// Spinner settings
export const SPINNER = {
  x: GAME_WIDTH * 0.3,
  y: GAME_HEIGHT * 0.55,
  radius: 15,
  armLength: 60,
  circleRadius: 25,
  friction: 0.9
};

// Purple square settings
export const SQUARE = {
  x: GAME_WIDTH * 0.7,
  y: GAME_HEIGHT * 0.4,
  size: 120,
  mouthSize: 50,
  rotationSpeed: 0.02
};

// Zone settings
export const ZONE_WIDTH = 20;
export const MIN_ZONE_REWARD = 1;
export const MAX_ZONE_REWARD = 15;
export const BASE_REWARD = 10;

// Peg settings
export const PEG_SETTINGS = {
  speed: 2,
  radius: 10,
  rows: 6,
  pegsPerRow: 5
}; 