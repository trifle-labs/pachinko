import { Game } from './js/Game.js';
import { GAME_WIDTH, GAME_HEIGHT } from './js/config.js';

let game;

window.setup = function () {
  const canvas = createCanvas(GAME_WIDTH, GAME_HEIGHT);
  canvas.parent('canvas-container');
  game = new Game(window);
}

window.draw = function () {
  game.update();
  game.draw();
}

window.windowResized = function () {
  // No need to handle resize - CSS takes care of it
}
