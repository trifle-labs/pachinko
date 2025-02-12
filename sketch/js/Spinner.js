import { GAME_WIDTH, GAME_HEIGHT, SPINNER } from './config.js';

export class Spinner {
  constructor() {
    this.x = SPINNER.x;
    this.y = SPINNER.y;
    this.radius = SPINNER.radius;
    this.armLength = SPINNER.armLength;
    this.circleRadius = SPINNER.circleRadius;
    this.rotation = 0;
    this.angularVel = 0;
    this.friction = SPINNER.friction;
  }

  update() {
    this.rotation += this.angularVel;
    this.angularVel *= this.friction;
  }

  draw(p5) {
    p5.push();
    p5.translate(this.x - GAME_WIDTH / 2, this.y - GAME_HEIGHT / 2, 0);
    p5.rotateZ(this.rotation);

    // Draw arms
    for (let i = 0; i < 3; i++) {
      const angle = (p5.TWO_PI / 3) * i;
      p5.push();
      p5.rotateZ(angle);
      p5.translate(this.armLength / 2, 0, 0);
      p5.ambientMaterial(0);
      p5.box(this.armLength, 8, 8);
      p5.pop();
    }

    // Draw spheres at the ends
    p5.noStroke();  // Remove lines from spheres
    p5.detailX = 16;  // Increase sphere detail
    p5.detailY = 16;  // Increase sphere detail

    for (let i = 0; i < 3; i++) {
      const angle = (p5.TWO_PI / 3) * i;
      const x = p5.cos(angle) * this.armLength;
      const y = p5.sin(angle) * this.armLength;

      p5.push();
      p5.translate(x, y, 0);

      if (i === 0) p5.ambientMaterial(0, 255, 255);
      if (i === 1) p5.ambientMaterial(255, 0, 0);
      if (i === 2) p5.ambientMaterial(255, 255, 0);

      p5.sphere(this.circleRadius);
      p5.pop();
    }
    p5.pop();
  }
} 