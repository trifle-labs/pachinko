// Game variables
let balls = [];
let pegs = [];
let spinner = {
  x: 390 / 2,        // Center of screen horizontally
  y: 844 / 2,        // Center of screen vertically
  radius: 15,      // Center circle radius
  armLength: 60,   // Length of each spinner arm
  circleRadius: 25,// Radius of end circles
  rotation: 0,     // Current rotation angle
  angularVel: 0,   // Angular velocity
  friction: 0.995  // Slight friction to eventually slow rotation
};
let ballBalance = 100;
let pegSpeed = 2;
let numPegsPerRow = 5;  // 5 pegs per row
let numRows = 6;        // 3 rows at top, 3 at bottom
let totalPegs = numPegsPerRow * numRows;
let ballSpeed = -5;
let gravity = -0.2;
let attempts = 0;
let showPegs = true;
let baseReward = 4;  // Base reward amount
let currentReward = baseReward;
let targetWinRate = 0.4;  // 40% target win rate
let rewardAdjustRate = 0.3;  // Increased from 0.1 to 0.3
let scores = 0;  // Add with other variables at top
let targetBalance = 1000;  // The balance we want to maintain
let minReward = 1;
let maxReward = 20;

function setup() {
  createCanvas(390, 844);

  // Initialize pegs
  let pegSpacingX = width / (numPegsPerRow + 1);
  let pegOffsetX = pegSpacingX;  // Start from the first position

  // Top three rows
  for (let row = 0; row < 3; row++) {
    let yPos = 150 + row * 50;  // Space rows 50 pixels apart
    for (let col = 0; col < numPegsPerRow; col++) {
      pegs.push({
        y: yPos,
        x: pegOffsetX + (col * (width / numPegsPerRow)),  // Evenly space across width
        radius: 10,
        movingRight: row % 2 === 0  // Alternate direction by row
      });
    }
  }

  // Bottom three rows
  for (let row = 0; row < 3; row++) {
    let yPos = 650 + row * 50;  // Space rows 50 pixels apart
    for (let col = 0; col < numPegsPerRow; col++) {
      pegs.push({
        y: yPos,
        x: pegOffsetX + (col * (width / numPegsPerRow)),  // Evenly space across width
        radius: 10,
        movingRight: row % 2 === 0  // Alternate direction by row
      });
    }
  }
}

function draw() {
  background(255);  // White background

  // Draw cannon and endzone (unchanged)
  let cannonX = constrain(mouseX, 50, width - 50);
  fill(100);
  rect(cannonX - 20, height - 60, 40, 40);
  fill(0, 255, 0, 100);
  rect(0, 0, width, 50);

  // Draw and update spinner
  push();
  translate(spinner.x, spinner.y);
  rotate(spinner.rotation);

  // Draw arms (black lines connecting circles)
  strokeWeight(8);
  stroke(0);
  for (let i = 0; i < 3; i++) {
    let angle = TWO_PI / 3 * i;
    line(0, 0, cos(angle) * spinner.armLength, sin(angle) * spinner.armLength);
  }

  // Draw circles at the ends
  noStroke();
  for (let i = 0; i < 3; i++) {
    let angle = TWO_PI / 3 * i;
    let x = cos(angle) * spinner.armLength;
    let y = sin(angle) * spinner.armLength;

    // Set color based on position (cyan, red, yellow)
    if (i === 0) fill(0, 255, 255);  // Cyan
    if (i === 1) fill(255, 0, 0);    // Red
    if (i === 2) fill(255, 255, 0);  // Yellow

    circle(x, y, spinner.circleRadius * 2);
  }
  pop();

  // Update spinner rotation
  spinner.rotation += spinner.angularVel;
  spinner.angularVel *= spinner.friction;

  // Update and draw pegs (modified to check visibility)
  if (showPegs) {
    for (let peg of pegs) {
      if (peg.movingRight) {
        peg.x += pegSpeed;
        if (peg.x > width) peg.x = 0;
      } else {
        peg.x -= pegSpeed;
        if (peg.x < 0) peg.x = width;
      }
      fill(0);
      circle(peg.x, peg.y, peg.radius * 2);
    }
  }

  // Update and draw balls with spinner collision
  for (let i = balls.length - 1; i >= 0; i--) {
    let ball = balls[i];
    ball.velocity.y += gravity;
    ball.x += ball.velocity.x;
    ball.y += ball.velocity.y;

    // Check collision with pegs only if showPegs is true
    if (showPegs) {
      for (let peg of pegs) {
        let d = dist(ball.x, ball.y, peg.x, peg.y);
        if (d < ball.radius + peg.radius) {
          // Calculate collision response
          let normal = createVector(ball.x - peg.x, ball.y - peg.y);
          normal.normalize();

          // Reflect velocity
          let dot = ball.velocity.x * normal.x + ball.velocity.y * normal.y;
          ball.velocity.x = ball.velocity.x - 2 * dot * normal.x;
          ball.velocity.y = ball.velocity.y - 2 * dot * normal.y;

          // Move ball out of collision
          ball.x = peg.x + normal.x * (ball.radius + peg.radius);
          ball.y = peg.y + normal.y * (ball.radius + peg.radius);

          ball.velocity.mult(0.8);  // Energy loss
          break;
        }
      }
    }

    // Check collision with spinner
    let ballToCenter = createVector(ball.x - spinner.x, ball.y - spinner.y);
    let ballToCenterDist = ballToCenter.mag();

    // Check collision with each circle and arm
    let collision = false;
    for (let j = 0; j < 3; j++) {
      let angle = spinner.rotation + TWO_PI / 3 * j;
      let circleX = spinner.x + cos(angle) * spinner.armLength;
      let circleY = spinner.y + sin(angle) * spinner.armLength;

      // Check collision with circles
      let d = dist(ball.x, ball.y, circleX, circleY);
      if (d < ball.radius + spinner.circleRadius) {
        collision = true;

        // Store original ball velocity for impact calculation
        let originalVelocity = createVector(ball.velocity.x, ball.velocity.y);

        // Calculate spinner's velocity at the point of impact
        let spinnerVelocity = createVector(
          -sin(angle) * spinner.angularVel * spinner.armLength,
          cos(angle) * spinner.angularVel * spinner.armLength
        );

        // Calculate relative velocity
        let relativeVelocity = createVector(
          ball.velocity.x - spinnerVelocity.x,
          ball.velocity.y - spinnerVelocity.y
        );

        // Calculate normal vector (from circle to ball)
        let normal = createVector(ball.x - circleX, ball.y - circleY);
        normal.normalize();

        // Reflect relative velocity
        let dot = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y;
        let reflectedVelocity = createVector(
          relativeVelocity.x - 2 * dot * normal.x,
          relativeVelocity.y - 2 * dot * normal.y
        );

        // Add spinner's velocity back to get final ball velocity
        ball.velocity.x = reflectedVelocity.x + spinnerVelocity.x;
        ball.velocity.y = reflectedVelocity.y + spinnerVelocity.y;

        // Calculate impact direction for spinner rotation
        let impactPoint = createVector(circleX - spinner.x, circleY - spinner.y);

        // Calculate direct force impact
        let impactForce = originalVelocity.mag() * 0.0005;
        let directionalImpact = normal.copy().mult(impactForce);

        // Calculate rotational impact (torque)
        let torque = impactPoint.x * originalVelocity.y - impactPoint.y * originalVelocity.x;

        // Combine both effects
        spinner.angularVel += torque * 0.0001;
        spinner.rotation += directionalImpact.y; // Apply direct force impact to rotation

        // Move ball out of collision
        ball.x = circleX + normal.x * (ball.radius + spinner.circleRadius);
        ball.y = circleY + normal.y * (ball.radius + spinner.circleRadius);

        ball.velocity.mult(0.8);  // Energy loss
      }

      // Check collision with spinner arms (line segments)
      // if (!collision) {
      //   let nextAngle = spinner.rotation + TWO_PI / 3 * ((j + 1) % 3);
      //   let x1 = spinner.x + cos(angle) * spinner.armLength;
      //   let y1 = spinner.y + sin(angle) * spinner.armLength;
      //   let x2 = spinner.x + cos(nextAngle) * spinner.armLength;
      //   let y2 = spinner.y + sin(nextAngle) * spinner.armLength;

      //   // Calculate ball's previous position
      //   let prevX = ball.x - ball.velocity.x;
      //   let prevY = ball.y - ball.velocity.y;

      //   // Check if line segments intersect
      //   let intersection = lineSegmentIntersection(
      //     prevX, prevY, ball.x, ball.y,
      //     x1, y1, x2, y2
      //   );

      //   if (intersection) {
      //     // Calculate normal vector perpendicular to the line segment
      //     let lineVec = createVector(x2 - x1, y2 - y1);
      //     let normal = createVector(-lineVec.y, lineVec.x); // Perpendicular to line
      //     normal.normalize();

      //     // Make sure normal points towards the ball's previous position
      //     let toBall = createVector(prevX - intersection.x, prevY - intersection.y);
      //     if (normal.dot(toBall) < 0) {
      //       normal.mult(-1); // Flip normal if it points wrong way
      //     }

      //     let dot = ball.velocity.x * normal.x + ball.velocity.y * normal.y;
      //     ball.velocity.x = ball.velocity.x - 2 * dot * normal.x;
      //     ball.velocity.y = ball.velocity.y - 2 * dot * normal.y;

      //     // Move ball to just outside the collision point
      //     ball.x = intersection.x + normal.x * (ball.radius + 4);
      //     ball.y = intersection.y + normal.y * (ball.radius + 4);

      //     // Calculate impact for spinner rotation
      //     let impactVec = createVector(intersection.x - spinner.x, intersection.y - spinner.y);
      //     let velocityVec = createVector(ball.velocity.x, ball.velocity.y);

      //     // Calculate angular impact based on the incoming velocity and impact point
      //     let impactSpeed = velocityVec.mag();
      //     let tangent = createVector(-impactVec.y, impactVec.x).normalize();
      //     let tangentialComponent = velocityVec.dot(tangent);

      //     // Apply rotation based on the tangential component of velocity
      //     spinner.angularVel += tangentialComponent * 0.001;

      //     ball.velocity.mult(0.8);
      //   }
      // }
    }

    // Rest of ball update code (endzone, boundaries, drawing)
    if (ball.y < 50) {
      ballBalance += currentReward;
      scores++;
      balls.splice(i, 1);
      continue;
    }

    if (ball.x < 0 || ball.x > width) {
      balls.splice(i, 1);
      continue;
    }

    fill(255, 0, 0);
    circle(ball.x, ball.y, ball.radius * 2);
  }

  // Draw stats
  fill(0);
  textSize(20);
  text(`Balls: ${Math.round(ballBalance)}`, 40, 35);
  let winRate = attempts > 0 ? (scores / attempts) : 0;
  text(`Win Rate: ${Math.round(winRate * 100)}%`, width - 140, 35);

  // Calculate reward based on win rate
  // For stability: reward = (1 - win_rate) / win_rate
  if (winRate > 0) {
    currentReward = Math.min(maxReward, Math.max(minReward, Math.round((1 - winRate) / winRate)));
  } else {
    currentReward = maxReward;
  }

  // Draw reward
  fill(0);
  textAlign(CENTER);
  text(`Reward: ${currentReward}`, width / 2, 35);
  textAlign(LEFT);
}

function mousePressed() {
  if (ballBalance > 0) {
    let cannonX = constrain(mouseX, 50, width - 50);
    balls.push({
      x: cannonX,
      y: height - 60,
      velocity: createVector(0, ballSpeed),
      radius: 10
    });
    ballBalance--;
    attempts++;  // Only increment attempts when firing, not when scoring
  }
}

// Helper function for line collision
function getClosestPointOnLine(px, py, x1, y1, x2, y2) {
  let dx = x2 - x1;
  let dy = y2 - y1;
  let length2 = dx * dx + dy * dy;

  if (length2 === 0) return { x: x1, y: y1 };

  let t = ((px - x1) * dx + (py - y1) * dy) / length2;
  t = constrain(t, 0, 1);

  return {
    x: x1 + t * dx,
    y: y1 + t * dy
  };
}

// Add this helper function at the bottom of the file
function lineSegmentIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  let denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (denominator === 0) return null;

  let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
  let u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }

  return null;
} 