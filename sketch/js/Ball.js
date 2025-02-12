import { BALL_RADIUS, GRAVITY, GAME_WIDTH, GAME_HEIGHT } from './config.js';

export class Ball {
  constructor(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.z = 0;
    this.velocity = velocity;
    this.radius = BALL_RADIUS;
  }

  update() {
    this.velocity.y += GRAVITY;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.z += this.velocity.z || 0;
  }

  draw(p5) {
    p5.push();
    p5.translate(this.x - GAME_WIDTH / 2, this.y - GAME_HEIGHT / 2, this.z);
    p5.ambientMaterial(200);
    p5.noStroke();
    p5.sphere(this.radius);
    p5.pop();
  }

  drawHighlight(p5) {
    const lightSourceX = 50;
    const lightSourceY = p5.height / 2;
    const angleToLight = p5.atan2(lightSourceY - this.y, lightSourceX - this.x);

    const highlightX = this.x + p5.cos(angleToLight) * (this.radius * 0.5);
    const highlightY = this.y + p5.sin(angleToLight) * (this.radius * 0.5);

    p5.fill(255);
    p5.circle(highlightX, highlightY, this.radius * 1.1);
  }

  handleSpinnerCollision(spinner, p5) {
    for (let i = 0; i < 3; i++) {
      const angle = spinner.rotation + (p5.TWO_PI / 3) * i;
      const circleX = spinner.x + p5.cos(angle) * spinner.armLength;
      const circleY = spinner.y + p5.sin(angle) * spinner.armLength;

      const d = p5.dist(this.x, this.y, circleX, circleY);
      if (d < this.radius + spinner.circleRadius) {
        // Calculate spinner's velocity at the point of impact
        const spinnerVel = p5.createVector(
          -p5.sin(angle) * spinner.angularVel * spinner.armLength,
          p5.cos(angle) * spinner.angularVel * spinner.armLength
        );

        // Calculate relative velocity
        const relativeVel = p5.createVector(
          this.velocity.x - spinnerVel.x,
          this.velocity.y - spinnerVel.y
        );

        // Calculate normal vector
        const normal = p5.createVector(this.x - circleX, this.y - circleY).normalize();

        // Reflect relative velocity
        const dot = relativeVel.x * normal.x + relativeVel.y * normal.y;
        this.velocity.x = relativeVel.x - 2 * dot * normal.x + spinnerVel.x;
        this.velocity.y = relativeVel.y - 2 * dot * normal.y + spinnerVel.y;

        // Move ball outside of collision
        this.x = circleX + normal.x * (this.radius + spinner.circleRadius);
        this.y = circleY + normal.y * (this.radius + spinner.circleRadius);

        // Add energy loss
        this.velocity.mult(0.8);

        // Apply force to spinner
        spinner.angularVel += (this.velocity.x * normal.y - this.velocity.y * normal.x) * 0.001;
        return true;
      }
    }
    return false;
  }
} 