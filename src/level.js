// Vertical climb levels. Width=800 matches canvas so no horizontal scroll.
// Platforms use two zones: Left x=80 w=120 (right-edge 200) and Right x=420 w=120
// (left-edge 420). Edge-to-edge gap = 220px, well within the 250px jump range.
// Vertical spacing ≤ 155px, max jump height ≈ 172px.
// Spawn at bottom (high y), door at top (low y).
// lavaSpeed: px/s the lava rises. Resets on each death.

const LEVELS = [
  // ── Level 1: Slow Burn ─────────────────────────────────────────────────
  // Easy zigzag, no spikes. Lava is gentle — 40 px/s.
  {
    width: 800, height: 2800, bgColor: '#160500',
    lavaSpeed: 40,
    spawnX: 360, spawnY: 2710,
    platforms: [
      [0,   2760, 800, 40, '#3d1500'],
      [80,  2610, 120, 18, '#5a2510'],
      [420, 2460, 120, 18, '#5a2510'],
      [80,  2310, 120, 18, '#5a2510'],
      [420, 2160, 120, 18, '#5a2510'],
      [80,  2010, 120, 18, '#5a2510'],
      [420, 1860, 120, 18, '#5a2510'],
      [80,  1710, 120, 18, '#5a2510'],
      [420, 1560, 120, 18, '#5a2510'],
      [80,  1410, 120, 18, '#5a2510'],
      [420, 1260, 120, 18, '#5a2510'],
      [80,  1110, 120, 18, '#5a2510'],
      [420, 960,  120, 18, '#5a2510'],
      [80,  810,  120, 18, '#5a2510'],
      [420, 660,  120, 18, '#5a2510'],
      [80,  510,  120, 18, '#5a2510'],
      [420, 360,  120, 18, '#5a2510'],
      [80,  240,  120, 18, '#5a2510'],
      [0,   160,  800, 40, '#3d1500'],
    ],
    spikes: [],
    movingPlatforms: [],
    door: [375, 110],
  },

  // ── Level 2: The Creep ─────────────────────────────────────────────────
  // Slightly varied x positions, 5 spikes, lava at 58 px/s.
  {
    width: 800, height: 2800, bgColor: '#100000',
    lavaSpeed: 58,
    spawnX: 360, spawnY: 2710,
    platforms: [
      [0,   2760, 800, 40, '#380a00'],
      [90,  2610, 110, 18, '#6a1a0a'],
      [430, 2460, 110, 18, '#6a1a0a'],  // spike here
      [90,  2310, 110, 18, '#6a1a0a'],  // spike here
      [430, 2160, 110, 18, '#6a1a0a'],
      [90,  2010, 110, 18, '#6a1a0a'],  // spike here
      [430, 1860, 110, 18, '#6a1a0a'],
      [90,  1710, 110, 18, '#6a1a0a'],  // spike here
      [430, 1560, 110, 18, '#6a1a0a'],
      [90,  1410, 110, 18, '#6a1a0a'],
      [430, 1260, 110, 18, '#6a1a0a'],  // spike here
      [90,  1110, 110, 18, '#6a1a0a'],
      [430, 960,  110, 18, '#6a1a0a'],
      [90,  810,  110, 18, '#6a1a0a'],
      [430, 660,  110, 18, '#6a1a0a'],
      [90,  510,  110, 18, '#6a1a0a'],
      [430, 360,  110, 18, '#6a1a0a'],
      [90,  240,  110, 18, '#6a1a0a'],
      [0,   160,  800, 40, '#380a00'],
    ],
    spikes: [
      [477, 2446, 1],  // on (430,2460)
      [137, 2296, 1],  // on (90,2310)
      [137, 1996, 1],  // on (90,2010)
      [137, 1696, 1],  // on (90,1710)
      [477, 1246, 1],  // on (430,1260)
    ],
    movingPlatforms: [],
    door: [375, 110],
  },

  // ── Level 3: The Rush ──────────────────────────────────────────────────
  // Three-zone path (L / C / R) requires diagonal jumps. 9 spikes. 80 px/s.
  // Zones: L x=60 w=100, C x=290 w=100, R x=510 w=100
  // L→C gap: 290-160=130px ✓  C→R gap: 510-390=120px ✓  L→R: 510-160=350px (needs C step)
  {
    width: 800, height: 2800, bgColor: '#0a0000',
    lavaSpeed: 80,
    spawnX: 350, spawnY: 2710,
    platforms: [
      [0,   2760, 800, 40, '#300800'],
      // L→C→R→C→L→C→R pattern (diagonal climbs)
      [290, 2620, 100, 18, '#7a1008'],  // C
      [510, 2470, 100, 18, '#7a1008'],  // R spike
      [290, 2320, 100, 18, '#7a1008'],  // C
      [60,  2170, 100, 18, '#7a1008'],  // L spike
      [290, 2020, 100, 18, '#7a1008'],  // C
      [510, 1870, 100, 18, '#7a1008'],  // R spike
      [290, 1720, 100, 18, '#7a1008'],  // C
      [60,  1570, 100, 18, '#7a1008'],  // L spike
      [290, 1420, 100, 18, '#7a1008'],  // C
      [510, 1270, 100, 18, '#7a1008'],  // R spike
      [290, 1120, 100, 18, '#7a1008'],  // C
      [60,   970, 100, 18, '#7a1008'],  // L spike
      [290,  820, 100, 18, '#7a1008'],  // C
      [510,  670, 100, 18, '#7a1008'],  // R spike
      [290,  520, 100, 18, '#7a1008'],  // C
      [60,   370, 100, 18, '#7a1008'],  // L
      [290,  240, 100, 18, '#7a1008'],  // C
      [0,    160, 800, 40, '#300800'],
    ],
    spikes: [
      [557, 2456, 1],  // on (510,2470)
      [107, 2156, 1],  // on (60,2170)
      [557, 1856, 1],  // on (510,1870)
      [107, 1556, 1],  // on (60,1570)
      [557, 1256, 1],  // on (510,1270)
      [107,  956, 1],  // on (60,970)
      [557,  656, 1],  // on (510,670)
      [337, 1106, 1],  // on (290,1120)
      [337,  506, 1],  // on (290,520)
    ],
    movingPlatforms: [],
    door: [375, 110],
  },

  // ── Level 4: The Blaze ────────────────────────────────────────────────
  // Three static-platform sections split by moving platforms. 105 px/s.
  // Moving platforms oscillate horizontally.
  {
    width: 800, height: 2800, bgColor: '#0e0010',
    lavaSpeed: 105,
    spawnX: 360, spawnY: 2710,
    platforms: [
      [0,   2760, 800, 40, '#280015'],
      [80,  2610, 110, 18, '#6a0a30'],
      [430, 2460, 110, 18, '#6a0a30'],  // spike
      [80,  2310, 110, 18, '#6a0a30'],
      // moving at y=2155
      [430, 2010, 110, 18, '#6a0a30'],  // spike
      [80,  1860, 110, 18, '#6a0a30'],
      // moving at y=1705
      [430, 1560, 110, 18, '#6a0a30'],  // spike
      [80,  1410, 110, 18, '#6a0a30'],
      // moving at y=1255
      [430, 1110, 110, 18, '#6a0a30'],  // spike
      [80,   960, 110, 18, '#6a0a30'],
      [430,  810, 110, 18, '#6a0a30'],
      [80,   660, 110, 18, '#6a0a30'],  // spike
      [430,  510, 110, 18, '#6a0a30'],
      [80,   360, 110, 18, '#6a0a30'],
      [430,  240, 110, 18, '#6a0a30'],
      [0,    160, 800, 40, '#280015'],
    ],
    movingPlatforms: [
      // [x, y, w, h, color, axis, range, speed, phase]
      [220, 2155, 110, 18, '#8a1a40', 'x', 100, 120, 0.0],
      [240, 1705, 110, 18, '#8a1a40', 'x', 110, 130, 1.2],
      [200, 1255, 110, 18, '#8a1a40', 'x',  95, 115, 2.1],
    ],
    spikes: [
      [477, 2446, 1],  // on (430,2460)
      [477, 1996, 1],  // on (430,2010)
      [477, 1546, 1],  // on (430,1560)
      [477, 1096, 1],  // on (430,1110)
      [127,  646, 1],  // on (80,660)
    ],
    door: [375, 110],
  },

  // ── Level 5: The Inferno ──────────────────────────────────────────────
  // Mix of H and V moving platforms, dense spikes. 138 px/s.
  {
    width: 800, height: 2800, bgColor: '#05000d',
    lavaSpeed: 138,
    spawnX: 360, spawnY: 2710,
    platforms: [
      [0,   2760, 800, 40, '#1a0025'],
      [80,  2615, 100, 18, '#5a0050'],
      [460, 2465, 100, 18, '#5a0050'],  // spike
      // moving H at y=2310
      [80,  2160, 100, 18, '#5a0050'],  // spike
      // moving V at y=2005
      [460, 1855, 100, 18, '#5a0050'],  // spike
      [80,  1705, 100, 18, '#5a0050'],
      // moving H at y=1550
      [460, 1400, 100, 18, '#5a0050'],  // spike
      [80,  1250, 100, 18, '#5a0050'],
      // moving V at y=1095
      [460,  945, 100, 18, '#5a0050'],  // spike
      [80,   795, 100, 18, '#5a0050'],
      // moving H at y=640
      [460,  490, 100, 18, '#5a0050'],  // spike
      [80,   355, 100, 18, '#5a0050'],  // spike
      [460,  240, 100, 18, '#5a0050'],
      [0,    160, 800, 40, '#1a0025'],
    ],
    movingPlatforms: [
      [220, 2310, 100, 18, '#8a00a0', 'x', 110, 140, 0.0],
      [280, 2005, 100, 18, '#8a00a0', 'y',  60,  80, 0.7],
      [220, 1550, 100, 18, '#8a00a0', 'x', 120, 145, 1.5],
      [280, 1095, 100, 18, '#8a00a0', 'y',  65,  85, 2.3],
      [220,  640, 100, 18, '#8a00a0', 'x', 115, 140, 0.9],
    ],
    spikes: [
      [507, 2451, 1],  // on (460,2465)
      [127, 2146, 1],  // on (80,2160)
      [507, 1841, 1],  // on (460,1855)
      [507, 1386, 1],  // on (460,1400)
      [507,  931, 1],  // on (460,945)
      [507,  476, 1],  // on (460,490)
      [127,  341, 1],  // on (80,355)
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
