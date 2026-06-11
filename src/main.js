const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');

canvas.width  = 800;
canvas.height = 600;
ctx.imageSmoothingEnabled = false;

const VPORT_W = canvas.width / 2; // 400 — each player's viewport in 2P mode

const input = new Input();

let currentLevel  = 0;
let deaths        = [0, 0]; // per-player; deaths[1] unused in 1P mode
let gameState     = 'menu'; // 'menu' | 'playing' | 'paused' | 'won'
let twoPlayerMode = false;
let pauseStartMs  = 0;

let levelStartMs = 0;
let levelTimes   = [];
let cheated      = false;

// 1P: full merged controls (arrows + WASD)
const P1_CONTROLS_1P = {
  left:  ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up:    ['ArrowUp', 'KeyW', 'Space'],
  down:  ['ArrowDown', 'KeyS'],
};
// 2P: P1 = WASD + shift, P2 = arrows + space
const P1_CONTROLS_2P = {
  left:  ['KeyA'],
  right: ['KeyD'],
  up:    ['KeyW', 'ShiftLeft'],
  down:  ['KeyS'],
};
const P2_CONTROLS = {
  left:  ['ArrowLeft'],
  right: ['ArrowRight'],
  up:    ['ArrowUp', 'Space'],
  down:  ['ArrowDown'],
};

function formatTime(ms) {
  const totalSec = ms / 1000;
  const mins = Math.floor(totalSec / 60);
  const secs = (totalSec % 60).toFixed(2).padStart(5, '0');
  return `${mins}:${secs}`;
}

let level, players, cameras, lava;

function snapCameras() {
  const vw = twoPlayerMode ? VPORT_W : canvas.width;
  for (let i = 0; i < players.length; i++) {
    cameras[i].x = Math.max(0, Math.min(
      players[i].x + players[i].width  / 2 - vw / 2,
      level.width - vw
    ));
    cameras[i].y = Math.max(0, Math.min(
      players[i].y + players[i].height / 2 - canvas.height / 2,
      level.height - canvas.height
    ));
  }
}

function loadLevel(n) {
  const wasInvincible = players ? players[0].invincible : false;
  currentLevel = n;
  level = new Level(n);
  lava  = new Lava(level.height);

  if (twoPlayerMode) {
    players = [
      new Player(level.spawnX,      level.spawnY, P1_CONTROLS_2P),
      new Player(level.spawnX + 40, level.spawnY, P2_CONTROLS, '#1a88cc'),
    ];
    cameras = [
      new Camera(VPORT_W,       canvas.height, level.width, level.height),
      new Camera(VPORT_W,       canvas.height, level.width, level.height),
    ];
  } else {
    players = [new Player(level.spawnX, level.spawnY, P1_CONTROLS_1P)];
    cameras = [new Camera(canvas.width, canvas.height, level.width, level.height)];
  }
  players[0].invincible = wasInvincible;
  snapCameras();
}

function startGame() {
  deaths       = [0, 0];
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
    ctx.font = '15px monospace';
    ctx.fillText('SPACE — 1 Player        ENTER — 2 Players', canvas.width / 2, canvas.height / 2 + 68);
  }

  ctx.fillStyle = '#3a1a1a';
  ctx.shadowBlur = 0;
  ctx.font = '11px monospace';
  ctx.fillText('1P: WASD to move · shift to jump    2P: arrows to move · space to jump',
               canvas.width / 2, canvas.height - 60);
  ctx.fillText('E at door to advance · 1P: R to respawn · 2P: no respawn — survive!',
               canvas.width / 2, canvas.height - 42);
  ctx.fillText('P to pause · M for menu',
               canvas.width / 2, canvas.height - 24);

  ctx.restore();
}

function returnToMenu() {
  deaths     = [0, 0];
  levelTimes = [];
  cheated    = false;
  if (players) players.forEach(p => { p.invincible = false; p.dead = false; });
  gameState  = 'menu';
}

function drawBackground(cam) {
  ctx.fillStyle = 'rgba(255,80,0,0.04)';
  const dots = [[40,30],[120,80],[200,50],[310,110],[70,170],[260,200],[350,60],[150,240],[380,180],[90,250]];
  const tileW = 400, tileH = 300;
  const sx = Math.floor(cam.x / tileW);
  const sy = Math.floor(cam.y / tileH);
  for (let tx = sx - 1; tx <= sx + Math.ceil(cam.width / tileW) + 1; tx++) {
    for (let ty = sy - 1; ty <= sy + Math.ceil(cam.height / tileH) + 1; ty++) {
      for (const [dx, dy] of dots) ctx.fillRect(tx * tileW + dx, ty * tileH + dy, 2, 2);
    }
  }
}

function drawHUD() {
  const t = formatTime(performance.now() - levelStartMs);
  ctx.font = 'bold 13px monospace';

  if (twoPlayerMode) {
    // Left viewport — P1 info
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(5, 5, 240, 22);
    ctx.fillStyle = '#ff7733';
    ctx.fillText(`LVL ${currentLevel + 1}/${Level.count}  ${t}  P1:${deaths[0]}`, 10, 21);

    // Right viewport — P2 info
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(VPORT_W + 5, 5, 80, 22);
    ctx.fillStyle = '#33aaff';
    ctx.fillText(`P2:${deaths[1]}`, VPORT_W + 10, 21);

    // Per-player lava proximity warning
    for (let i = 0; i < 2; i++) {
      if (players[i].dead) continue;
      const lavaDist = lava.y - (players[i].y + players[i].height);
      if (lavaDist < 350) {
        const offsetX = i * VPORT_W;
        const danger = Math.max(0, 1 - lavaDist / 350);
        const pulse  = 0.5 + 0.5 * Math.sin(performance.now() / 150);
        ctx.fillStyle = `rgba(255,40,0,${danger * 0.35 * pulse})`;
        ctx.fillRect(offsetX, canvas.height - 8, VPORT_W, 8);
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = `rgba(255,100,0,${Math.min(1, danger * 1.5)})`;
        ctx.textAlign = 'right';
        ctx.fillText(`LAVA ↑${Math.max(0, Math.floor(lavaDist))}px`, offsetX + VPORT_W - 6, canvas.height - 12);
        ctx.textAlign = 'left';
        ctx.font = 'bold 13px monospace';
      }
    }

    // All dead: show advance prompt centered
    const allDead = players.every(p => p.dead);
    if (allDead) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(canvas.width / 2 - 210, canvas.height / 2 - 18, 420, 28);
      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ALL DEAD · PRESS E TO ADVANCE', canvas.width / 2, canvas.height / 2 + 5);
      ctx.textAlign = 'left';
    } else {
      // Co-op door status
      const p1Alive = !players[0].dead;
      const p2Alive = !players[1].dead;
      const p1At = p1Alive && level.door.isNear(players[0]);
      const p2At = p2Alive && level.door.isNear(players[1]);
      const bothAlive = p1Alive && p2Alive;

      if (bothAlive && (p1At || p2At) && !(p1At && p2At)) {
        const msg = p1At ? 'P1 at door · waiting for P2' : 'P2 at door · waiting for P1';
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(canvas.width / 2 - 175, canvas.height - 26, 350, 20);
        ctx.fillStyle = '#ffdd44';
        ctx.textAlign = 'center';
        ctx.fillText(msg, canvas.width / 2, canvas.height - 11);
        ctx.textAlign = 'left';
      } else if (p1At && p2At) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(canvas.width / 2 - 175, canvas.height - 26, 350, 20);
        ctx.fillStyle = '#00ff88';
        ctx.textAlign = 'center';
        ctx.fillText('both at door — press E!', canvas.width / 2, canvas.height - 11);
        ctx.textAlign = 'left';
      }
    }

  } else {
    // Original 1P HUD
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 10, 380, 28);
    ctx.fillStyle = '#ff7733';
    ctx.fillText(`LVL ${currentLevel + 1}/${Level.count}   TIME ${t}   DEATHS ${deaths[0]}`, 18, 29);

    if (players[0].invincible) {
      ctx.fillStyle = 'rgba(255,215,0,0.25)';
      ctx.fillRect(canvas.width - 160, 10, 150, 28);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('★ INVINCIBLE ★', canvas.width - 150, 29);
    }

    const lavaDist = lava.y - (players[0].y + players[0].height);
    if (lavaDist < 350) {
      const danger = Math.max(0, 1 - lavaDist / 350);
      const pulse  = 0.5 + 0.5 * Math.sin(performance.now() / 150);
      ctx.fillStyle = `rgba(255,40,0,${danger * 0.35 * pulse})`;
      ctx.fillRect(0, canvas.height - 8, canvas.width, 8);
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = `rgba(255,100,0,${Math.min(1, danger * 1.5)})`;
      ctx.textAlign = 'right';
      ctx.fillText(`LAVA ↑${Math.max(0, Math.floor(lavaDist))}px`, canvas.width - 12, canvas.height - 12);
      ctx.textAlign = 'left';
    }
  }
}

function drawViewport(i, offsetX) {
  const cam = cameras[i];
  const vw  = twoPlayerMode ? VPORT_W : canvas.width;

  ctx.save();
  ctx.beginPath();
  ctx.rect(offsetX, 0, vw, canvas.height);
  ctx.clip();

  ctx.fillStyle = level.bgColor;
  ctx.fillRect(offsetX, 0, vw, canvas.height);

  ctx.translate(offsetX - Math.round(cam.x), -Math.round(cam.y));

  drawBackground(cam);
  for (const p of level.platforms) p.draw(ctx);
  for (const s of level.spikes)    s.draw(ctx);

  // Door prompt shows only when all alive players are at the door
  const alivePlayers = players.filter(p => !p.dead);
  const showPrompt = alivePlayers.length > 0 && alivePlayers.every(p => level.door.isNear(p));
  level.door.draw(ctx, showPrompt);

  lava.draw(ctx, level.width);

  for (const p of players) p.draw(ctx);

  ctx.restore();

  // Dead overlay — drawn in screen space after world
  if (twoPlayerMode && players[i].dead) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(offsetX, 0, vw, canvas.height);
    ctx.fillStyle = '#cc3333';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DEAD', offsetX + vw / 2, canvas.height / 2 - 12);
    ctx.fillStyle = '#776666';
    ctx.font = '12px monospace';
    ctx.fillText('waiting for next level...', offsetX + vw / 2, canvas.height / 2 + 12);
    ctx.textAlign = 'left';
  }
}

function drawGameScene() {
  if (twoPlayerMode) {
    drawViewport(0, 0);
    drawViewport(1, VPORT_W);
    ctx.fillStyle = '#000000';
    ctx.fillRect(VPORT_W - 1, 0, 2, canvas.height);
  } else {
    drawViewport(0, 0);
  }
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

  const totalDeaths = deaths[0] + deaths[1];
  ctx.fillStyle = '#7a3a3a';
  ctx.font = '13px monospace';
  if (twoPlayerMode) {
    ctx.fillText(`P1 deaths: ${deaths[0]}  ·  P2 deaths: ${deaths[1]}  ·  total: ${totalDeaths}`,
                 canvas.width / 2, 95);
  } else {
    ctx.fillText(`deaths: ${deaths[0]}`, canvas.width / 2, 95);
  }

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

    if (totalDeaths === 0) {
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
    if (input.justPressed('Space')) { twoPlayerMode = false; startGame(); }
    if (input.justPressed('Enter')) { twoPlayerMode = true;  startGame(); }
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

  // Secret cheats: Tab = P1 (WASD), Enter = P2 (arrows) in 2P / P1 in 1P
  if (input.justPressed('Tab')) {
    players[0].invincible = !players[0].invincible;
    if (players[0].invincible) cheated = true;
  }
  if (input.justPressed('Enter')) {
    const target = twoPlayerMode ? players[1] : players[0];
    target.invincible = !target.invincible;
    if (target.invincible) cheated = true;
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

  for (const p of players) p.update(dt, input, level.platforms);

  // Boundary clamp for invincible alive players
  for (const p of players) {
    if (!p.dead && p.invincible) {
      if (p.x < 0) p.x = 0;
      if (p.x + p.width > level.width) p.x = level.width - p.width;
    }
  }

  // 1P manual respawn (R key; resets lava)
  if (!twoPlayerMode && input.justPressed('KeyR')) {
    deaths[0]++;
    players[0].respawn(level.spawnX, level.spawnY);
    lava.reset();
    snapCameras();
  }

  // Death checks — independent per player; no respawn in 2P
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (p.dead || p.invincible) continue;

    let died = p.y > level.height;
    if (!died) {
      for (const spike of level.spikes) {
        if (spike.collides(p)) { died = true; break; }
      }
    }
    if (!died) died = lava.touches(p);

    if (died) {
      deaths[i]++;
      if (twoPlayerMode) {
        p.dead = true;
      } else {
        p.respawn(level.spawnX, level.spawnY);
        lava.reset();
        snapCameras();
      }
    }
  }

  // Lava rises every frame (shared; never resets mid-level in 2P)
  lava.update(dt, level.lavaSpeed);

  // Door & level advance
  // All dead → E advances; else all alive players must be at door
  const allDead = twoPlayerMode && players.every(p => p.dead);
  const alivePlayers = players.filter(p => !p.dead);
  const allAliveAtDoor = alivePlayers.length > 0 && alivePlayers.every(p => level.door.isNear(p));

  if ((allDead || allAliveAtDoor) && input.justPressed('KeyE')) {
    levelTimes.push(performance.now() - levelStartMs);
    levelStartMs = performance.now();
    if (currentLevel + 1 < Level.count) {
      loadLevel(currentLevel + 1);
    } else {
      gameState = 'won';
    }
  }

  // Update cameras — only follow alive players; freeze dead players' cameras
  for (let i = 0; i < cameras.length; i++) {
    if (!players[i].dead) cameras[i].update(players[i], dt);
  }

  input.clearFrame();
  drawGameScene();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
