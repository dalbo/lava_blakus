const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');

canvas.width  = 800;
canvas.height = 600;
ctx.imageSmoothingEnabled = false;

const input = new Input();

let currentLevel = 0;
let respawns     = 0;
let gameState    = 'menu'; // 'menu' | 'playing' | 'paused' | 'won'
let pauseStartMs = 0;

let levelStartMs = 0;
let levelTimes   = [];
let cheated      = false;

function formatTime(ms) {
  const totalSec = ms / 1000;
  const mins = Math.floor(totalSec / 60);
  const secs = (totalSec % 60).toFixed(2).padStart(5, '0');
  return `${mins}:${secs}`;
}

let level, player, camera, lava;

function snapCamera() {
  camera.x = Math.max(0, Math.min(player.x + player.width  / 2 - canvas.width  / 2, level.width  - canvas.width));
  camera.y = Math.max(0, Math.min(player.y + player.height / 2 - canvas.height / 2, level.height - canvas.height));
}

function doRespawn() {
  respawns++;
  player.respawn(level.spawnX, level.spawnY);
  lava.reset();
  snapCamera();
}

function loadLevel(n) {
  const wasInvincible = player ? player.invincible : false;
  currentLevel = n;
  level  = new Level(n);
  player = new Player(level.spawnX, level.spawnY);
  player.invincible = wasInvincible;
  camera = new Camera(canvas.width, canvas.height, level.width, level.height);
  lava   = new Lava(level.height);
  snapCamera();
}

function startGame() {
  respawns     = 0;
  levelTimes   = [];
  cheated      = false;
  levelStartMs = performance.now();
  loadLevel(0);
  gameState = 'playing';
}

loadLevel(0);

let lastTime = null;

// ── Screen drawing helpers ────────────────────────────────────────────────

function drawMenuScreen(timestamp) {
  ctx.fillStyle = '#0d0000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Lava glow from bottom
  const g = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
  g.addColorStop(0, 'rgba(255,60,0,0)');
  g.addColorStop(1, 'rgba(255,60,0,0.18)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#5a2010';
  ctx.font = '18px monospace';
  ctx.fillText('welcome to', canvas.width / 2, canvas.height / 2 - 80);

  ctx.fillStyle = '#ff5500';
  ctx.shadowColor = '#ff5500';
  ctx.shadowBlur = 30;
  ctx.font = 'bold 64px monospace';
  ctx.fillText('LAVA', canvas.width / 2, canvas.height / 2 - 15);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#c02030';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('BLAKUS', canvas.width / 2, canvas.height / 2 + 25);

  if (Math.floor(timestamp / 500) % 2 === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.font = '16px monospace';
    ctx.fillText('press SPACE to start', canvas.width / 2, canvas.height / 2 + 65);
  }

  ctx.fillStyle = '#3a1a1a';
  ctx.shadowBlur = 0;
  ctx.font = '11px monospace';
  ctx.fillText('arrows / WASD to move  ·  space / up / W to jump',
               canvas.width / 2, canvas.height - 60);
  ctx.fillText('E at door to advance  ·  R to respawn  ·  lava resets on death',
               canvas.width / 2, canvas.height - 42);
  ctx.fillText('P to pause  ·  M for menu',
               canvas.width / 2, canvas.height - 24);

  ctx.restore();
}

function returnToMenu() {
  respawns   = 0;
  levelTimes = [];
  cheated    = false;
  if (player) player.invincible = false;
  gameState = 'menu';
}

function drawBackground() {
  ctx.fillStyle = 'rgba(255,80,0,0.04)';
  const dots = [[40,30],[120,80],[200,50],[310,110],[70,170],[260,200],[350,60],[150,240],[380,180],[90,250]];
  const tileW = 400, tileH = 300;
  const sx = Math.floor(camera.x / tileW);
  const sy = Math.floor(camera.y / tileH);
  for (let tx = sx - 1; tx <= sx + Math.ceil(canvas.width  / tileW) + 1; tx++) {
    for (let ty = sy - 1; ty <= sy + Math.ceil(canvas.height / tileH) + 1; ty++) {
      for (const [dx, dy] of dots) ctx.fillRect(tx * tileW + dx, ty * tileH + dy, 2, 2);
    }
  }
}

function drawHUD() {
  const t = formatTime(performance.now() - levelStartMs);
  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(10, 10, 380, 28);
  ctx.fillStyle = '#ff7733';
  ctx.fillText(`LVL ${currentLevel + 1}/${Level.count}   TIME ${t}   DEATHS ${respawns}`, 18, 29);

  if (player.invincible) {
    ctx.fillStyle = 'rgba(255,215,0,0.25)';
    ctx.fillRect(canvas.width - 160, 10, 150, 28);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('★ INVINCIBLE ★', canvas.width - 150, 29);
  }

  // Lava proximity warning — show a danger bar at bottom of screen
  const lavaDist = lava.y - (player.y + player.height);
  if (lavaDist < 350) {
    const danger = Math.max(0, 1 - lavaDist / 350);
    const pulse  = 0.5 + 0.5 * Math.sin(performance.now() / 150);
    const alpha  = danger * 0.35 * pulse;
    ctx.fillStyle = `rgba(255,40,0,${alpha})`;
    ctx.fillRect(0, canvas.height - 8, canvas.width, 8);

    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = `rgba(255,100,0,${Math.min(1, danger * 1.5)})`;
    ctx.textAlign = 'right';
    ctx.fillText(`LAVA ↑${Math.max(0, Math.floor(lavaDist))}px`, canvas.width - 12, canvas.height - 12);
    ctx.textAlign = 'left';
  }
}

function drawGameScene() {
  ctx.fillStyle = level.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  camera.apply(ctx);
  drawBackground();
  for (const p of level.platforms) p.draw(ctx);
  for (const s of level.spikes)    s.draw(ctx);
  level.door.draw(ctx, level.door.isNear(player));
  lava.draw(ctx, level.width);
  player.draw(ctx);
  ctx.restore();

  drawHUD();
}

function drawPauseOverlay(timestamp) {
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px monospace';
  ctx.fillText('Game Paused', canvas.width / 2, canvas.height / 2 - 10);
  if (Math.floor(timestamp / 500) % 2 === 0) {
    ctx.fillStyle = '#ff7733';
    ctx.font = '14px monospace';
    ctx.fillText('press P or SPACE to resume', canvas.width / 2, canvas.height / 2 + 30);
  }
  ctx.fillStyle = '#5a2010';
  ctx.font = '11px monospace';
  ctx.fillText('M for menu', canvas.width / 2, canvas.height / 2 + 60);
  ctx.restore();
}

function drawWinScreen(timestamp) {
  ctx.fillStyle = '#0a0000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff5500';
  ctx.shadowColor = '#ff5500';
  ctx.shadowBlur = 20;
  ctx.font = 'bold 44px monospace';
  ctx.fillText('SURVIVED!', canvas.width / 2, 70);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#7a3a3a';
  ctx.font = '13px monospace';
  ctx.fillText(`deaths: ${respawns}`, canvas.width / 2, 95);

  if (cheated) {
    ctx.fillStyle = '#ff4455';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('TIME NOT VALID', canvas.width / 2, 150);
    ctx.fillStyle = '#7a4a4a';
    ctx.font = '13px monospace';
    ctx.fillText('cheats were used this run', canvas.width / 2, 178);
  } else {
    const leftX  = canvas.width / 2 - 80;
    const rightX = canvas.width / 2 + 80;
    let total = 0;
    let y = 140;
    ctx.font = '15px monospace';
    for (let i = 0; i < levelTimes.length; i++) {
      total += levelTimes[i];
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(`Level ${i + 1}`, leftX, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#b0b0d0';
      ctx.fillText(formatTime(levelTimes[i]), rightX, y);
      y += 24;
    }
    ctx.strokeStyle = '#4a2020';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftX, y - 6);
    ctx.lineTo(rightX, y - 6);
    ctx.stroke();
    y += 14;
    ctx.fillStyle = '#ff7733';
    ctx.font = 'bold 17px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Total', leftX, y);
    ctx.textAlign = 'right';
    ctx.fillText(formatTime(total), rightX, y);

    if (respawns === 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.font = '14px monospace';
      ctx.fillText('♛  flawless run!  ♛', canvas.width / 2, y + 36);
    }
  }

  ctx.textAlign = 'center';
  if (Math.floor(timestamp / 500) % 2 === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText('press SPACE to restart', canvas.width / 2, canvas.height - 40);
  }

  ctx.restore();
}

// ── Main loop ─────────────────────────────────────────────────────────────

function gameLoop(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  if (gameState === 'menu') {
    drawMenuScreen(timestamp);
    if (input.justPressed('Space')) startGame();
    input.clearFrame();
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameState === 'won') {
    drawWinScreen(timestamp);
    if (input.justPressed('Space')) returnToMenu();
    input.clearFrame();
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameState === 'paused') {
    drawGameScene();
    drawPauseOverlay(timestamp);
    if (input.justPressed('KeyM')) {
      returnToMenu();
    } else if (input.justPressed('KeyP') || input.justPressed('Space')) {
      levelStartMs += performance.now() - pauseStartMs;
      gameState = 'playing';
    }
    input.clearFrame();
    requestAnimationFrame(gameLoop);
    return;
  }

  // ── Update ─────────────────────────────────────────────────────────────

  if (input.justPressed('KeyP')) {
    pauseStartMs = performance.now();
    gameState = 'paused';
    input.clearFrame();
    requestAnimationFrame(gameLoop);
    return;
  }
  if (input.justPressed('KeyM')) {
    returnToMenu();
    input.clearFrame();
    requestAnimationFrame(gameLoop);
    return;
  }

  // Secret cheats (invalidate time)
  if (input.justPressed('Enter')) {
    player.invincible = !player.invincible;
    if (player.invincible) cheated = true;
  }
  for (let n = 1; n <= Level.count; n++) {
    if (input.justPressed(`Digit${n}`)) {
      cheated = true;
      levelStartMs = performance.now();
      loadLevel(n - 1);
      break;
    }
  }

  for (const p of level.platforms) { if (p.update) p.update(dt); }

  player.update(dt, input, level.platforms);

  if (player.invincible) {
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > level.width) player.x = level.width - player.width;
  }

  if (input.justPressed('KeyR')) doRespawn();

  // Fall off world
  if (player.y > level.height && !player.invincible) doRespawn();

  // Spike collision
  if (!player.invincible) {
    for (const spike of level.spikes) {
      if (spike.collides(player)) { doRespawn(); break; }
    }
  }

  // Lava rises and kills
  lava.update(dt, level.lavaSpeed);
  if (!player.invincible && lava.touches(player)) doRespawn();

  // Door interaction
  if (level.door.isNear(player) && input.justPressed('KeyE')) {
    levelTimes.push(performance.now() - levelStartMs);
    levelStartMs = performance.now();
    if (currentLevel + 1 < Level.count) {
      loadLevel(currentLevel + 1);
    } else {
      gameState = 'won';
    }
  }

  camera.update(player, dt);
  input.clearFrame();
  drawGameScene();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
