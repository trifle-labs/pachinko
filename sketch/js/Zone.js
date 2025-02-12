import { ZONE_WIDTH, MIN_ZONE_REWARD, MAX_ZONE_REWARD, BASE_REWARD } from './config.js';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';

export class Zone {
  constructor(x) {
    this.x = x;
    this.width = ZONE_WIDTH;
    this.hits = 0;
    this.reward = BASE_REWARD;
  }

  draw(p5, attempts, totalHits) {
    const hitRate = attempts > 0 ? this.hits / attempts : 0;
    const r = p5.map(hitRate, 0, 0.1, 0, 255);
    const b = p5.map(hitRate, 0, 0.1, 255, 0);

    p5.push();
    // Move zones up slightly and make them deeper
    p5.translate(this.x - GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 0);

    // Draw main zone box
    p5.ambientMaterial(r, 0, b);
    p5.box(this.width, 100, 50);

    // Draw reward text
    p5.push();
    p5.translate(0, -60, 30);
    p5.fill(255, 215, 0); // Gold color
    p5.textSize(16);
    p5.textAlign(p5.CENTER);
    p5.text(this.reward.toString(), 0, 0);
    p5.pop();

    p5.pop();

    // Only adjust rewards after we have enough data
    if (attempts > 100) {
      const expectedHitRate = totalHits / attempts;
      const difficultyMultiplier = expectedHitRate / (hitRate || 0.001);
      this.reward = p5.constrain(
        Math.round(difficultyMultiplier),
        MIN_ZONE_REWARD,
        MAX_ZONE_REWARD
      );
    }
  }
} 