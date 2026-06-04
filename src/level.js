function seededRng(seed) {
  let s = seed | 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 1) / 0x80000000;
  };
}

// Each vertical tier gets 2–3 platforms spread across the level width so the
// player can choose any route up rather than following a single forced path.
// spikeEvery>0 places a spike on every Nth platform (skipping the first tier).
// moverCount replaces that many platforms (evenly spaced) with moving platforms.
function genLevel(seed, floorY, topY, platColor, moverColor, spikeEvery, moverCount) {
  const rng = seededRng(seed);
  const MARGIN = 20, H = 18;
  const raw = [];

  for (let ty = floorY; ty > topY + 90;) {
    const step = 115 + Math.floor(rng() * 25); // 115–139 px per tier
    ty -= step;
    if (ty <= topY + 90) break;

    // 2 platforms most of the time, 3 platforms ~45% of the time
    const n = rng() < 0.45 ? 3 : 2;
    const segW = (800 - 2 * MARGIN) / n;

    for (let i = 0; i < n; i++) {
      const w    = 72  + Math.floor(rng() * 46);                          // 72–118 px wide
      const segX = MARGIN + i * segW;
      const x    = Math.floor(segX + rng() * Math.max(1, segW - w - 8)); // random within segment
      const y    = ty   + Math.floor((rng() - 0.5) * 16);                // ±8 px jitter
      raw.push({
        px: Math.max(MARGIN, Math.min(800 - w - MARGIN, x)),
        py: Math.max(topY + 90, y),
        w,
        spikeRight: rng() > 0.5,
      });
    }
  }

  // If the highest generated platform is more than 150px above the top
  // one-way platform, the player can't make the final jump. Insert a
  // bridging tier at topY+130 so it's always comfortably in range.
  const closestToTop = raw.length ? Math.min(...raw.map(r => r.py)) : floorY;
  if (closestToTop - topY > 150) {
    const bridgeY = topY + 130;
    raw.push({ px: 60,  py: bridgeY, w: 110, spikeRight: false });
    raw.push({ px: 620, py: bridgeY, w: 110, spikeRight: false });
  }

  raw.sort((a, b) => b.py - a.py); // bottom → top

  // Indices that become movers (evenly distributed through the list)
  const moverIdxs = new Set();
  if (moverCount > 0) {
    const step = Math.floor(raw.length / (moverCount + 1));
    for (let i = 1; i <= moverCount; i++) moverIdxs.add(i * step);
  }

  const plats = [], spikes = [], movers = [];
  let mn = 0;

  for (let i = 0; i < raw.length; i++) {
    const { px, py, w, spikeRight } = raw[i];
    if (moverIdxs.has(i)) {
      movers.push([px, py, w, H, moverColor, 'x', 55 + mn * 12, 88 + mn * 18, mn * 2.1]);
      mn++;
    } else {
      plats.push([px, py, w, H, platColor]);
      if (spikeEvery > 0 && i > 2 && (i % spikeEvery) === 0) {
        spikes.push([spikeRight ? px + w - 16 : px, py - 14, 1]);
      }
    }
  }

  return { plats, spikes, movers };
}

const L1 = genLevel(1337, 2760, 160, '#5a2510', null,     0, 0);
const L2 = genLevel(2674, 2760, 160, '#6a1a0a', null,     4, 0);
const L3 = genLevel(4011, 2760, 160, '#7a1008', null,     3, 0);
const L4 = genLevel(5348, 2760, 160, '#6a0a30', '#8a1a40', 4, 3);
const L5 = genLevel(6685, 2760, 160, '#5a0050', '#8a00a0', 3, 5);

const LEVELS = [
  // ── Level 1: Slow Burn ──────────────────────────────────────────────────
  {
    width: 800, height: 2800, bgColor: '#160500',
    lavaSpeed: 55,
    spawnX: 360, spawnY: 2710,
    platforms: [
      [0, 2760, 800, 40, '#3d1500'],
      ...L1.plats,
      [0, 160, 800, 40, '#3d1500', true],
    ],
    spikes: L1.spikes,
    movingPlatforms: [],
    door: [375, 110],
  },

  // ── Level 2: The Creep ──────────────────────────────────────────────────
  {
    width: 800, height: 2800, bgColor: '#100000',
    lavaSpeed: 80,
    spawnX: 360, spawnY: 2710,
    platforms: [
      [0, 2760, 800, 40, '#380a00'],
      ...L2.plats,
      [0, 160, 800, 40, '#380a00', true],
    ],
    spikes: L2.spikes,
    movingPlatforms: [],
    door: [375, 110],
  },

  // ── Level 3: The Rush ───────────────────────────────────────────────────
  {
    width: 800, height: 2800, bgColor: '#0a0000',
    lavaSpeed: 110,
    spawnX: 360, spawnY: 2710,
    platforms: [
      [0, 2760, 800, 40, '#300800'],
      ...L3.plats,
      [0, 160, 800, 40, '#300800', true],
    ],
    spikes: L3.spikes,
    movingPlatforms: [],
    door: [375, 110],
  },

  // ── Level 4: The Blaze ──────────────────────────────────────────────────
  {
    width: 800, height: 2800, bgColor: '#0e0010',
    lavaSpeed: 145,
    spawnX: 360, spawnY: 2710,
    platforms: [
      [0, 2760, 800, 40, '#280015'],
      ...L4.plats,
      [0, 160, 800, 40, '#280015', true],
    ],
    spikes: L4.spikes,
    movingPlatforms: L4.movers,
    door: [375, 110],
  },

  // ── Level 5: The Inferno ────────────────────────────────────────────────
  {
    width: 800, height: 2800, bgColor: '#05000d',
    lavaSpeed: 190,
    spawnX: 360, spawnY: 2710,
    platforms: [
      [0, 2760, 800, 40, '#1a0025'],
      ...L5.plats,
      [0, 160, 800, 40, '#1a0025', true],
    ],
    spikes: L5.spikes,
    movingPlatforms: L5.movers,
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
