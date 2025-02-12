import { PEG_SETTINGS, GAME_WIDTH, GAME_HEIGHT } from './config.js';

export class Peg {
  constructor(x, y, movingRight) {
    this.x = x;
    this.y = y;
    this.radius = PEG_SETTINGS.radius;
    this.movingRight = movingRight;
  }

  update() {
    if (this.movingRight) {
      this.x += PEG_SETTINGS.speed;
      if (this.x > GAME_WIDTH) this.x = 0;
    } else {
      this.x -= PEG_SETTINGS.speed;
      if (this.x < 0) this.x = GAME_WIDTH;
    }
  }

  handleCollision(ball, p5) {
    const d = p5.dist(ball.x, ball.y, this.x, this.y);
    if (d < ball.radius + this.radius) {
      // Calculate normal vector from peg to ball
      const nx = (ball.x - this.x) / d;
      const ny = (ball.y - this.y) / d;

      // Calculate relative velocity
      const relativeVelocityX = ball.velocity.x;
      const relativeVelocityY = ball.velocity.y;

      // Calculate velocity along normal
      const normalVelocity = relativeVelocityX * nx + relativeVelocityY * ny;

      // Only reflect if objects are moving toward each other
      if (normalVelocity < 0) {
        // Reflect velocity with some energy loss
        const restitution = 0.7; // Bounce factor (0-1)
        ball.velocity.x -= (1 + restitution) * normalVelocity * nx;
        ball.velocity.y -= (1 + restitution) * normalVelocity * ny;

        // Move ball outside of peg
        const overlap = ball.radius + this.radius - d;
        ball.x += overlap * nx;
        ball.y += overlap * ny;
        return true;
      }
    }
    return false;
  }

  draw(p5) {
    p5.push();
    p5.translate(this.x - GAME_WIDTH / 2, this.y - GAME_HEIGHT / 2, 0);
    p5.ambientMaterial(0);
    p5.noStroke();
    p5.cylinder(this.radius, this.radius * 4);
    p5.pop();
  }
} 