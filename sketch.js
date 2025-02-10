// Game variables
let balls = [];
let pegs = [];
let ballBalance = 10;  // Starting ball balance
let pegSpeed = 2;
let numPegsPerCol = 5;  // 5 pegs in each column
let numCols = 10;       // 10 columns
let totalPegs = numPegsPerCol * numCols;
let ballSpeed = -5;     // Negative for upward movement
let gravity = -0.2;     // Negative for upward gravity
let attempts = 0;
let scores = 0;

function setup() {
  // Vertical phone dimensions (iPhone 12 Pro aspect ratio)
  createCanvas(390, 844);

  // Initialize pegs
  let pegSpacingY = (height - 200) / (numCols + 1);
  let pegSpacingX = width / numPegsPerCol;

  for (let col = 0; col < numCols; col++) {
    for (let row = 0; row < numPegsPerCol; row++) {
      pegs.push({
        y: 150 + pegSpacingY * (col + 1),
        x: pegSpacingX * row,
        radius: 10,
        movingRight: col % 2 === 0  // Alternate direction by row
      });
    }
  }
}

function draw() {
  background(220);

  // Draw cannon
  let cannonX = constrain(mouseX, 50, width - 50);
  fill(100);
  rect(cannonX - 20, height - 60, 40, 40);

  // Draw endzone
  fill(0, 255, 0, 100);
  rect(0, 0, width, 50);

  // Update and draw pegs
  for (let peg of pegs) {
    // Move pegs
    if (peg.movingRight) {
      peg.x += pegSpeed;
      if (peg.x > width) peg.x = 0;
    } else {
      peg.x -= pegSpeed;
      if (peg.x < 0) peg.x = width;
    }

    // Draw pegs
    fill(0);
    circle(peg.x, peg.y, peg.radius * 2);
  }

  // Update and draw balls
  for (let i = balls.length - 1; i >= 0; i--) {
    let ball = balls[i];

    // Apply downward gravity (slows upward movement)
    ball.velocity.y += gravity;

    // Update position
    ball.x += ball.velocity.x;
    ball.y += ball.velocity.y;

    // Check for collision with pegs
    for (let peg of pegs) {
      let d = dist(ball.x, ball.y, peg.x, peg.y);
      if (d < ball.radius + peg.radius) {
        // Calculate collision response
        let normal = createVector(ball.x - peg.x, ball.y - peg.y);
        normal.normalize();

        // Reflect velocity vector around the normal
        let dot = ball.velocity.x * normal.x + ball.velocity.y * normal.y;
        ball.velocity.x = ball.velocity.x - 2 * dot * normal.x;
        ball.velocity.y = ball.velocity.y - 2 * dot * normal.y;

        // Move ball out of collision
        ball.x = peg.x + normal.x * (ball.radius + peg.radius);
        ball.y = peg.y + normal.y * (ball.radius + peg.radius);

        // Optional: Add some energy loss on collision
        ball.velocity.mult(0.8);
        break;
      }
    }

    // Check if ball reached endzone
    if (ball.y < 50) {
      ballBalance += 5;  // Changed from 11 to 4 balls for scoring (net gain of 3 after spending 1)
      scores++;
      console.log("Balls:", ballBalance, "Success Rate:", (scores / attempts * 100).toFixed(1) + "%");
      balls.splice(i, 1);
      continue;
    }

    // Remove ball if it goes off screen horizontally
    if (ball.x < 0 || ball.x > width) {
      balls.splice(i, 1);
      continue;
    }

    // Draw the ball
    fill(255, 0, 0);
    circle(ball.x, ball.y, ball.radius * 2);
  }

  // Draw stats
  fill(0);
  textSize(24);
  text(`Balls: ${ballBalance}`, 20, 30);
  text(`Attempts: ${attempts}`, 20, 60);
  text(`Scores: ${scores}`, 20, 90);
  let winRate = attempts > 0 ? (scores / attempts * 100).toFixed(1) + "%" : "0%";
  text(`Win Rate: ${winRate}`, 20, 120);
}

function mousePressed() {
  if (ballBalance > 0) {
    attempts++;
    let cannonX = constrain(mouseX, 50, width - 50);
    balls.push({
      x: cannonX,
      y: height - 60,  // Fixed spawn position at cannon height
      velocity: createVector(0, ballSpeed),  // Initial upward velocity
      radius: 10
    });
    ballBalance--;
  }
} 