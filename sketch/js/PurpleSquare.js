import { GAME_WIDTH, GAME_HEIGHT, SQUARE } from './config.js';

export class PurpleSquare {
  constructor() {
    this.x = SQUARE.x;
    this.y = SQUARE.y;
    this.size = SQUARE.size;
    this.mouthSize = SQUARE.mouthSize;
    this.rotation = 0;
    this.rotationSpeed = SQUARE.rotationSpeed;
    this.mouthFlash = 0;
  }

  update() {
    this.rotation += this.rotationSpeed;
  }

  draw(p5) {
    p5.push();
    p5.translate(this.x - GAME_WIDTH / 2, this.y - GAME_HEIGHT / 2, 0);
    p5.rotateZ(this.rotation);

    // Draw cube body
    p5.ambientMaterial(128, 0, 128);
    p5.box(this.size, this.size, this.size / 2);

    // Draw mouth
    p5.push();
    p5.translate(0, this.size / 2 - this.mouthSize / 2, this.size / 2);
    if (this.mouthFlash > 0) {
      p5.ambientMaterial(0, 255, 0);
      this.mouthFlash--;
    } else {
      p5.ambientMaterial(0);
    }
    p5.box(this.mouthSize, this.mouthSize, 10);
    p5.pop();

    // Draw eyes
    p5.noStroke();  // Remove lines from spheres
    p5.detailX = 16;  // Increase sphere detail
    p5.detailY = 16;  // Increase sphere detail

    p5.push();
    p5.translate(-this.size / 4, -this.size / 4, this.size / 2);
    p5.ambientMaterial(255);
    p5.sphere(10);
    p5.translate(2, 0, 2);
    p5.ambientMaterial(0);
    p5.sphere(4);
    p5.pop();

    p5.push();
    p5.translate(this.size / 4, -this.size / 4, this.size / 2);
    p5.ambientMaterial(255);
    p5.sphere(10);
    p5.translate(2, 0, 2);
    p5.ambientMaterial(0);
    p5.sphere(4);
    p5.pop();

    p5.pop();
  }
} 