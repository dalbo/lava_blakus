// Three-zone vertical staircase layout.
// L: x=80  w=100  right-edge=180
// M: x=280 w=100  left=280  right=380
// R: x=480 w=100  left=480
// Edge-to-edge gap between adjacent zones: 100px
// Vertical spacing: 130px per step (max jump ≈172px — comfortable margin)
// Pattern repeats: L→M→R→M→L→M→R→...
// Spikes sit on outer edges (L: left side, R: right side) to avoid blocking landings.
// Moving platforms oscillate within M zone: origin x=280, range=70–85 (x: 195..365).

const LEVELS = [
  // ── Level 1: Slow Burn ─────────────────────────────────────────────────
  // Clean staircase, no hazards. Learn the lava mechanic.
  {
    width: 800, height: 2800, bgColor: '#160500',
    lavaSpeed: 40,
    spawnX: 360, spawnY: 2710,
    platforms: [
      [0,   2760, 800, 40, '#3d1500'],  // floor
      [80,  2630, 100, 18, '#5a2510'],  // L
      [280, 2500, 100, 18, '#5a2510'],  // M
      [480, 2370, 100, 18, '#5a2510'],  // R
      [280, 2240, 100, 18, '#5a2510'],  // M
      [80,  2110, 100, 18, '#5a2510'],  // L
      [280, 1980, 100, 18, '#5a2510'],  // M
      [480, 1850, 100, 18, '#5a2510'],  // R
      [280, 1720, 100, 18, '#5a2510'],  // M
      [80,  1590, 100, 18, '#5a2510'],  // L
      [280, 1460, 100, 18, '#5a2510'],  // M
      [480, 1330, 100, 18, '#5a2510'],  // R
      [280, 1200, 100, 18, '#5a2510'],  // M
      [80,  1070, 100, 18, '#5a2510'],  // L
      [280,  940, 100, 18, '#5a2510'],  // M
      [480,  810, 100, 18, '#5a2510'],  // R
      [280,  680, 100, 18, '#5a2510'],  // M
      [80,   550, 100, 18, '#5a2510'],  // L
      [280,  420, 100, 18, '#5a2510'],  // M
      [480,  290, 100, 18, '#5a2510'],  // R
      [0,    160, 800, 40, '#3d1500'],  // top
    ],
    spikes: [],
    movingPlatforms: [],
    door: [375, 110],
  },

  // ── Level 2: The Creep ─────────────────────────────────────────────────
  // 5 spikes on outer edges of alternating R and L platforms. 58 px/s.
  {
    width: 800, height: 2800, bgColor: '#100000',
    lavaSpeed: 58,
    spawnX: 360, spawnY: 2710,
    platforms: [
      [0,   2760, 800, 40, '#380a00'],
      [80,  2630, 100, 18, '#6a1a0a'],  // L
      [280, 2500, 100, 18, '#6a1a0a'],  // M
      [480, 2370, 100, 18, '#6a1a0a'],  // R  spike →
      [280, 2240, 100, 18, '#6a1a0a'],  // M
      [80,  2110, 100, 18, '#6a1a0a'],  // L  ← spike
      [280, 1980, 100, 18, '#6a1a0a'],  // M
      [480, 1850, 100, 18, '#6a1a0a'],  // R  spike →
      [280, 1720, 100, 18, '#6a1a0a'],  // M
      [80,  1590, 100, 18, '#6a1a0a'],  // L  ← spike
      [280, 1460, 100, 18, '#6a1a0a'],  // M
      [480, 1330, 100, 18, '#6a1a0a'],  // R  spike →
      [280, 1200, 100, 18, '#6a1a0a'],  // M
      [80,  1070, 100, 18, '#6a1a0a'],  // L
      [280,  940, 100, 18, '#6a1a0a'],  // M
      [480,  810, 100, 18, '#6a1a0a'],  // R
      [280,  680, 100, 18, '#6a1a0a'],  // M
      [80,   550, 100, 18, '#6a1a0a'],  // L
      [280,  420, 100, 18, '#6a1a0a'],  // M
      [480,  290, 100, 18, '#6a1a0a'],  // R
      [0,    160, 800, 40, '#380a00'],
    ],
    // Outer-edge spikes: R right edge x=480+100-16=564; L left edge x=80
    spikes: [
      [564, 2356, 1],  // R @ 2370
      [80,  2096, 1],  // L @ 2110
      [564, 1836, 1],  // R @ 1850
      [80,  1576, 1],  // L @ 1590
      [564, 1316, 1],  // R @ 1330
    ],
    movingPlatforms: [],
    door: [375, 110],
  },

  // ── Level 3: The Rush ──────────────────────────────────────────────────
  // Spike on every L and R platform (outer edge). 9 spikes. 80 px/s.
  // M platforms remain safe stepping stones.
  {
    width: 800, height: 2800, bgColor: '#0a0000',
    lavaSpeed: 80,
    spawnX: 360, spawnY: 2710,
    platforms: [
      [0,   2760, 800, 40, '#300800'],
      [80,  2630, 100, 18, '#7a1008'],  // L
      [280, 2500, 100, 18, '#7a1008'],  // M
      [480, 2370, 100, 18, '#7a1008'],  // R  spike
      [280, 2240, 100, 18, '#7a1008'],  // M
      [80,  2110, 100, 18, '#7a1008'],  // L  spike
      [280, 1980, 100, 18, '#7a1008'],  // M
      [480, 1850, 100, 18, '#7a1008'],  // R  spike
      [280, 1720, 100, 18, '#7a1008'],  // M
      [80,  1590, 100, 18, '#7a1008'],  // L  spike
      [280, 1460, 100, 18, '#7a1008'],  // M
      [480, 1330, 100, 18, '#7a1008'],  // R  spike
      [280, 1200, 100, 18, '#7a1008'],  // M
      [80,  1070, 100, 18, '#7a1008'],  // L  spike
      [280,  940, 100, 18, '#7a1008'],  // M
      [480,  810, 100, 18, '#7a1008'],  // R  spike
      [280,  680, 100, 18, '#7a1008'],  // M
      [80,   550, 100, 18, '#7a1008'],  // L  spike
      [280,  420, 100, 18, '#7a1008'],  // M
      [480,  290, 100, 18, '#7a1008'],  // R  spike
      [0,    160, 800, 40, '#300800'],
    ],
    spikes: [
      [564, 2356, 1],  // R @ 2370
      [80,  2096, 1],  // L @ 2110
      [564, 1836, 1],  // R @ 1850
      [80,  1576, 1],  // L @ 1590
      [564, 1316, 1],  // R @ 1330
      [80,  1056, 1],  // L @ 1070
      [564,  796, 1],  // R @ 810
      [80,   536, 1],  // L @ 550
      [564,  276, 1],  // R @ 290
    ],
    movingPlatforms: [],
    door: [375, 110],
  },

  // ── Level 4: The Blaze ────────────────────────────────────────────────
  // Every 3rd M position replaced with a moving platform (H oscillation).
  // Moving range: origin x=280, range=70 → platform sweeps x=210..350.
  // From L right-edge(180): min gap 30px, max gap 170px — always reachable.
  // From R left-edge(480): min gap 130px, max gap 270px — always reachable.
  // 5 spikes on alternating L/R. 105 px/s.
  {
    width: 800, height: 2800, bgColor: '#0e0010',
    lavaSpeed: 105,
    spawnX: 360, spawnY: 2710,
    platforms: [
      [0,   2760, 800, 40, '#280015'],
      [80,  2630, 100, 18, '#6a0a30'],  // L
      [280, 2500, 100, 18, '#6a0a30'],  // M (static)
      [480, 2370, 100, 18, '#6a0a30'],  // R  spike
      [280, 2240, 100, 18, '#6a0a30'],  // M (static)
      [80,  2110, 100, 18, '#6a0a30'],  // L  spike
      // 1980 → moving
      [480, 1850, 100, 18, '#6a0a30'],  // R  spike
      [280, 1720, 100, 18, '#6a0a30'],  // M (static)
      [80,  1590, 100, 18, '#6a0a30'],  // L  spike
      // 1460 → moving
      [480, 1330, 100, 18, '#6a0a30'],  // R  spike
      [280, 1200, 100, 18, '#6a0a30'],  // M (static)
      [80,  1070, 100, 18, '#6a0a30'],  // L
      // 940 → moving
      [480,  810, 100, 18, '#6a0a30'],  // R
      [280,  680, 100, 18, '#6a0a30'],  // M (static)
      [80,   550, 100, 18, '#6a0a30'],  // L
      [280,  420, 100, 18, '#6a0a30'],  // M (static)
      [480,  290, 100, 18, '#6a0a30'],  // R
      [0,    160, 800, 40, '#280015'],
    ],
    movingPlatforms: [
      [280, 1980, 100, 18, '#8a1a40', 'x', 70, 100, 0.0],
      [280, 1460, 100, 18, '#8a1a40', 'x', 70, 110, 1.4],
      [280,  940, 100, 18, '#8a1a40', 'x', 70, 105, 2.8],
    ],
    spikes: [
      [564, 2356, 1],  // R @ 2370
      [80,  2096, 1],  // L @ 2110
      [564, 1836, 1],  // R @ 1850
      [80,  1576, 1],  // L @ 1590
      [564, 1316, 1],  // R @ 1330
    ],
    door: [375, 110],
  },

  // ── Level 5: The Inferno ──────────────────────────────────────────────
  // Every M slot replaced with a moving platform. 5 movers, 7 spikes. 138 px/s.
  {
    width: 800, height: 2800, bgColor: '#05000d',
    lavaSpeed: 138,
    spawnX: 360, spawnY: 2710,
    platforms: [
      [0,   2760, 800, 40, '#1a0025'],
      [80,  2630, 100, 18, '#5a0050'],  // L
      [280, 2500, 100, 18, '#5a0050'],  // M (static — first M kept to ease in)
      [480, 2370, 100, 18, '#5a0050'],  // R  spike
      [280, 2240, 100, 18, '#5a0050'],  // M (static)
      [80,  2110, 100, 18, '#5a0050'],  // L  spike
      // 1980 → moving
      [480, 1850, 100, 18, '#5a0050'],  // R  spike
      // 1720 → moving
      [80,  1590, 100, 18, '#5a0050'],  // L  spike
      // 1460 → moving
      [480, 1330, 100, 18, '#5a0050'],  // R  spike
      // 1200 → moving
      [80,  1070, 100, 18, '#5a0050'],  // L  spike
      // 940 → moving
      [480,  810, 100, 18, '#5a0050'],  // R  spike
      [280,  680, 100, 18, '#5a0050'],  // M (static — breather near top)
      [80,   550, 100, 18, '#5a0050'],  // L
      [280,  420, 100, 18, '#5a0050'],  // M (static)
      [480,  290, 100, 18, '#5a0050'],  // R
      [0,    160, 800, 40, '#1a0025'],
    ],
    movingPlatforms: [
      [280, 1980, 100, 18, '#8a00a0', 'x', 80, 130, 0.0],
      [280, 1720, 100, 18, '#8a00a0', 'x', 80, 140, 1.0],
      [280, 1460, 100, 18, '#8a00a0', 'x', 80, 135, 2.0],
      [280, 1200, 100, 18, '#8a00a0', 'x', 80, 130, 3.0],
      [280,  940, 100, 18, '#8a00a0', 'x', 80, 145, 0.5],
    ],
    spikes: [
      [564, 2356, 1],  // R @ 2370
      [80,  2096, 1],  // L @ 2110
      [564, 1836, 1],  // R @ 1850
      [80,  1576, 1],  // L @ 1590
      [564, 1316, 1],  // R @ 1330
      [80,  1056, 1],  // L @ 1070
      [564,  796, 1],  // R @ 810
    ],
    door: [375, 110],
  },
];

class Level {
  constructor(index) {
    const d = LEVELS[index];
    this.index     = index;
    this.width     = d.width;
    this.height    = d.height;
    this.bgColor   = d.bgColor;
    this.spawnX    = d.spawnX;
    this.spawnY    = d.spawnY;
    this.lavaSpeed = d.lavaSpeed;
    this.platforms = [
      new Platform(-20, -200, 20, d.height + 400, d.bgColor),
      new Platform(d.width, -200, 20, d.height + 400, d.bgColor),
      ...d.platforms.map(p => new Platform(...p)),
      ...(d.movingPlatforms || []).map(p => new MovingPlatform(...p)),
    ];
    this.spikes = (d.spikes || []).map(s => new Spike(...s));
    this.door   = new Door(...d.door);
  }

  static get count() { return LEVELS.length; }
}
