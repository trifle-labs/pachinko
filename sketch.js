// Game variables
let balls = [];
let pegs = [];
let spinner = {
  x: 390 * 0.3, // Move left
  y: 844 * 0.55, // Move down
  radius: 15, // Center circle radius
  armLength: 60, // Length of each spinner arm
  circleRadius: 25, // Radius of end circles
  rotation: 0, // Current rotation angle
  angularVel: 0, // Angular velocity
  friction: 0.9, // Slight friction to eventually slow rotation
};
let ballBalance = 100;
let pegSpeed = 2;
let numPegsPerRow = 5; // 5 pegs per row
let numRows = 6; // 3 rows at top, 3 at bottom
let totalPegs = numPegsPerRow * numRows;
let ballSpeed = 5;
let gravity = 0.2;
let attempts = 0;
let showPegs = true;
let baseReward = 10; // Starting reward for each zone
let currentReward = baseReward;
let rewardAdjustRate = 0.3; // Increased from 0.1 to 0.3
let scores = 0; // Add with other variables at top
let targetBalance = ballBalance; // Use starting ball count as target
let minReward = 1;
let maxReward = 20;
let purpleSquare = {
  x: 390 * 0.7, // More centered horizontally
  y: 844 * 0.4, // More centered vertically
  size: 120, // Double the size (60 * 2)
  rotation: 0,
  mouthSize: 50, // Double the opening (25 * 2)
  rotationSpeed: 0.02,
  mouthFlash: 0, // Add flash timer
};
let mouthHitCount = 0; // Track the number of times the mouth is hit
let handRotation = 0; // Initial rotation angle
let ballReleaseDelay = 20; // Delay in milliseconds between ball releases
let lastReleaseTime = 0; // Track the last time a ball was released
let isMousePressed = false; // Track mouse pressed state
let zoneWidth = 20; // Width of each scoring zone (same as ball diameter)
let zones = []; // Array to track zones
let zoneHits = []; // Array to track hits in each zone
let totalHits = 0; // Track total hits for percentage calculation
let zoneRewards = []; // Array to store rewards for each zone
let minZoneReward = 1;
let maxZoneReward = 50;

function setup() {
  createCanvas(390, 844);

  // Initialize pegs - Adjust Y positions
  let pegSpacingX = width / (numPegsPerRow + 1);
  let pegOffsetX = pegSpacingX;

  // Bottom three rows become top rows
  for (let row = 0; row < 3; row++) {
    let yPos = height - 150 - row * 50; // Flipped position
    for (let col = 0; col < numPegsPerRow; col++) {
      pegs.push({
        y: yPos,
        x: pegOffsetX + col * (width / numPegsPerRow),
        radius: 10,
        movingRight: row % 2 === 0,
      });
    }
  }

  // Top three rows become bottom rows
  for (let row = 0; row < 3; row++) {
    let yPos = height - 650 - row * 50; // Flipped position
    for (let col = 0; col < numPegsPerRow; col++) {
      pegs.push({
        y: yPos,
        x: pegOffsetX + col * (width / numPegsPerRow),
        radius: 10,
        movingRight: row % 2 === 0,
      });
    }
  }

  initializeZones();
}

function draw() {
  background(255); // White background

  // Update ball release position
  if (isMousePressed && ballBalance > 0) {
    let currentTime = millis();
    if (currentTime - lastReleaseTime >= ballReleaseDelay) {
      let cannonX = constrain(mouseX, 50, width - 50);
      balls.push({
        x: cannonX,
        y: 60, // Changed from height-60 to 60
        velocity: createVector(0, ballSpeed),
        radius: 10,
      });
      ballBalance--;
      attempts++;
      lastReleaseTime = currentTime;
    }
  }

  // Update cannon position
  let cannonX = constrain(mouseX, 60, width - 50);

  // Remove the PI rotation since we want it pointing down now
  textSize(40);
  textAlign(CENTER);
  text('🫳', cannonX, 60);

  // Update ball count position
  textSize(20);
  fill(0);
  noStroke();
  text(`${Math.round(ballBalance)}`, cannonX - 10, 20); // Adjusted Y position

  // Reset text alignment for other text elements
  textAlign(LEFT);

  // Draw and update spinner
  push();
  translate(spinner.x, spinner.y);
  rotate(spinner.rotation);

  // Draw arms (black lines connecting circles)
  strokeWeight(8);
  stroke(0);
  for (let i = 0; i < 3; i++) {
    let angle = (TWO_PI / 3) * i;
    line(0, 0, cos(angle) * spinner.armLength, sin(angle) * spinner.armLength);
  }

  // Draw circles at the ends
  noStroke();
  for (let i = 0; i < 3; i++) {
    let angle = (TWO_PI / 3) * i;
    let x = cos(angle) * spinner.armLength;
    let y = sin(angle) * spinner.armLength;

    // Set color based on position (cyan, red, yellow)
    if (i === 0) fill(0, 255, 255); // Cyan
    if (i === 1) fill(255, 0, 0); // Red
    if (i === 2) fill(255, 255, 0); // Yellow

    circle(x, y, spinner.circleRadius * 2);
  }
  pop();

  // Draw purple square character
  push();
  translate(purpleSquare.x, purpleSquare.y);
  rotate(purpleSquare.rotation);

  // Draw square body
  fill(128, 0, 128); // Purple
  rectMode(CENTER);
  rect(0, 0, purpleSquare.size, purpleSquare.size);

  // Draw mouth (opening)
  if (purpleSquare.mouthFlash > 0) {
    fill(0, 255, 0); // Green flash
    purpleSquare.mouthFlash--;
  } else {
    fill(0); // Normal black
  }
  rectMode(CENTER);
  rect(
    0,
    purpleSquare.size / 2 - purpleSquare.mouthSize / 2, // Correct mouth position
    purpleSquare.mouthSize,
    purpleSquare.mouthSize
  );

  // Draw eyes
  fill(255); // White eyes
  circle(-purpleSquare.size / 4, -purpleSquare.size / 4, 20);
  circle(purpleSquare.size / 4, -purpleSquare.size / 4, 20);

  // Draw pupils
  fill(0);
  circle(-purpleSquare.size / 4, -purpleSquare.size / 4, 8);
  circle(purpleSquare.size / 4, -purpleSquare.size / 4, 8);
  pop();

  // Update purple square rotation
  purpleSquare.rotation += purpleSquare.rotationSpeed;

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

    // Check collision with pegs
    if (showPegs) {
      for (let peg of pegs) {
        let d = dist(ball.x, ball.y, peg.x, peg.y);
        if (d < ball.radius + peg.radius) {
          // Calculate normal vector from peg to ball
          let nx = (ball.x - peg.x) / d;
          let ny = (ball.y - peg.y) / d;

          // Calculate relative velocity
          let relativeVelocityX = ball.velocity.x;
          let relativeVelocityY = ball.velocity.y;

          // Calculate velocity along normal
          let normalVelocity = relativeVelocityX * nx + relativeVelocityY * ny;

          // Only reflect if objects are moving toward each other
          if (normalVelocity < 0) {
            // Reflect velocity with some energy loss
            let restitution = 0.7; // Bounce factor (0-1)
            ball.velocity.x -= (1 + restitution) * normalVelocity * nx;
            ball.velocity.y -= (1 + restitution) * normalVelocity * ny;

            // Move ball outside of peg
            let overlap = ball.radius + peg.radius - d;
            ball.x += overlap * nx;
            ball.y += overlap * ny;
          }
        }
      }
    }

    // Draw the base silver ball
    fill(200); // Silver color
    noStroke();
    circle(ball.x, ball.y, ball.radius * 2); // Draw the main ball

    // Calculate the position of the highlight based on the light source
    let lightSourceX = 50; // X position for light source
    let lightSourceY = height / 2; // Y position for light source

    // Calculate the angle to the light source
    let angleToLight = atan2(lightSourceY - ball.y, lightSourceX - ball.x);

    // Calculate the position of the highlight
    let highlightX = ball.x + cos(angleToLight) * (ball.radius * 0.5); // Offset for highlight
    let highlightY = ball.y + sin(angleToLight) * (ball.radius * 0.5); // Offset for highlight

    // Draw the highlight
    fill(255); // White color for highlight
    circle(highlightX, highlightY, ball.radius * 1.1); // Draw the highlight

    // Check for zone collision
    if (ball.y > height - 50) { // Check if the ball is near the bottom
      let zoneIndex = Math.floor(ball.x / zoneWidth);
      if (zoneIndex >= 0 && zoneIndex < zones.length) {
        zoneHits[zoneIndex]++;
        totalHits++; // Increment total hits
        ballBalance += zoneRewards[zoneIndex];
        scores++;
      }
      balls.splice(i, 1); // Remove the ball after it hits the zone
      continue;
    }

    // Check collision with spinner
    let ballToCenter = createVector(ball.x - spinner.x, ball.y - spinner.y);
    let ballToCenterDist = ballToCenter.mag();

    // Check collision with each circle and arm
    let collision = false;
    for (let j = 0; j < 3; j++) {
      let angle = spinner.rotation + (TWO_PI / 3) * j;
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
        let impactPoint = createVector(
          circleX - spinner.x,
          circleY - spinner.y
        );

        // Calculate direct force impact
        let impactForce = originalVelocity.mag() * 0.0005;
        let directionalImpact = normal.copy().mult(impactForce);

        // Calculate rotational impact (torque)
        let torque =
          impactPoint.x * originalVelocity.y -
          impactPoint.y * originalVelocity.x;

        // Combine both effects
        spinner.angularVel += torque * 0.0001;
        spinner.rotation += directionalImpact.y; // Apply direct force impact to rotation

        // Move ball out of collision
        ball.x = circleX + normal.x * (ball.radius + spinner.circleRadius);
        ball.y = circleY + normal.y * (ball.radius + spinner.circleRadius);

        ball.velocity.mult(0.8); // Energy loss
      }
    }
    // Check collision with purple square using continuous collision detection
    let startX = ball.x - ball.velocity.x; // Previous position
    let startY = ball.y - ball.velocity.y;
    let endX = ball.x;
    let endY = ball.y;

    // Check multiple points along the ball's path
    const steps = 10;
    let collisionFound = false;

    for (let i = 0; i <= steps; i++) {
      let t = i / steps;
      let checkX = startX + (endX - startX) * t;
      let checkY = startY + (endY - startY) * t;

      // Translate and rotate check point relative to square
      let rotatedX = (checkX - purpleSquare.x) * cos(-purpleSquare.rotation) -
        (checkY - purpleSquare.y) * sin(-purpleSquare.rotation);
      let rotatedY = (checkX - purpleSquare.x) * sin(-purpleSquare.rotation) +
        (checkY - purpleSquare.y) * cos(-purpleSquare.rotation);

      if (isNaN(rotatedX) || isNaN(rotatedY)) {
        continue;
      }

      let halfSize = purpleSquare.size / 2;

      // Find closest point on square
      let closestX = constrain(rotatedX, -halfSize, halfSize);
      let closestY = constrain(rotatedY, -halfSize, halfSize);

      // Calculate distance to closest point
      let distX = rotatedX - closestX;
      let distY = rotatedY - closestY;
      let distance = sqrt(distX * distX + distY * distY);

      if (isNaN(distance)) {
        continue;
      }

      // Check for collision
      if (distance < ball.radius) {
        collisionFound = true;
        // console.log(`Square collision - Ball position: (${checkX}, ${checkY}), Velocity: (${ball.velocity.x}, ${ball.velocity.y})`);

        // Calculate normal in rotated space
        let normalX = distance === 0 ? 1 : distX / distance;
        let normalY = distance === 0 ? 0 : distY / distance;

        if (isNaN(normalX) || isNaN(normalY)) {
          continue;
        }

        // Rotate normal back to world space
        let worldNormalX = normalX * cos(purpleSquare.rotation) - normalY * sin(purpleSquare.rotation);
        let worldNormalY = normalX * sin(purpleSquare.rotation) + normalY * cos(purpleSquare.rotation);

        if (isNaN(worldNormalX) || isNaN(worldNormalY)) {
          continue;
        }

        // Reflect velocity
        let dot = ball.velocity.x * worldNormalX + ball.velocity.y * worldNormalY;
        let newVelX = ball.velocity.x - 2 * dot * worldNormalX;
        let newVelY = ball.velocity.y - 2 * dot * worldNormalY;

        if (!isNaN(newVelX) && !isNaN(newVelY)) {
          ball.velocity.x = newVelX;
          ball.velocity.y = newVelY;

          // Move ball to collision point and slightly outside
          ball.x = checkX + worldNormalX * (ball.radius - distance + 1);
          ball.y = checkY + worldNormalY * (ball.radius - distance + 1);

          // Add energy loss
          ball.velocity.mult(0.8);
        }
        break;
      }
    }

    if (ball.x < 0 || ball.x > width) {
      balls.splice(i, 1);
      continue;
    }
  }

  // Draw zones
  drawZones();

  // Draw stats
  fill(0); // Set fill color for text
  noStroke(); // Disable stroke for text
  textSize(20);
  let winRate = attempts > 0 ? scores / attempts : 0;
  // text(`Balls: ${Math.round(ballBalance)}`, 40, 35);
  // text(`Win Rate: ${Math.round(winRate * 100)}%`, width - 140, 35);

  // Calculate reward based on win rate
  // For stability: reward = (1 - win_rate) / win_rate
  if (winRate > 0) {
    currentReward = Math.min(
      maxReward,
      Math.max(minReward, Math.round((1 - winRate) / winRate))
    );
  } else {
    currentReward = maxReward;
  }

  // Draw reward
  fill(0);
  textAlign(CENTER);
  // text(`Reward: ${currentReward}`, width / 2, 35);
  textAlign(LEFT);
}

function mousePressed() {
  isMousePressed = true;
  lastReleaseTime = millis() - ballReleaseDelay; // Allow immediate first shot
}

function mouseReleased() {
  isMousePressed = false;
}

// Helper function for line collision
function getClosestPointOnLine(px, py, x1, y1, x2, y2) {
  let dx = x2 - x1;
  let dy = y1 - y1;
  let length2 = dx * dx + dy * dy;

  if (length2 === 0) return { x: x1, y: y1 };

  let t = ((px - x1) * dx + (py - y1) * dy) / length2;
  t = constrain(t, 0, 1);

  return {
    x: x1 + t * dx,
    y: y1 + t * dy,
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

function isColliding(square, ball) {
  // Simplified collision detection
  const squareLeft = square.x - square.size / 2;
  const squareRight = square.x + square.size / 2;
  const squareTop = square.y - square.size / 2;
  const squareBottom = square.y + square.size / 2;

  const ballLeft = ball.x - ball.radius;
  const ballRight = ball.x + ball.radius;
  const ballTop = ball.y - ball.radius;
  const ballBottom = ball.y + ball.radius;

  const isOverlap = !(
    squareLeft > ballRight ||
    squareRight < ballLeft ||
    squareTop > ballBottom ||
    squareBottom < ballTop
  );

  return isOverlap;
}

function calculateMouthBonus() {
  let mouthWinRate = mouthHitCount / attempts;
  let combinedWinRate = (mouthWinRate + scores / attempts) / 2;
  let bonus = Math.min(
    maxReward,
    Math.max(minReward, Math.round((1 - combinedWinRate) / combinedWinRate))
  );
  return bonus;
}

function initializeZones() {
  zones = [];
  zoneHits = [];
  zoneRewards = [];
  let numZones = Math.ceil(width / zoneWidth);
  // zoneRewards = [

  //   101, 133, 90, 68, 48, 38, 68, 33, 46, 74, 46, 38, 39, 33, 27, 59, 36, 48, 68, 66
  // ]
  for (let i = 0; i < numZones; i++) {
    zones.push({
      x: i * zoneWidth,
      width: zoneWidth
    });
    zoneHits.push(0);
    zoneRewards.push(baseReward);
  }
}

function drawZones() {
  for (let i = 0; i < zones.length; i++) {
    // Calculate hit probability for this zone
    let hitRate = attempts > 0 ? zoneHits[i] / attempts : 0;

    // Color feedback based on difficulty (hit rate)
    let r = map(hitRate, 0, 0.1, 0, 255); // Red for easy zones
    let b = map(hitRate, 0, 0.1, 255, 0); // Blue for hard zones
    fill(r, 0, b, 100);

    // Draw zone rectangle
    noStroke();
    rect(zones[i].x, height - 50, zoneWidth, 50);

    // Only adjust rewards after we have enough data
    if (attempts > 100) {
      // The harder a zone is to hit (lower hit rate), 
      // the higher its reward should be
      let expectedHitRate = scores / attempts;
      let difficultyMultiplier = expectedHitRate / (hitRate);
      const minZoneReward = 1
      const maxZoneReward = 15
      // A zone that's hit half as often should pay twice as much
      console.log({
        difficultyMultiplier,
        Math: Math.round(difficultyMultiplier),
        minZoneReward,
        maxZoneReward
      })
      zoneRewards[i] = constrain(
        Math.round(difficultyMultiplier),
        minZoneReward,
        maxZoneReward
      );
    }

    // Draw reward value
    fill(0);
    textAlign(CENTER);
    textSize(12);
    text(zoneRewards[i], zones[i].x + zoneWidth / 2, height - 20);
  }
  textAlign(LEFT);
}
