class Lava {
  constructor(levelHeight) {
    this.levelHeight = levelHeight;
    this.y = levelHeight; // starts below the level
  }

  reset() {
    this.y = this.levelHeight;
  }

  update(dt, speed) {
    this.y -= speed * dt;
  }

  touches(player) {
    return player.y + player.height > this.y;
  }

  draw(ctx, levelWidth) {
    const t = performance.now() / 900;

    // Glow above surface
    const grd = ctx.createLinearGradient(0, this.y - 50, 0, this.y);
    grd.addColorStop(0, 'rgba(255,80,0,0)');
    grd.addColorStop(1, 'rgba(255,100,0,0.5)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, this.y - 50, levelWidth, 50);

    // Lava body with animated wave surface
    ctx.fillStyle = '#b81800';
    ctx.beginPath();
    ctx.moveTo(0, this.y);
    for (let x = 0; x <= levelWidth; x += 8) {
      const w = Math.sin(x / 55 + t) * 7 + Math.sin(x / 24 - t * 1.4) * 4;
      ctx.lineTo(x, this.y + w);
    }
    ctx.lineTo(levelWidth, this.y + 4000);
    ctx.lineTo(0, this.y + 4000);
    ctx.closePath();
    ctx.fill();

    // Bright molten stripe at surface
    ctx.fillStyle = '#ff5500';
    ctx.beginPath();
    ctx.moveTo(0, this.y - 2);
    for (let x = 0; x <= levelWidth; x += 8) {
      const w = Math.sin(x / 55 + t) * 7 + Math.sin(x / 24 - t * 1.4) * 4;
      ctx.lineTo(x, this.y + w - 2);
    }
    for (let x = levelWidth; x >= 0; x -= 8) {
      const w = Math.sin(x / 55 + t) * 7 + Math.sin(x / 24 - t * 1.4) * 4;
      ctx.lineTo(x, this.y + w + 10);
    }
    ctx.closePath();
    ctx.fill();

    // Glowing hot spots (bubbles)
    const blobT = performance.now() / 600;
    const blobs = [
      { ox: 0.15, phase: 0.0 },
      { ox: 0.42, phase: 1.2 },
      { ox: 0.70, phase: 2.4 },
      { ox: 0.28, phase: 3.6 },
      { ox: 0.85, phase: 0.8 },
    ];
    for (const b of blobs) {
      const bx = b.ox * levelWidth;
      const by = this.y + 10 + Math.sin(blobT + b.phase) * 5;
      const r  = 6 + Math.sin(blobT * 0.7 + b.phase) * 2;
      ctx.fillStyle = 'rgba(255,180,0,0.55)';
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
