import { Ball } from './Ball.js';
import { Spinner } from './Spinner.js';
import { Peg } from './Peg.js';
import { PurpleSquare } from './PurpleSquare.js';
import {
  GAME_WIDTH, GAME_HEIGHT, BALL_SPEED, STARTING_BALANCE,
  BALL_RELEASE_DELAY, PEG_SETTINGS, ZONE_WIDTH
} from './config.js';
import { Zone } from './Zone.js';

let myFont;

function preload() {
  // Load font from a local file in your project
  myFont = loadFont('assets/fonts/Roboto-Regular.ttf');
}

function setup() {
  textFont(myFont);
}

export class Game {
  constructor(p5) {
    this.p5 = p5;
    this.balls = [];
    this.pegs = [];
    this.spinner = new Spinner();
    this.purpleSquare = new PurpleSquare();
    this.ballBalance = STARTING_BALANCE;
    this.lastReleaseTime = 0;
    this.attempts = 0;
    this.scores = 0;
    this.showPegs = true;
    this.zones = [];
    this.totalHits = 0;

    this.initializePegs();
    this.initializeZones();
  }

  initializePegs() {
    const pegSpacingX = GAME_WIDTH / (PEG_SETTINGS.pegsPerRow + 1);
    const pegOffsetX = pegSpacingX;

    // Bottom three rows become top rows
    for (let row = 0; row < 3; row++) {
      let yPos = GAME_HEIGHT - 150 - row * 50; // Flipped position
      for (let col = 0; col < PEG_SETTINGS.pegsPerRow; col++) {
        this.pegs.push(new Peg(
          pegOffsetX + col * (GAME_WIDTH / PEG_SETTINGS.pegsPerRow),
          yPos,
          row % 2 === 0
        ));
      }
    }

    // Top three rows become bottom rows
    for (let row = 0; row < 3; row++) {
      let yPos = GAME_HEIGHT - 650 - row * 50; // Flipped position
      for (let col = 0; col < PEG_SETTINGS.pegsPerRow; col++) {
        this.pegs.push(new Peg(
          pegOffsetX + col * (GAME_WIDTH / PEG_SETTINGS.pegsPerRow),
          yPos,
          row % 2 === 0
        ));
      }
    }
  }

  initializeZones() {
    const numZones = Math.ceil(GAME_WIDTH / ZONE_WIDTH);
    for (let i = 0; i < numZones; i++) {
      this.zones.push(new Zone(i * ZONE_WIDTH));
    }
  }

  update() {
    this.spinner.update();
    this.purpleSquare.update();
    if (this.showPegs) {
      this.pegs.forEach(peg => peg.update());
    }
    this.updateBalls();
    this.handleInput();
  }

  updateBalls() {
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      ball.update();

      // Check for zone collision
      if (ball.y > GAME_HEIGHT - 50 && ball.y < GAME_HEIGHT) {
        const zoneIndex = Math.floor(ball.x / ZONE_WIDTH);
        if (zoneIndex >= 0 && zoneIndex < this.zones.length) {
          this.zones[zoneIndex].hits++;
          this.totalHits++;
          this.ballBalance += this.zones[zoneIndex].reward;
          this.scores++;
          this.balls.splice(i, 1);
        }

        continue;
      }

      // Check collisions
      if (this.showPegs) {
        this.checkPegCollisions(ball);
      }
      this.checkSpinnerCollision(ball);
      this.checkPurpleSquareCollision(ball);

      // Remove balls that go far outside the bounds
      if (ball.x < -GAME_WIDTH ||
        ball.x > GAME_WIDTH * 2 ||
        ball.y > GAME_HEIGHT * 2) {
        this.balls.splice(i, 1);
        continue;
      }

      // Check for scoring (when ball reaches top)
      if (ball.y < 50) {
        this.scores++;
        this.balls.splice(i, 1);
        continue;
      }
    }
  }

  checkPegCollisions(ball) {
    if (this.showPegs) {
      for (let peg of this.pegs) {
        if (peg.handleCollision(ball, this.p5)) {
          break;
        }
      }
    }
  }

  checkSpinnerCollision(ball) {
    // First check collision with circles at the ends
    for (let i = 0; i < 3; i++) {
      const angle = this.spinner.rotation + (this.p5.TWO_PI / 3) * i;
      const circleX = this.spinner.x + this.p5.cos(angle) * this.spinner.armLength;
      const circleY = this.spinner.y + this.p5.sin(angle) * this.spinner.armLength;

      // Check collision with circles
      const d = this.p5.dist(ball.x, ball.y, circleX, circleY);
      if (d < ball.radius + this.spinner.circleRadius) {
        // Store original ball velocity for impact calculation
        const originalVelocity = this.p5.createVector(ball.velocity.x, ball.velocity.y);

        // Calculate spinner's velocity at the point of impact
        const spinnerVelocity = this.p5.createVector(
          -this.p5.sin(angle) * this.spinner.angularVel * this.spinner.armLength,
          this.p5.cos(angle) * this.spinner.angularVel * this.spinner.armLength
        );

        // Calculate relative velocity
        const relativeVelocity = this.p5.createVector(
          ball.velocity.x - spinnerVelocity.x,
          ball.velocity.y - spinnerVelocity.y
        );

        // Calculate normal vector (from circle to ball)
        const normal = this.p5.createVector(ball.x - circleX, ball.y - circleY);
        normal.normalize();

        // Reflect relative velocity
        const dot = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y;
        const reflectedVelocity = this.p5.createVector(
          relativeVelocity.x - 2 * dot * normal.x,
          relativeVelocity.y - 2 * dot * normal.y
        );

        // Add spinner's velocity back to get final ball velocity
        ball.velocity.x = reflectedVelocity.x + spinnerVelocity.x;
        ball.velocity.y = reflectedVelocity.y + spinnerVelocity.y;

        // Calculate impact direction for spinner rotation
        const impactPoint = this.p5.createVector(
          circleX - this.spinner.x,
          circleY - this.spinner.y
        );

        // Calculate direct force impact
        const impactForce = originalVelocity.mag() * 0.0005;
        const directionalImpact = normal.copy().mult(impactForce);

        // Calculate rotational impact (torque)
        const torque = impactPoint.x * originalVelocity.y - impactPoint.y * originalVelocity.x;

        // Combine both effects
        this.spinner.angularVel += torque * 0.0001;
        this.spinner.rotation += directionalImpact.y; // Apply direct force impact to rotation

        // Move ball out of collision
        ball.x = circleX + normal.x * (ball.radius + this.spinner.circleRadius);
        ball.y = circleY + normal.y * (ball.radius + this.spinner.circleRadius);

        ball.velocity.mult(0.8); // Energy loss
        break;
      }
    }
  }

  checkPurpleSquareCollision(ball) {
    // Transform ball position relative to square
    const dx = ball.x - this.purpleSquare.x;
    const dy = ball.y - this.purpleSquare.y;
    const angle = -this.purpleSquare.rotation;
    const rotatedX = dx * this.p5.cos(angle) - dy * this.p5.sin(angle);
    const rotatedY = dx * this.p5.sin(angle) + dy * this.p5.cos(angle);

    // Check if within square bounds
    const halfSize = this.purpleSquare.size / 2;
    if (Math.abs(rotatedX) < halfSize && Math.abs(rotatedY) < halfSize) {
      // Calculate normal in rotated space
      let normalX = 0;
      let normalY = 0;

      if (Math.abs(rotatedX) > Math.abs(rotatedY)) {
        normalX = rotatedX > 0 ? 1 : -1;
      } else {
        normalY = rotatedY > 0 ? 1 : -1;
      }

      // Rotate normal back to world space
      const worldNormalX = normalX * this.p5.cos(-angle) - normalY * this.p5.sin(-angle);
      const worldNormalY = normalX * this.p5.sin(-angle) + normalY * this.p5.cos(-angle);

      // Reflect velocity
      const normal = this.p5.createVector(worldNormalX, worldNormalY);
      const dot = ball.velocity.x * normal.x + ball.velocity.y * normal.y;
      ball.velocity.x = ball.velocity.x - 2 * dot * normal.x;
      ball.velocity.y = ball.velocity.y - 2 * dot * normal.y;

      // Move ball outside square
      ball.x = this.purpleSquare.x + (halfSize + ball.radius) * worldNormalX;
      ball.y = this.purpleSquare.y + (halfSize + ball.radius) * worldNormalY;

      // Flash mouth
      this.purpleSquare.mouthFlash = 5;
    }
  }

  draw() {
    this.p5.background(255);

    // Add lighting
    this.p5.ambientLight(60);
    this.p5.pointLight(255, 255, 255, -GAME_WIDTH / 2, -GAME_HEIGHT / 2, 300);
    this.p5.pointLight(255, 255, 255, GAME_WIDTH / 2, -GAME_HEIGHT / 2, 300);

    // Draw zones first (at the bottom)
    this.zones.forEach(zone => {
      zone.draw(this.p5, this.attempts, this.totalHits);
    });

    if (this.showPegs) {
      this.pegs.forEach(peg => peg.draw(this.p5));
    }
    this.spinner.draw(this.p5);
    this.purpleSquare.draw(this.p5);
    this.balls.forEach(ball => ball.draw(this.p5));
    this.drawUI();
  }

  handleInput() {
    if (this.p5.mouseIsPressed && this.ballBalance > 0) {
      const currentTime = this.p5.millis();
      if (currentTime - this.lastReleaseTime >= BALL_RELEASE_DELAY) {
        this.releaseBall();
      }
    }
  }

  releaseBall() {
    const cannonX = this.p5.constrain(this.p5.mouseX, 50, GAME_WIDTH - 50);
    this.balls.push(new Ball(
      cannonX,
      60,
      this.p5.createVector(0, BALL_SPEED)
    ));
    this.ballBalance--;
    this.attempts++;
    this.lastReleaseTime = this.p5.millis();
  }

  drawUI() {
    // Draw cannon
    const cannonX = this.p5.constrain(this.p5.mouseX, 60, GAME_WIDTH - 50);
    this.p5.push();
    this.p5.translate(cannonX - GAME_WIDTH / 2, 60 - GAME_HEIGHT / 2, 0);

    // Draw ball count text
    this.p5.push();
    this.p5.translate(0, -40, 0);
    this.p5.fill(0);
    this.p5.textSize(20);
    this.p5.textAlign(this.p5.CENTER);
    this.p5.text(this.ballBalance.toString(), 0, 0);
    this.p5.pop();

    // Draw cannon emoji
    this.p5.textSize(40);
    this.p5.textAlign(this.p5.CENTER);
    this.p5.text('🫳', 0, 0);
    this.p5.pop();
  }
} 