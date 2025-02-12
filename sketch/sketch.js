import { Game } from './js/Game.js';
import { GAME_WIDTH, GAME_HEIGHT } from './js/config.js';

let game;
let cameraZ = 1500; // Initial camera distance
const MIN_ZOOM = 200;
const MAX_ZOOM = 1500;
let myFont;

window.preload = function () {
  // Load font directly from Google Fonts
  myFont = loadFont('https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-400-normal.woff');
}

window.setup = function () {
  const canvas = createCanvas(GAME_WIDTH, GAME_HEIGHT, WEBGL);
  canvas.parent('canvas-container');
  textFont(myFont);
  game = new Game(window);

  // Add mousewheel event listener for zoom
  canvas.mouseWheel((event) => {
    // Make zoom more responsive
    cameraZ = constrain(cameraZ + event.delta, MIN_ZOOM, MAX_ZOOM);
    event.preventDefault(); // Prevent page scrolling
    return false;
  });
}

window.draw = function () {
  background(255);

  // Set up perspective
  perspective(PI / 3, width / height, 0.1, MAX_ZOOM * 2);

  // Adjust camera position and target
  camera(0, -200, cameraZ,  // Camera position (x, y, z)
    0, 0, 0,           // Look at point (x, y, z)
    0, 1, 0);         // Up vector (x, y, z)

  game.update();
  game.draw();
}

window.windowResized = function () {
  // No need to handle resize - CSS takes care of it
}
