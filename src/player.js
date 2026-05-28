const GRAVITY      = 1500;
const JUMP_SPEED   = -720;
const MOVE_SPEED   = 260;
const TERMINAL_VEL = 900;

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width   = 28;
    this.height  = 36;
    this.vx = 0;
    this.vy = 0;
    this.onGround    = false;
    this.facingRight = true;
    this.invincible  = false;
    this._coyoteFrames   = 0;
    this._jumpHeld       = false;
    this._ridingPlatform = null;
  }

  update(dt, input, platforms) {
    if (this.invincible) { this._flyUpdate(dt, input); return; }

    if (this.onGround && this._ridingPlatform && this._ridingPlatform.vx !== undefined) {
      this.x += this._ridingPlatform.vx;
      this.y += this._ridingPlatform.vy;
    }
    this._ridingPlatform = null;

    const left  = input.isDown('ArrowLeft')  || input.isDown('KeyA');
    const right = input.isDown('ArrowRight') || input.isDown('KeyD');
    if (left)       { this.vx = -MOVE_SPEED; this.facingRight = false; }
    else if (right) { this.vx =  MOVE_SPEED; this.facingRight = true;  }
    else            { this.vx = 0; }

    const canJump    = this.onGround || this._coyoteFrames > 0;
    const jumpDown   = input.isDown('ArrowUp')    || input.isDown('KeyW') || input.isDown('Space');
    const jumpPressed = input.justPressed('ArrowUp') || input.justPressed('KeyW') || input.justPressed('Space');

    if (jumpPressed && canJump) {
      this.vy = JUMP_SPEED;
      this.onGround = false;
      this._coyoteFrames = 0;
    }
    if (this._jumpHeld && !jumpDown && this.vy < 0) this.vy *= 0.4;
    this._jumpHeld = jumpDown;

    this.vy = Math.min(this.vy + GRAVITY * dt, TERMINAL_VEL);

    this.x += this.vx * dt;
    this._resolveX(platforms);

    const wasOnGround = this.onGround;
    this.onGround = false;
    this.y += this.vy * dt;
    this._resolveY(platforms);

    if (wasOnGround && !this.onGround)  this._coyoteFrames = 6;
    else if (this.onGround)             this._coyoteFrames = 0;
    else this._coyoteFrames = Math.max(0, this._coyoteFrames - 1);
  }

  _resolveX(platforms) {
    for (const p of platforms) {
      if (!this._overlaps(p)) continue;
      if (this.vx > 0) this.x = p.x - this.width;
      else if (this.vx < 0) this.x = p.x + p.width;
      this.vx = 0;
    }
  }

  _resolveY(platforms) {
    for (const p of platforms) {
      if (!this._overlaps(p)) continue;
      if (this.vy >= 0) {
        this.y = p.y - this.height;
        this.onGround = true;
        this._ridingPlatform = p;
      } else {
        this.y = p.y + p.height;
      }
      this.vy = 0;
    }
  }

  _flyUpdate(dt, input) {
    const S = 380;
    const up    = input.isDown('ArrowUp')    || input.isDown('KeyW') || input.isDown('Space');
    const down  = input.isDown('ArrowDown')  || input.isDown('KeyS');
    const left  = input.isDown('ArrowLeft')  || input.isDown('KeyA');
    const right = input.isDown('ArrowRight') || input.isDown('KeyD');
    this.vx = 0; this.vy = 0;
    if (right) this.vx += S;  if (left)  this.vx -= S;
    if (up)    this.vy -= S;  if (down)  this.vy += S;
    if (this.vx > 0) this.facingRight = true;
    else if (this.vx < 0) this.facingRight = false;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.onGround = false;
  }

  respawn(x, y) {
    this.x = x;
    this.y = y - 25;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this._coyoteFrames   = 0;
    this._ridingPlatform = null;
  }

  _overlaps(p) {
    return this.x < p.x + p.width   &&
           this.x + this.width  > p.x &&
           this.y < p.y + p.height  &&
           this.y + this.height > p.y;
  }

  draw(ctx) {
    if (this.invincible) {
      const pulse = 0.25 + 0.2 * Math.sin(performance.now() / 120);
      ctx.fillStyle = `rgba(255,215,0,${pulse})`;
      ctx.fillRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
    }
    ctx.fillStyle = this.invincible ? '#ffd700' : '#c02030';
    ctx.fillRect(this.x, this.y + 8, this.width, this.height - 8);
    ctx.fillStyle = this.invincible ? '#ffe060' : '#e8c870';
    ctx.fillRect(this.x + 3, this.y, this.width - 6, 10);
    ctx.fillStyle = '#0d0d1a';
    const eyeX = this.facingRight ? this.x + this.width - 9 : this.x + 5;
    ctx.fillRect(eyeX, this.y + 2, 4, 4);
  }
}
