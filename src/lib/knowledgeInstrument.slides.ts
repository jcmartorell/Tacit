/** Slides-only fork of the knowledge instrument — do not use on the live marketing site. */

export type Vec3 = { x: number; y: number; z: number };

type Particle = {
  sphere: Vec3;
  chaos: Vec3;
  chaosLen: number;
  cluster: Vec3;
  clusterId: number;
  isNode: boolean;
  degree: number;
  darkC: [number, number, number];
  lightC: [number, number, number];
  size: number;
  phase: number;
  twinkle: number;
  /** Final-state home on the quantized longitude grid. */
  grid: Vec3;
  lonAccent: boolean;
  /** Fig. 2.0 cap: -1 = stays on core, 0–9 = satellite. */
  cap: number;
};

type Edge = { a: number; b: number; sameCluster: boolean };

/**
 * Segment palettes — [ink, sand].
 * Ink: light/saturated on charcoal.
 * Sand: saturated mid-darks on cream — enough chroma to tell hues apart
 * at particle scale, still dark enough to sit on #f4efe6.
 */
const CLUSTER_COLORS: [[number, number, number], [number, number, number]][] = [
  // Amber
  [
    [255, 186, 72],
    [214, 118, 18],
  ],
  // Coral
  [
    [255, 110, 98],
    [212, 54, 48],
  ],
  // Blue
  [
    [72, 186, 255],
    [28, 102, 204],
  ],
  // Green
  [
    [140, 230, 90],
    [42, 148, 46],
  ],
  // Magenta
  [
    [230, 98, 210],
    [188, 36, 148],
  ],
  // Violet
  [
    [140, 130, 255],
    [96, 58, 214],
  ],
  // Teal — odd seventh so domains don't read as a hex
  [
    [46, 196, 158],
    [10, 148, 132],
  ],
];

const CLUSTER_COUNT = CLUSTER_COLORS.length;

/** Link color on Ink */
const EDGE_BASE: [number, number, number] = [210, 200, 185];
/** Link color on Sand — charcoal so pigment lines stay dark on cream */
const EDGE_BASE_SAND: [number, number, number] = [42, 48, 54];

/** Quantized shell — same density ratio as the longitude grid study. */
const LON_MERIDIANS = 96;
const LON_ACCENT_EVERY = 6;
const LAT_MIN = (-85 * Math.PI) / 180;
const LAT_MAX = (85 * Math.PI) / 180;

/**
 * Appearing callouts — Tacit KO types from lib/claude/prompts/system.ts
 * plus a few concrete search/product phrases from the app.
 */
/** Fig. 2.0 satellite names — Tacit KO types, not Akon capabilities. */
const CAP_LABELS = [
  "workflow",
  "heuristic",
  "escalation path",
  "exception handling",
  "decision logic",
  "tacit know-how",
  "coordination pattern",
  "troubleshooting",
  "SOP fragment",
  "day-one playbook",
];
const BADGE_MAX = 12;

const BADGE_LABELS = [
  "workflow",
  "heuristic",
  "escalation path",
  "exception handling",
  "decision logic",
  "tacit know-how",
  "coordination pattern",
  "troubleshooting",
  "SOP fragment",
  "deal context",
  "contact intel",
  "relationship",
  "client onboarding",
  "churn risk",
  "day-one playbook",
];

type ParticleBadge = {
  i: number;
  label: string;
  t0: number;
  dur: number;
  /** Frozen still: lock the pill to a slot so labels never pile on a node cluster. */
  slotX?: number;
  slotY?: number;
  /** Frozen still: pill hangs left of the pin when true. */
  hangLeft?: boolean;
};

/** Akon trail: one particle flies node A → node B, then highlights B. */
type ParticleTrail = {
  a: number;
  b: number;
  t0: number;
  dur: number;
  landed: boolean;
};

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

function clamp01(t: number) {
  return Math.max(0, Math.min(1, t));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/** Windowed ease: 0 outside [in0,in1]→[out0,out1], 1 in middle */
function pulseWindow(
  stage: number,
  in0: number,
  in1: number,
  out0: number,
  out1: number,
) {
  if (stage < in0 || stage > out1) return 0;
  if (stage < in1) return smoothstep((stage - in0) / (in1 - in0));
  if (stage > out0) return 1 - smoothstep((stage - out0) / (out1 - out0));
  return 1;
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function lerpVec(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

/** Spherical linear interpolation (Akon `g`) — trails travel on the globe. */
function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const dot = Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y + a.z * b.z));
  const omega = Math.acos(dot);
  if (omega < 1e-4) return { ...a };
  const sinO = Math.sin(omega);
  const w0 = Math.sin((1 - t) * omega) / sinO;
  const w1 = Math.sin(t * omega) / sinO;
  return {
    x: a.x * w0 + b.x * w1,
    y: a.y * w0 + b.y * w1,
    z: a.z * w0 + b.z * w1,
  };
}

function scaleVec(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

type AgentOrbit = { incline: number; node: number; radius: number };

/** Inclined great-circle at radius — the rail agents ride. */
function orbitPoint(o: AgentOrbit, theta: number): Vec3 {
  const x0 = Math.cos(theta) * o.radius;
  const z0 = Math.sin(theta) * o.radius;
  const ci = Math.cos(o.incline);
  const si = Math.sin(o.incline);
  const y1 = -z0 * si;
  const z1 = z0 * ci;
  const cn = Math.cos(o.node);
  const sn = Math.sin(o.node);
  return {
    x: x0 * cn + z1 * sn,
    y: y1,
    z: -x0 * sn + z1 * cn,
  };
}

function fibonacciPoint(i: number, n: number): Vec3 {
  const y = 1 - (i / Math.max(1, n - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = GOLDEN * i;
  return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
}

function randomUnit(): Vec3 {
  const y = 2 * Math.random() - 1;
  const t = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - y * y);
  return { x: Math.cos(t) * r, y, z: Math.sin(t) * r };
}

function pullToward(p: Vec3, center: Vec3, amount: number): Vec3 {
  return normalize({
    x: lerp(p.x, center.x, amount),
    y: lerp(p.y, center.y, amount),
    z: lerp(p.z, center.z, amount),
  });
}

export type InstrumentFrame = {
  stage: number;
};

export class KnowledgeInstrument {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  W = 1;
  H = 1;
  dpr = 1;
  pts: Particle[] = [];
  nodeIdx: number[] = [];
  edges: Edge[] = [];
  clusterCentroids: Vec3[] = [];
  rot = 0;
  cosY = 1;
  sinY = 0;
  cx = 0;
  cy = 0;
  R = 1;
  lastNow = 0;
  particleCount = 3500;
  /** When true, freezes ambient rotation (static paints / reduced motion). */
  reduceMotion = false;
  private badges: ParticleBadge[] = [];
  private nextBadgeSpawn = 600;
  private trails: ParticleTrail[] = [];
  private nextTrailSpawn = 400;
  private figW = 0;
  private figOff: { dx: number; dy: number }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  resize(width: number, height: number, dpr?: number) {
    this.W = Math.max(1, width);
    this.H = Math.max(1, height);
    this.dpr = Math.max(1, dpr ?? Math.min(window.devicePixelRatio || 1, 2));
    this.canvas.width = Math.floor(this.W * this.dpr);
    this.canvas.height = Math.floor(this.H * this.dpr);
    this.canvas.style.width = `${this.W}px`;
    this.canvas.style.height = `${this.H}px`;
  }

  rebuild(particleCount?: number) {
    if (particleCount) this.particleCount = particleCount;
    this.pts = [];
    this.nodeIdx = [];
    this.edges = [];
    this.badges = [];
    this.nextBadgeSpawn = 600;
    this.trails = [];
    this.nextTrailSpawn = 400;
    this.buildParticles();
    this.buildEdges();
  }

  /** One static paint — no ambient rotation. Used for section backdrops. */
  paintStatic(stage: number, rot = 1.05) {
    this.reduceMotion = true;
    this.rot = rot;
    this.cosY = Math.cos(rot);
    this.sinY = Math.sin(rot);
    this.lastNow = 0;
    this.frame(0, { stage });
  }

  /**
   * Frozen labeled still. Pins sit on the right hemisphere only so left
   * copy stays clear. Slots are spaced top-to-bottom so pills do not pile
   * in the upper-right.
   */
  paintLabeledStatic(stage: number, rot = 1.05, count = 11) {
    this.debug.showLabels = true;
    this.debug.labelDensity = 3;
    this.debug.labelField = "right";
    this.paintStatic(stage, rot);
    this.badges.length = 0;
    const now = 1600;
    this.lastNow = now;
    this.nextBadgeSpawn = now + 1e9;
    const want = Math.max(1, Math.min(BADGE_LABELS.length, Math.round(count)));
    this.placeBadgesInRightHemisphere(stage, want, now);
    for (const badge of this.badges) {
      badge.t0 = now - 700;
      badge.dur = 12000;
    }
    this.lastNow = 0;
    this.frame(now, { stage });
  }

  /** Deterministic 0–1 noise so stills stay reproducible. */
  private seededRand(seed: number) {
    let n = seed | 0;
    return () => {
      n = (n + 0x6d2b79f5) | 0;
      let t = Math.imul(n ^ (n >>> 15), 1 | n);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Scatter pills in the right field. Exploded (Problem) uses the whole
   * right rectangle so labels do not form a necklace on the cloud rim.
   */
  private placeBadgesInRightHemisphere(
    stage: number,
    count: number,
    now: number,
  ) {
    const ordered = stage >= 1.4;
    const rand = this.seededRand(ordered ? 20260821 : 20260823);
    const labels = BADGE_LABELS.slice(0, count);
    for (let i = labels.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = labels[i]!;
      labels[i] = labels[j]!;
      labels[j] = tmp;
    }

    const used = new Set<number>();
    const targets = ordered
      ? this.orderedHemisphereTargets(labels.length, rand)
      : this.explodedFieldTargets(labels.length, rand);

    const xCopy = this.W * 0.4;
    const xMax = this.W - 16;
    type Candidate = {
      i: number;
      label: string;
      metrics: ReturnType<KnowledgeInstrument["badgeMetrics"]>;
      tx: number;
      ty: number;
      canHangLeft: boolean;
      canHangRight: boolean;
    };
    const candidates: Candidate[] = [];
    for (let s = 0; s < labels.length; s++) {
      const label = labels[s]!;
      const metrics = this.badgeMetrics(label);
      const target = targets[s];
      if (!target) continue;
      const i = this.nearestPinInRightField(stage, target.x, target.y, used);
      if (i < 0) continue;
      const pin = this.projectBadge(i, stage);
      if (!pin) continue;
      used.add(i);
      candidates.push({
        i,
        label,
        metrics,
        tx: pin.px,
        ty: pin.py,
        canHangLeft: pin.px - metrics.stem - metrics.boxW >= xCopy,
        canHangRight: pin.px + metrics.stem + metrics.boxW <= xMax,
      });
    }

    // Rightmost pins hang left, leftmost hang right — mixed field, not a stack.
    const wantLeft = Math.ceil(candidates.length / 2);
    const byX = [...candidates].sort((a, b) => b.tx - a.tx);
    const hangLeftFor = new Set<number>();
    for (const c of byX) {
      if (hangLeftFor.size >= wantLeft) break;
      if (c.canHangLeft) hangLeftFor.add(c.i);
    }

    const placed: { x: number; y: number; w: number; h: number }[] = [];
    for (const c of candidates) {
      let hangLeft = hangLeftFor.has(c.i);
      if (hangLeft && !c.canHangLeft && c.canHangRight) hangLeft = false;
      if (!hangLeft && !c.canHangRight && c.canHangLeft) hangLeft = true;
      const boxFor = (left: boolean, y: number) => {
        const slotX = left
          ? c.tx - c.metrics.stem - c.metrics.boxW
          : c.tx + c.metrics.stem;
        return {
          x: slotX,
          y: y - c.metrics.boxH / 2,
          w: c.metrics.boxW,
          h: c.metrics.boxH,
          slotX,
        };
      };
      let ty = c.ty;
      let box = boxFor(hangLeft, ty);
      let attempts = 0;
      while (
        attempts++ < 10 &&
        (box.x < xCopy ||
          box.x + box.w > xMax ||
          placed.some((other) => this.boxesOverlap(box, other, 26)))
      ) {
        ty += (attempts % 2 === 0 ? 1 : -1) * c.metrics.boxH * 0.55;
        box = boxFor(hangLeft, ty);
      }
      if (box.x < xCopy || box.x + box.w > xMax) continue;
      if (placed.some((other) => this.boxesOverlap(box, other, 22))) continue;
      if (box.y < this.H * 0.08 || box.y + box.h > this.H * 0.92) continue;

      placed.push(box);
      this.badges.push({
        i: c.i,
        label: c.label,
        t0: now,
        dur: 12000,
        slotX: box.slotX,
        slotY: ty,
        hangLeft,
      });
    }
  }

  /** Jittered cells across the right half of a 16:9 exploded still. */
  private explodedFieldTargets(count: number, rand: () => number) {
    const x0 = this.W * 0.5;
    const x1 = this.W * 0.9;
    const y0 = this.H * 0.13;
    const y1 = this.H * 0.85;
    const cols = 3;
    const rows = 4;
    const cells: { c: number; r: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) cells.push({ c, r });
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = cells[i]!;
      cells[i] = cells[j]!;
      cells[j] = tmp;
    }
    const cellW = (x1 - x0) / cols;
    const cellH = (y1 - y0) / rows;
    return cells.slice(0, count).map(({ c, r }) => ({
      x: x0 + (c + 0.18 + rand() * 0.64) * cellW,
      y: y0 + (r + 0.2 + rand() * 0.6) * cellH,
      // Left column hangs right; right column hangs left; middle alternates.
      hangLeft: c === 2 ? true : c === 0 ? false : r % 2 === 0,
    }));
  }

  /** Right half-disk on an ordered globe (unused by slide 05 still). */
  private orderedHemisphereTargets(count: number, rand: () => number) {
    const fieldR = this.R;
    const out: { x: number; y: number; hangLeft: boolean }[] = [];
    for (let n = 0; n < count; n++) {
      const ang = (rand() - 0.5) * Math.PI * 0.9;
      const rad = fieldR * (0.22 + rand() * 0.72);
      const x = this.cx + Math.cos(ang) * rad;
      out.push({
        x,
        y: this.cy + Math.sin(ang) * rad,
        hangLeft: x > this.cx + fieldR * 0.45,
      });
    }
    return out;
  }

  private nearestPinInRightField(
    stage: number,
    tx: number,
    ty: number,
    used: Set<number>,
  ): number {
    let best = -1;
    let bestD = Infinity;
    const xFloor = this.W * 0.5;
    const xCeil = this.W * 0.92;
    const yFloor = this.H * 0.08;
    const yCeil = this.H * 0.92;

    for (let i = 0; i < this.pts.length; i++) {
      if (used.has(i)) continue;
      const p = this.pts[i]!;
      const pr = this.project(this.posAt(p, stage, this.lastNow / 1000), p.cap);
      if (pr.z2 < 0.08) continue;
      if (pr.px < xFloor || pr.px > xCeil || pr.py < yFloor || pr.py > yCeil) {
        continue;
      }
      const d = (pr.px - tx) ** 2 + (pr.py - ty) ** 2 * 2.4;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  private agentIcons = new Map<string, HTMLImageElement>();

  /** Preload chat / agent marks for the For AI backdrop. */
  preloadAgentIcons(srcs: Record<string, string>): Promise<void> {
    const jobs = Object.entries(srcs).map(
      ([key, src]) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            this.agentIcons.set(key, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = src;
        }),
    );
    return Promise.all(jobs).then(() => undefined);
  }

  /**
   * Unified sphere with domain colors (not exploded clusters) +
   * agents riding inclined orbits, extracting from the globe.
   * Pass `timeMs` for animation; omit for a still frame.
   */
  paintAgentsBackdrop(rot = 1.12, timeMs = 0) {
    const animated = !this.reduceMotion && timeMs > 0;
    const liveRot = animated ? rot + timeMs * 0.000032 : rot;
    this.paintColoredSphereStatic(liveRot);
    this.drawConsumingAgents(animated ? timeMs : 0);
  }

  /**
   * Bookend still (Cover + Horizon): enlarged right-weighted sphere
   * with a swarm of orbiting agent satellites. Icons only — four
   * labeled plugs collide at 25–30 sats.
   */
  paintCoverAgents(rot = 1.08) {
    this.reduceMotion = true;
    this.debug.satelliteCount = Math.max(this.debug.satelliteCount ?? 28, 28);
    this.paintColoredSphereStatic(rot, {
      radiusScale: 1.25,
      cxFrac: this.W / this.H > 1.2 ? 0.62 : 0.5,
      // ~30% brighter graph edges than the default 0.85 still
      edgeAlpha: 0.85 * 1.3,
    });
    this.drawConsumingAgents(0, { spokeBoost: 1.3, badgeScale: 1.33 });
  }

  /** Still of the colored unified sphere (no agent satellites). */
  paintUnifiedSphere(rot = 1.12) {
    this.paintColoredSphereStatic(rot);
  }

  /**
   * Grid beat: particles sorted onto bright longitude meridians.
   */
  paintMeridiansSphere(rot = 1.12) {
    this.paintStatic(5.8, rot);
  }

  /**
   * Bright graph edges on the ordered sphere — “connections” beat
   * (Akon network read). Good for linked / AI-ledger slides.
   */
  paintConnectionsSphere(rot = 1.12) {
    this.paintColoredSphereStatic(rot, { edgeAlpha: 1.15, brightEdges: true });
  }

  /**
   * Akon capture still: one comet on a lofted great-circle, mid-flight.
   * Pass timeMs for animation; 0 = seeded still.
   */
  paintMeteorsSphere(rot = 1.12, timeMs = 0) {
    this.paintColoredSphereStatic(rot, { edgeAlpha: 0.55 });
    this.updateTrails(timeMs, 0, 2.15);
  }

  /** Back-hemisphere node → a different front-facing node. */
  private pickTrailEnds(stage: number): { a: number; b: number } | null {
    if (this.nodeIdx.length < 2) return null;
    void stage;
    const back: number[] = [];
    const front: number[] = [];
    for (const i of this.nodeIdx) {
      const pr = this.project(this.pts[i]!.sphere);
      if (pr.z2 < -0.12) back.push(i);
      else if (pr.z2 > 0.12) front.push(i);
    }
    if (!front.length) return null;
    const dest = front[(Math.random() * front.length) | 0]!;
    const origins = back.length ? back : this.nodeIdx.filter((i) => i !== dest);
    if (!origins.length) return null;
    let best = origins[(Math.random() * origins.length) | 0]!;
    let bestSep = -2;
    // Prefer a start that's actually elsewhere on the globe
    for (let n = 0; n < Math.min(12, origins.length); n++) {
      const i = origins[(Math.random() * origins.length) | 0]!;
      if (i === dest) continue;
      const pa = this.pts[i]!.sphere;
      const pb = this.pts[dest]!.sphere;
      const sep = 1 - (pa.x * pb.x + pa.y * pb.y + pa.z * pb.z);
      if (sep > bestSep) {
        bestSep = sep;
        best = i;
      }
    }
    if (best === dest) return null;
    return { a: best, b: dest };
  }

  private meteorDensity() {
    return Math.max(1, Math.min(4, Math.round(this.debug.meteorDensity ?? 2)));
  }

  private spawnTrail(now: number, stage: number) {
    const d = this.meteorDensity();
    if (this.trails.length >= d) {
      this.nextTrailSpawn = now + 400 / d;
      return;
    }
    const ends = this.pickTrailEnds(stage);
    if (ends) {
      this.trails.push({
        a: ends.a,
        b: ends.b,
        t0: now,
        dur: 1600 + Math.random() * 900,
        landed: false,
      });
    }
    this.nextTrailSpawn = now + (1100 + Math.random() * 1300) / d;
  }

  private highlightNode(i: number, now: number) {
    if (!this.debug.showLabels) return;
    if (this.badges.some((b) => b.i === i)) return;
    if (this.badges.length >= this.badgeCap()) this.badges.shift();
    const taken = new Set(this.badges.map((b) => b.label));
    const pool = BADGE_LABELS.filter((l) => !taken.has(l));
    const label =
      pool[(Math.random() * pool.length) | 0] ??
      BADGE_LABELS[(Math.random() * BADGE_LABELS.length) | 0]!;
    this.badges.push({
      i,
      label,
      t0: now,
      dur: 3800 + Math.random() * 1800,
    });
  }

  /**
   * One particle rides a lofted great-circle from the back hemisphere
   * to a front node, then rings + labels the landing site.
   */
  private drawTrail(
    trail: ParticleTrail,
    now: number,
    theme: number,
    stage: number,
  ): boolean {
    const phase = (now - trail.t0) / trail.dur;
    if (phase > 1.4) return false;

    const pa = this.pts[trail.a];
    const pb = this.pts[trail.b];
    if (!pa || !pb) return false;

    void stage;
    const from = pa.sphere;
    const to = pb.sphere;
    const t = smoothstep(Math.min(1, phase));
    const ctx = this.ctx;
    const cr = lerp(210, 80, theme);
    const cg = lerp(235, 130, theme);
    const cb = lerp(255, 210, theme);

    if (phase < 1) {
      const trailLen = 0.22;
      const steps = 40;
      const tHead = t;
      const tTail = Math.max(0, tHead - trailLen);
      const span = tHead - tTail;
      const sample = (u: number) => {
        const loft = 1 + 0.14 * Math.sin(Math.PI * u);
        return this.project(scaleVec(slerp(from, to, u), loft));
      };

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (span > 1e-4) {
        let prev = sample(tTail);
        for (let s = 1; s <= steps; s++) {
          const along = s / steps;
          const u = tTail + span * along;
          const pr = sample(u);
          if (prev.z2 > -0.04 && pr.z2 > -0.04) {
            const depth = clamp01((pr.z2 + 0.04) / 0.35);
            const fade = along * along;
            ctx.strokeStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${(0.06 + 0.78 * fade) * (0.4 + 0.6 * depth)})`;
            ctx.lineWidth = 0.55 + 3.6 * fade;
            ctx.beginPath();
            ctx.moveTo(prev.px, prev.py);
            ctx.lineTo(pr.px, pr.py);
            ctx.stroke();
          }
          prev = pr;
        }
      }

      const head = sample(tHead);
      if (head.z2 > -0.04) {
        const depth = clamp01((head.z2 + 0.04) / 0.35);
        const size = Math.max(3, Math.round(4.2 * (0.7 + 0.3 * depth)));
        ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${0.95 * (0.55 + 0.45 * depth)})`;
        ctx.fillRect(
          Math.round(head.px - size / 2),
          Math.round(head.py - size / 2),
          size,
          size,
        );
      }
    }

    if (phase >= 1) {
      if (!trail.landed) {
        trail.landed = true;
        this.highlightNode(trail.b, now);
      }
      const e = (phase - 1) / 0.4;
      if (e <= 1) {
        const land = this.project(to);
        if (land.z2 > -0.02) {
          ctx.strokeStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${0.7 * (1 - e)})`;
          ctx.lineWidth = 1.35;
          ctx.beginPath();
          ctx.arc(land.px, land.py, 4 + 16 * e, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${0.85 * (1 - e)})`;
          ctx.beginPath();
          ctx.arc(land.px, land.py, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    return true;
  }

  private updateTrails(now: number, theme: number, stage: number) {
    if (now <= 0 && this.trails.length === 0) {
      const ends = this.pickTrailEnds(stage);
      if (ends) {
        this.trails.push({
          a: ends.a,
          b: ends.b,
          t0: -1100,
          dur: 2000,
          landed: false,
        });
      }
    }
    for (let t = this.trails.length - 1; t >= 0; t--) {
      if (!this.drawTrail(this.trails[t]!, now, theme, stage)) {
        this.trails.splice(t, 1);
      }
    }
    if (now > this.nextTrailSpawn) this.spawnTrail(now, stage);
  }

  /** Sphere layout + cluster colors + links — mapped knowledge, together. */
  private paintColoredSphereStatic(
    rot: number,
    opts: {
      edgeAlpha?: number;
      brightEdges?: boolean;
      radiusScale?: number;
      cxFrac?: number;
    } = {},
  ) {
    this.rot = rot;
    this.cosY = Math.cos(rot);
    this.sinY = Math.sin(rot);
    this.lastNow = 0;
    // Stage ~2.15: ordered sphere framing, edges on, before segments pull apart
    const stage = 2.15;
    this._stage = stage;
    this.layoutAt(stage);
    if (opts.radiusScale) this.R *= opts.radiusScale;
    if (opts.cxFrac != null) this.cx = opts.cxFrac * this.W;

    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    if (this.debug.surface === "sand") {
      ctx.fillStyle = "#F4EFE6";
      ctx.fillRect(0, 0, this.W, this.H);
    }

    const edgeA = opts.edgeAlpha ?? 0.85;
    const brightEdges = opts.brightEdges ?? false;
    const clusterW = 1;

    // Edges between nodes (sphere positions)
    for (const edge of this.edges) {
      const pa = this.pts[edge.a];
      const pb = this.pts[edge.b];
      const a = this.project(pa.sphere);
      const b = this.project(pb.sphere);
      const depth = ((a.z2 + b.z2) / 2 + 1) / 2;
      let r = EDGE_BASE[0];
      let g = EDGE_BASE[1];
      let bl = EDGE_BASE[2];
      if (this.debug.greySand) {
        const grey = this.sandGrey(depth);
        r = grey[0];
        g = grey[1];
        bl = grey[2];
      } else if (edge.sameCluster) {
        const c = CLUSTER_COLORS[pa.clusterId][0];
        r = lerp(r, c[0], brightEdges ? 0.85 : 0.55);
        g = lerp(g, c[1], brightEdges ? 0.85 : 0.55);
        bl = lerp(bl, c[2], brightEdges ? 0.85 : 0.55);
      }
      const alpha = Math.min(
        1,
        edgeA * (brightEdges ? 0.35 + 0.65 * depth : 0.18 + 0.45 * depth),
      );
      ctx.strokeStyle = `rgba(${r | 0},${g | 0},${bl | 0},${alpha})`;
      ctx.lineWidth = (edge.sameCluster ? 1.35 : 0.95) * (brightEdges ? 1.35 : 1);
      ctx.beginPath();
      ctx.moveTo(a.px, a.py);
      ctx.lineTo(b.px, b.py);
      ctx.stroke();
    }

    for (const p of this.pts) {
      const pr = this.project(p.sphere);
      if (
        pr.px < -8 ||
        pr.px > this.W + 8 ||
        pr.py < -8 ||
        pr.py > this.H + 8
      ) {
        continue;
      }
      const depth = (pr.z2 + 1) / 2;
      let cr: number;
      let cg: number;
      let cb: number;
      if (this.debug.greySand) {
        const grey = this.sandGrey(depth);
        cr = grey[0];
        cg = grey[1];
        cb = grey[2];
      } else {
        const pal = CLUSTER_COLORS[p.clusterId];
        // Prefer the brighter “light” stop so particles pop on Ink
        const target = pal[1];
        cr = lerp(p.darkC[0], target[0], clusterW * (p.isNode ? 1 : 0.78));
        cg = lerp(p.darkC[1], target[1], clusterW * (p.isNode ? 1 : 0.78));
        cb = lerp(p.darkC[2], target[2], clusterW * (p.isNode ? 1 : 0.78));
        if (p.isNode) {
          cr = lerp(cr, 255, 0.18);
          cg = lerp(cg, 245, 0.18);
          cb = lerp(cb, 230, 0.18);
        }
      }
      const size = 1.45 * p.size * (0.65 + 0.7 * depth);
      ctx.fillStyle = `rgb(${cr | 0},${cg | 0},${cb | 0})`;
      ctx.fillRect(pr.px - size / 2, pr.py - size / 2, size, size);
    }
  }
  /** Cover / hero: four named plugs — Team + the three agent kinds. */
  drawLabeledSatellites() {
    const ctx = this.ctx;
    const ui = Math.max(1, this.W / 1080);
    const badgeR = Math.min(26, Math.min(this.W, this.H) * 0.029) * ui;
    const kinds: {
      label: string;
      icon: string;
      palette: [number, number, number];
      angle: number;
      dist: number;
    }[] = [
      {
        label: "Team",
        icon: "team",
        palette: [244, 239, 230],
        angle: -0.72,
        dist: 1.42,
      },
      {
        label: "Claude",
        icon: "claude",
        palette: [217, 119, 87],
        angle: -0.22,
        dist: 1.52,
      },
      {
        label: "ChatGPT",
        icon: "chatgpt",
        palette: [16, 163, 127],
        angle: 0.28,
        dist: 1.5,
      },
      {
        label: "Your agents",
        icon: "agents",
        palette: [26, 158, 120],
        angle: 0.78,
        dist: 1.44,
      },
    ];

    for (const kind of kinds) {
      const satX = this.cx + Math.cos(kind.angle) * this.R * kind.dist;
      const satY = this.cy + Math.sin(kind.angle) * this.R * kind.dist;
      if (satX < 28 || satX > this.W - 20 || satY < 28 || satY > this.H - 36) {
        continue;
      }

      const dx = satX - this.cx;
      const dy = satY - this.cy;
      const len = Math.hypot(dx, dy) || 1;
      const hubX = this.cx + (dx / len) * this.R * 0.92;
      const hubY = this.cy + (dy / len) * this.R * 0.92;
      const cpx = (hubX + satX) * 0.5 + (-dy / len) * this.R * 0.12;
      const cpy = (hubY + satY) * 0.5 + (dx / len) * this.R * 0.12;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(hubX, hubY);
      ctx.quadraticCurveTo(cpx, cpy, satX, satY);
      ctx.strokeStyle = "rgba(26, 158, 120, 0.45)";
      ctx.lineWidth = 1.35 * ui;
      ctx.setLineDash([3.5 * ui, 5 * ui]);
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      const [r, g, b] = kind.palette;
      for (let p = 0; p < 4; p++) {
        const t = 0.22 + p * 0.2;
        const mt = 1 - t;
        const x = mt * mt * hubX + 2 * mt * t * cpx + t * t * satX;
        const y = mt * mt * hubY + 2 * mt * t * cpy + t * t * satY;
        const s = (2.1 + t * 1.4) * ui;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }

      ctx.beginPath();
      ctx.arc(satX, satY, badgeR + 6 * ui, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(24, 35, 46, 0.78)";
      ctx.fill();
      ctx.strokeStyle = "rgba(244, 239, 230, 0.22)";
      ctx.lineWidth = ui;
      ctx.stroke();

      const img = this.agentIcons.get(kind.icon);
      if (img) {
        const s = badgeR * 1.65;
        ctx.drawImage(img, satX - s / 2, satY - s / 2, s, s);
      } else {
        ctx.beginPath();
        ctx.arc(satX, satY, badgeR * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fill();
      }

      ctx.font = `500 ${11 * ui}px "Geist Mono", ui-monospace, monospace`;
      ctx.fillStyle = "rgba(244, 239, 230, 0.88)";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(kind.label.toUpperCase(), satX, satY + badgeR + 10 * ui);
    }
  }

  private satCount() {
    return Math.max(4, Math.min(30, Math.round(this.debug.satelliteCount ?? 28)));
  }

  private surfaceTheme() {
    return this.debug.surface === "sand" ? 1 : 0;
  }

  private drawConsumingAgents(
    timeMs = 0,
    opts: { spokeBoost?: number; badgeScale?: number } = {},
  ) {
    const ctx = this.ctx;
    const theme = this.surfaceTheme();
    const ink = theme < 0.5;
    const spokeBoost = opts.spokeBoost ?? 1;
    const badgeScale = opts.badgeScale ?? 1;

    // Brand hues — same as the preloaded Hugeicons, not cluster paint.
    const kinds: {
      icon: string;
      palette: [number, number, number];
    }[] = [
      { icon: "people", palette: [244, 239, 230] },
      { icon: "claude", palette: [217, 119, 87] },
      { icon: "chatgpt", palette: [16, 163, 127] },
      { icon: "agents", palette: [26, 158, 120] },
    ];

    // Pull sats 50% closer to the shell: 1 + (oldR - 1) * 0.5
    const orbits: AgentOrbit[] = [
      { incline: 0.22, node: 0.35, radius: 1 + (1.3 - 1) * 0.5 },
      { incline: 0.78, node: 1.25, radius: 1 + (1.38 - 1) * 0.5 },
      { incline: 1.18, node: 2.4, radius: 1 + (1.46 - 1) * 0.5 },
      { incline: 0.48, node: 3.3, radius: 1 + (1.58 - 1) * 0.5 },
      { incline: 1.42, node: 4.15, radius: 1 + (1.34 - 1) * 0.5 },
      { incline: 0.95, node: 5.2, radius: 1 + (1.5 - 1) * 0.5 },
    ];

    const n = this.satCount();
    const badgeR = Math.min(13.2, Math.min(this.W, this.H) * 0.0144) * badgeScale;
    const staticMode = timeMs <= 0;
    const tSec = staticMode ? 0 : timeMs * 0.001;
    const speed = 0.14;

    const agents: {
      i: number;
      orbit: AgentOrbit;
      theta: number;
      pos: Vec3;
      hub: Vec3;
      pr: { px: number; py: number; z2: number };
      hubPr: { px: number; py: number; z2: number };
      kind: (typeof kinds)[number];
    }[] = [];

    const perOrbit = Array.from({ length: orbits.length }, () => 0);
    for (let i = 0; i < n; i++) perOrbit[i % orbits.length]! += 1;
    const seen = Array.from({ length: orbits.length }, () => 0);

    for (let i = 0; i < n; i++) {
      const oi = i % orbits.length;
      const orbit = orbits[oi]!;
      const slot = seen[oi]!;
      seen[oi] = slot + 1;
      const spread = (slot / Math.max(1, perOrbit[oi]!)) * Math.PI * 2;
      const theta = staticMode ? spread + 0.4 : spread + tSec * speed;
      const pos = orbitPoint(orbit, theta);
      const hub = normalize(pos);
      agents.push({
        i,
        orbit,
        theta,
        pos,
        hub,
        pr: this.project(pos),
        hubPr: this.project(hub),
        kind: kinds[i % kinds.length]!,
      });
    }

    agents.sort((a, b) => a.pr.z2 - b.pr.z2);

    for (const sat of agents) {
      const { pr, hubPr, kind, pos, hub } = sat;
      if (pr.px < -24 || pr.px > this.W + 24 || pr.py < -24 || pr.py > this.H + 24) {
        continue;
      }

      const behind = pr.z2 < 0;
      const depth = clamp01((pr.z2 + 1) / 2);
      // Bookend stills keep back-hemisphere riders readable so 28 sats count.
      const presence = behind
        ? (spokeBoost > 1 ? 0.52 + 0.3 * depth : 0.32 + 0.28 * depth)
        : 0.78 + 0.22 * depth;
      const size = badgeR * (behind ? 0.7 : 1) * (0.78 + 0.32 * depth);
      const [cr, cg, cb] = kind.palette;

      // Extract spoke: knowledge leaves the shell toward the rider.
      ctx.save();
      ctx.globalAlpha = Math.min(1, presence * (behind ? 0.28 : 0.55) * spokeBoost);
      ctx.beginPath();
      ctx.moveTo(hubPr.px, hubPr.py);
      ctx.lineTo(pr.px, pr.py);
      ctx.strokeStyle = ink
        ? `rgba(${cr},${cg},${cb},${Math.min(1, (behind ? 0.35 : 0.55) * spokeBoost)})`
        : `rgba(${cr},${cg},${cb},${Math.min(1, (behind ? 0.4 : 0.62) * spokeBoost)})`;
      ctx.lineWidth = (behind ? 0.7 : 1.05) * (spokeBoost > 1 ? 1.08 : 1);
      ctx.stroke();
      ctx.restore();

      // Outbound motes — the extract.
      const motes = 5;
      for (let m = 0; m < motes; m++) {
        const cycle = staticMode
          ? (0.18 + m * 0.16) % 1
          : (tSec * 0.7 + m * 0.19 + sat.i * 0.07) % 1;
        const ease = cycle * cycle;
        const mote = lerpVec(hub, pos, ease);
        const mp = this.project(mote);
        if (mp.z2 < -0.15) continue;
        const s = 1.2 + 2.1 * cycle;
        ctx.globalAlpha = (behind ? 0.35 : 0.85) * (0.35 + 0.65 * cycle);
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.fillRect(mp.px - s / 2, mp.py - s / 2, s, s);
      }
      ctx.globalAlpha = 1;

      // Contact on the Company Brain
      ctx.beginPath();
      ctx.arc(hubPr.px, hubPr.py, 2.1 + 0.8 * depth, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${behind ? 0.35 : 0.8})`;
      ctx.fill();

      ctx.save();
      ctx.globalAlpha = presence;
      ctx.beginPath();
      ctx.arc(pr.px, pr.py, size + 3.5, 0, Math.PI * 2);
      if (ink) {
        ctx.fillStyle = behind
          ? "rgba(24, 35, 46, 0.45)"
          : "rgba(24, 35, 46, 0.86)";
      } else {
        ctx.fillStyle = behind
          ? "rgba(244, 239, 230, 0.72)"
          : "rgba(244, 239, 230, 0.96)";
      }
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${behind ? 0.4 : 0.88})`;
      ctx.fill();
      ctx.lineWidth = 1.15;
      ctx.stroke();

      const img = this.agentIcons.get(kind.icon);
      if (img) {
        const s = size * 1.45;
        ctx.drawImage(img, pr.px - s / 2, pr.py - s / 2, s, s);
      } else {
        ctx.beginPath();
        ctx.arc(pr.px, pr.py, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private buildParticles() {
    const centroids: Vec3[] = [];
    for (let t = 0; t < CLUSTER_COUNT; t++) {
      centroids.push(fibonacciPoint(t, CLUSTER_COUNT));
    }
    this.clusterCentroids = centroids;

    const n = this.particleCount;
    for (let t = 0; t < n; t++) {
      let p = fibonacciPoint(t, n);
      p = {
        x: p.x + (Math.random() - 0.5) * 0.035,
        y: p.y + (Math.random() - 0.5) * 0.035,
        z: p.z + (Math.random() - 0.5) * 0.035,
      };
      const sphere = normalize(p);

      let clusterId = 0;
      let best = -2;
      centroids.forEach((c, idx) => {
        const d = sphere.x * c.x + sphere.y * c.y + sphere.z * c.z;
        if (d > best) {
          best = d;
          clusterId = idx;
        }
      });

      const accent = Math.random() < 0.18;
      // Paint color is random — spatial clusters only matter once domains/linked pull apart.
      const palette = CLUSTER_COLORS[(Math.random() * CLUSTER_COUNT) | 0]!;
      const grayD = 165 + 90 * Math.random();
      // Sand: every particle keeps a hue. Non-accents sit a step toward
      // warm charcoal so the sphere has depth without collapsing to gray.
      const mute = 0.22 + 0.12 * Math.random();
      const sandMuted: [number, number, number] = [
        lerp(palette[1][0], 48, mute),
        lerp(palette[1][1], 44, mute),
        lerp(palette[1][2], 40, mute),
      ];

      const size = (accent ? 1 : 0.65) + 1.35 * Math.random();
      this.pts.push({
        sphere,
        chaos: randomUnit(),
        chaosLen: 0.75 + 1.25 * Math.random(),
        cluster: pullToward(sphere, centroids[clusterId], 0.54),
        clusterId,
        isNode: false,
        degree: 0,
        darkC: accent
          ? palette[0]
          : [grayD, grayD + 8, Math.min(255, grayD + 20)],
        lightC: accent ? palette[1] : sandMuted,
        size,
        phase: Math.random() * Math.PI * 2,
        twinkle: 1.2 + 2.2 * Math.random(),
        grid: sphere,
        lonAccent: false,
        cap: -1,
      });
    }

    this.assignLongitudeHomes();
    this.assignCaps();

    this.pts.forEach((e, t) => {
      if (e.size > 1.35) {
        e.isNode = true;
        this.nodeIdx.push(t);
      }
    });
  }

  /** Map each existing particle to the nearest unused lat/long slot. */
  private assignLongitudeHomes() {
    const n = this.pts.length;
    if (!n) return;
    const lats = Math.max(12, Math.ceil(n / LON_MERIDIANS));
    const latStep = (LAT_MAX - LAT_MIN) / (lats - 1);
    const lonStep = (Math.PI * 2) / LON_MERIDIANS;
    const slots: { pos: Vec3; accent: boolean }[] = [];
    for (let m = 0; m < LON_MERIDIANS; m++) {
      const lon0 = m * lonStep;
      const accent = m % LON_ACCENT_EVERY === 0;
      for (let i = 0; i < lats; i++) {
        const lat0 = LAT_MIN + i * latStep;
        const lat = lat0 + (Math.random() * 2 - 1) * 0.35 * latStep;
        const lon = lon0 + (Math.random() * 2 - 1) * 0.15 * lonStep;
        const radJ = 1 + (Math.random() * 2 - 1) * 0.02;
        const clat = Math.cos(lat);
        slots.push({
          pos: normalize({
            x: radJ * clat * Math.cos(lon),
            y: radJ * Math.sin(lat),
            z: radJ * clat * Math.sin(lon),
          }),
          accent,
        });
      }
    }

    const used = new Uint8Array(slots.length);
    const order = this.pts.map((_, i) => i);
    order.sort(
      (a, b) =>
        Math.atan2(this.pts[a]!.sphere.z, this.pts[a]!.sphere.x) -
        Math.atan2(this.pts[b]!.sphere.z, this.pts[b]!.sphere.x),
    );

    for (const pi of order) {
      const p = this.pts[pi]!;
      let best = -1;
      let bestD = -2;
      for (let s = 0; s < slots.length; s++) {
        if (used[s]) continue;
        const q = slots[s]!.pos;
        const d = p.sphere.x * q.x + p.sphere.y * q.y + p.sphere.z * q.z;
        if (d > bestD) {
          bestD = d;
          best = s;
        }
      }
      if (best < 0) continue;
      used[best] = 1;
      p.grid = slots[best]!.pos;
      p.lonAccent = slots[best]!.accent;
    }
  }

  /** Nearest of 10 fibonacci poles; every 3rd particle stays on the core. */
  private assignCaps() {
    const poles: Vec3[] = [];
    const n = CAP_LABELS.length;
    for (let t = 0; t < n; t++) {
      const s = 1 - (t / Math.max(1, n - 1)) * 2;
      const i = Math.sqrt(Math.max(0, 1 - s * s));
      const a = t * GOLDEN * 5.1;
      poles.push({ x: Math.cos(a) * i, y: s, z: Math.sin(a) * i });
    }
    this.pts.forEach((p, i) => {
      if (i % 3 === 0) {
        p.cap = -1;
        return;
      }
      let best = 0;
      let bestD = -2;
      poles.forEach((pole, idx) => {
        const d = p.sphere.x * pole.x + p.sphere.y * pole.y + p.sphere.z * pole.z;
        if (d > bestD) {
          bestD = d;
          best = idx;
        }
      });
      p.cap = best;
    });
  }

  private buildEdges() {
    const seen = new Set<string>();
    for (const t of this.nodeIdx) {
      const s = this.pts[t].sphere;
      const candidates: { j: number; d: number }[] = [];
      for (const j of this.nodeIdx) {
        if (j === t) continue;
        const a = this.pts[j].sphere;
        candidates.push({
          j,
          d: s.x * a.x + s.y * a.y + s.z * a.z,
        });
      }
      candidates.sort((a, b) => b.d - a.d);
      for (let s = 0; s < 2 && s < candidates.length; s++) {
        const a = candidates[s].j;
        const key = t < a ? `${t}-${a}` : `${a}-${t}`;
        if (seen.has(key)) continue;
        seen.add(key);
        this.edges.push({
          a: t,
          b: a,
          sameCluster: this.pts[t].clusterId === this.pts[a].clusterId,
        });
        this.pts[t].degree++;
        this.pts[a].degree++;
      }
    }
  }

  private layoutAt(stage: number) {
    // Debugger is full-bleed: sit the globe at 65% so the left panel has air.
    // Square export stills stay centered. Cover/problem stills can pin cx.
    this.cx =
      this.debug.cxFrac != null
        ? this.debug.cxFrac * this.W
        : this.W / this.H > 1.2
          ? 0.65 * this.W
          : 0.5 * this.W;
    this.cy = 0.5 * this.H;
    // Cloud is a bit larger; once ordered, hold radius so the globe doesn't walk.
    const RR = [0.42, 0.4, 0.33, 0.33, 0.33, 0.33, 0.33];
    const i = Math.min(5, Math.floor(stage));
    const t = smoothstep(Math.min(1, (stage - i) / 0.6));
    const mobile = this.W < 768;
    this.R =
      lerp(RR[i], RR[i + 1], t) * Math.min(this.W, this.H) * (mobile ? 0.88 : 1);
    // longitudes2: smaller shell so optical gaps stay dense instead of washing out.
    const close = clamp01(smoothstep((stage - 7.05) / 0.45));
    this.R *= lerp(1, 0.72, close);
    const scale = this.debug.radiusScale;
    if (scale && scale !== 1) this.R *= scale;
  }

  private keyPos(p: Particle, key: number, time: number): Vec3 {
    switch (key) {
      case 0:
      case 1: {
        // Exploded cloud — default first figure (held through stage 1)
        const pulse = 1 + 0.08 * Math.sin(0.55 * time + p.phase);
        const len = p.chaosLen * pulse * 1.15;
        return {
          x: p.chaos.x * len,
          y: p.chaos.y * len,
          z: p.chaos.z * len,
        };
      }
      case 3:
      case 4:
        // Clusters / segments
        return p.cluster;
      default:
        // Ordered sphere (stages 2 and 5+)
        return p.sphere;
    }
  }

  private posAt(p: Particle, stage: number, time: number): Vec3 {
    const cloud = this.keyPos(p, 1, time);
    const sphere = p.sphere;
    const cluster = p.cluster;

    // Exploded → ordered: gather into a closed shell and stay there.
    // Ordered (1.90) must not start the domain split — that was the gap.
    if (stage < 2.55) {
      const a = smoothstep((stage - 1.05) / 0.7);
      return lerpVec(cloud, sphere, clamp01(a));
    }
    // Ordered → domains: only now pull into segments.
    if (stage < 3.05) {
      const a = smoothstep((stage - 2.55) / 0.5);
      return lerpVec(sphere, cluster, clamp01(a));
    }
    // Domains + linked: hold clusters.
    if (stage < 4.35) return cluster;
    // Day zero: clusters return to the Fibonacci sphere.
    if (stage < 5.15) {
      return lerpVec(cluster, sphere, clamp01(smoothstep((stage - 4.35) / 0.5)));
    }
    // Longitudes: snap onto the lat/long grid and hold.
    if (stage < 6.05) {
      return lerpVec(sphere, p.grid, clamp01(smoothstep((stage - 5.15) / 0.5)));
    }
    // exploded_segments + longitudes2: back to Fibonacci (caps / banding handle the read).
    return lerpVec(
      p.grid,
      sphere,
      clamp01(smoothstep((stage - 6.05) / 0.45)),
    );
  }

  private project(e: Vec3, cap = -2): { px: number; py: number; z2: number } {
    const n = e.x * this.cosY + e.z * this.sinY;
    const o = -e.x * this.sinY + e.z * this.cosY;
    // Fixed tilt ~10°
    const tiltC = 0.9838436927881214;
    const tiltS = -0.17902957342582418;
    const z2 = tiltS * e.y + tiltC * o;
    const d = 1 / (1 - z2 / 3.6);
    let scale = 1;
    let ox = 0;
    let oy = 0;
    if (this.figW > 0.01 && cap >= -1) {
      const n = Math.min(this.satCount(), CAP_LABELS.length);
      if (cap === -1 || cap >= n) {
        scale *= lerp(1, 0.42, this.figW);
      } else {
        scale *= lerp(1, 0.24, this.figW);
        const off = this.figOff[cap];
        if (off) {
          ox += off.dx * this.figW;
          oy += off.dy * this.figW;
        }
      }
    }
    return {
      px: this.cx + ox + n * this.R * scale * d,
      py: this.cy + oy + (tiltC * e.y - tiltS * o) * this.R * scale * d,
      z2,
    };
  }

  /** Akon Fig. 2.0: orbit ring + named satellites. */
  private drawCapFigure(figW: number, time: number, theme: number) {
    if (figW < 0.05) return;
    const ctx = this.ctx;
    const { cx, cy, R, W, H } = this;
    const compact = W < 900;
    const n = Math.min(this.satCount(), CAP_LABELS.length, this.figOff.length);
    if (n < 1) return;
    const inner = 0.42 * R;
    const sat = 0.22 * R;
    const active = figW > 0.9 ? Math.floor(time / 2.4) % n : -1;

    ctx.font = `${compact ? 10 : 11}px "Geist Mono", ui-monospace, Consolas, monospace`;
    ctx.textBaseline = "middle";
    ctx.lineCap = "round";

    for (let i = 0; i < n; i++) {
      const off = this.figOff[i];
      if (!off) continue;
      const fade = clamp01(1.5 * figW - 0.04 * i);
      if (fade <= 0.01) continue;
      const gx = cx + off.dx;
      const gy = cy + off.dy;
      const len = Math.hypot(off.dx, off.dy) || 1;
      const kx = off.dx / len;
      const ky = off.dy / len;
      const x0 = cx + kx * inner * 1.08;
      const y0 = cy + ky * inner * 1.08;
      const x1 = gx - kx * sat * 1.05;
      const y1 = gy - ky * sat * 1.05;
      const hot = i === active;
      const pal = CLUSTER_COLORS[i % CLUSTER_COLORS.length][theme > 0.5 ? 1 : 0];
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = hot
        ? `rgba(${pal[0]},${pal[1]},${pal[2]},${0.75 * figW})`
        : theme > 0.5
          ? `rgba(24,35,46,${0.2 * fade * figW})`
          : `rgba(244,239,230,${0.16 * fade * figW})`;
      ctx.lineWidth = hot ? 1.2 : 0.85;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);

      if (hot) {
        const u = (0.7 * time + 0.13 * i) % 1;
        ctx.fillStyle = `rgba(${pal[0]},${pal[1]},${pal[2]},${0.95 * figW})`;
        ctx.beginPath();
        ctx.arc(lerp(x0, x1, u), lerp(y0, y1, u), 2, 0, Math.PI * 2);
        ctx.fill();
      }

      const label = CAP_LABELS[i]!;
      const tw = ctx.measureText(label).width;
      const padX = 8;
      const boxW = tw + padX * 2;
      const boxH = 20;
      const lx = gx + kx * (sat + (compact ? 10 : 16));
      const ly = gy + ky * (sat + (compact ? 10 : 16));
      let boxX = kx < -0.2 ? lx - boxW : kx > 0.2 ? lx : lx - boxW / 2;
      let boxY = ly - boxH / 2;
      boxX = Math.min(Math.max(boxX, 10), W - boxW - 10);
      boxY = Math.min(Math.max(boxY, 10), H - boxH - 10);

      ctx.globalAlpha = fade * figW;
      ctx.fillStyle = theme > 0.5
        ? "rgba(244,239,230,0.94)"
        : "rgba(24,35,46,0.88)";
      ctx.strokeStyle = hot
        ? `rgba(${pal[0]},${pal[1]},${pal[2]},0.85)`
        : theme > 0.5
          ? "rgba(24,35,46,0.16)"
          : "rgba(244,239,230,0.16)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(boxX, boxY, boxW, boxH, 6);
      } else {
        ctx.rect(boxX, boxY, boxW, boxH);
      }
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = hot
        ? `rgb(${pal[0]},${pal[1]},${pal[2]})`
        : theme > 0.5
          ? "rgba(24,35,46,0.88)"
          : "rgba(244,239,230,0.9)";
      ctx.textAlign = "left";
      ctx.fillText(label, boxX + padX, boxY + boxH / 2 + 0.5);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = "left";
  }

  private drawEdges(
    strength: number,
    theme: number,
    clusterW: number,
    time: number,
  ) {
    const ctx = this.ctx;
    for (const edge of this.edges) {
      const pa = this.pts[edge.a];
      const pb = this.pts[edge.b];
      if (strength < 0.02) continue;

      if (this.figW > 0.01 && pa.cap !== pb.cap) continue;
      const a = this.project(this.posAt(pa, this._stage, time), pa.cap);
      const b = this.project(this.posAt(pb, this._stage, time), pb.cap);
      const depth = ((a.z2 + b.z2) / 2 + 1) / 2;

      if (this.debug.greySand) {
        const grey = this.sandGrey(depth);
        const alpha = Math.min(1, (0.4 + 0.35 * depth) * strength);
        ctx.strokeStyle = `rgba(${grey[0] | 0},${grey[1] | 0},${grey[2] | 0},${alpha})`;
        ctx.lineWidth = 1.1 * (0.5 + 0.45 * depth) * strength;
      } else if (edge.sameCluster && clusterW > 0.01) {
        // Intra-segment links — colored (the “linked” read)
        const c = CLUSTER_COLORS[pa.clusterId][theme > 0.5 ? 1 : 0];
        const base = theme > 0.5 ? EDGE_BASE_SAND : EDGE_BASE;
        const mix = theme > 0.5 ? Math.min(1, clusterW * 1.15) : clusterW;
        const r = lerp(base[0], c[0], mix);
        const g = lerp(base[1], c[1], mix);
        const bl = lerp(base[2], c[2], mix);
        const alpha = Math.min(1, (0.55 + 0.45 * depth) * strength);
        ctx.strokeStyle = `rgba(${r | 0},${g | 0},${bl | 0},${alpha})`;
        ctx.lineWidth = 1.25 * (0.5 + 0.55 * depth) * strength;
      } else {
        // Cross-segment connections — quieter; darken on Sand so they stay visible
        const fade = clusterW > 0.01 ? 0.28 : 0.42;
        const inkEdge: [number, number, number] = [210, 200, 185];
        const sandEdge: [number, number, number] = [90, 100, 110];
        const base = [
          lerp(inkEdge[0], sandEdge[0], theme),
          lerp(inkEdge[1], sandEdge[1], theme),
          lerp(inkEdge[2], sandEdge[2], theme),
        ];
        const alpha = Math.min(
          1,
          fade * (0.35 + 0.4 * depth) * strength * (theme > 0.5 ? 1.15 : 1),
        );
        ctx.strokeStyle = `rgba(${base[0] | 0},${base[1] | 0},${base[2] | 0},${alpha})`;
        ctx.lineWidth = 0.7 * (0.4 + 0.5 * depth) * strength;
      }

      ctx.beginPath();
      ctx.moveTo(a.px, a.py);
      ctx.lineTo(b.px, b.py);
      ctx.stroke();
    }
  }

  private badgeUi() {
    return Math.max(1, this.W / 1080);
  }

  private longestBadgeLabel() {
    return BADGE_LABELS.reduce((a, b) => (a.length >= b.length ? a : b));
  }

  private badgeMetrics(label: string) {
    const ui = this.badgeUi();
    this.ctx.font = `${11 * ui}px "Geist Mono", ui-monospace, Consolas, monospace`;
    const padX = 9 * ui;
    const dot = 2.4 * ui;
    const gap = 6 * ui;
    const textW = this.ctx.measureText(label).width;
    return {
      ui,
      boxW: padX + dot * 2 + gap + textW + padX,
      boxH: 22 * ui,
      stem: 14 * ui,
    };
  }

  private badgeBox(px: number, py: number, label: string) {
    const m = this.badgeMetrics(label);
    const hangRight =
      this.debug.labelField === "right" ||
      px + m.stem + m.boxW < this.W - 16 * m.ui;
    return {
      x: hangRight ? px + m.stem : px - m.stem - m.boxW,
      y: py - m.boxH / 2,
      w: m.boxW,
      h: m.boxH,
    };
  }

  private boxesOverlap(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
    pad: number,
  ) {
    return !(
      a.x + a.w + pad < b.x ||
      b.x + b.w + pad < a.x ||
      a.y + a.h + pad < b.y ||
      b.y + b.h + pad < a.y
    );
  }

  private projectBadge(i: number, stage: number) {
    const p = this.pts[i];
    if (!p) return null;
    return this.project(this.posAt(p, stage, this.lastNow / 1000), p.cap);
  }

  /** True when a new pin/pill would sit on an existing badge. */
  private badgeConflicts(
    i: number,
    stage: number,
    label: string,
    ignore: number[] = [],
    pads?: { pinPad?: number; boxPad?: number },
  ) {
    const pr = this.projectBadge(i, stage);
    if (!pr) return true;
    const mine = this.badgeBox(pr.px, pr.py, label);
    const clearance = pads?.pinPad ?? this.badgeClearance();
    const boxPad = pads?.boxPad ?? (this.debug.labelField === "right" ? 28 : 18);
    for (const b of this.badges) {
      if (ignore.includes(b.i)) continue;
      const qr = this.projectBadge(b.i, stage);
      if (!qr) continue;
      if (Math.hypot(qr.px - pr.px, qr.py - pr.py) < clearance) return true;
      if (this.boxesOverlap(mine, this.badgeBox(qr.px, qr.py, b.label), boxPad)) {
        return true;
      }
    }
    return false;
  }

  /** Pick a front-facing node that isn’t already labeled and isn’t crowded. */
  private pickBadgeNode(stage: number, used: number[]): number {
    if (!this.nodeIdx.length) return -1;
    const rightField = this.debug.labelField === "right";
    const longest = this.longestBadgeLabel();
    const metrics = this.badgeMetrics(longest);
    for (let attempt = 0; attempt < 280; attempt++) {
      const i = this.nodeIdx[(Math.random() * this.nodeIdx.length) | 0]!;
      if (used.includes(i)) continue;
      const p = this.pts[i]!;
      const pr = this.project(this.posAt(p, stage, this.lastNow / 1000), p.cap);
      if (pr.z2 < 0.05) continue;
      const r = Math.hypot(pr.px - this.cx, pr.py - this.cy);
      const exploded = stage < 1.4;
      if (exploded) {
        // Cloud fills the frame — right hemisphere only, full vertical span.
        const xMin = rightField ? this.W * 0.56 : 120;
        const xMax = rightField ? this.W - 180 : this.W - 160;
        if (
          pr.px < xMin ||
          pr.px > xMax ||
          pr.py < this.H * 0.14 ||
          pr.py > this.H * 0.86
        ) {
          continue;
        }
      } else {
        if (r < 0.28 * this.R || r > 1.08 * this.R) continue;
        // Ordered 1.90: stay off the title (left) and leave room for a right-hanging pill.
        const xMin = rightField ? this.W * 0.52 : 40;
        const xMax = rightField
          ? this.W - 24 - metrics.stem - metrics.boxW
          : this.W - 40;
        const yMin = rightField ? this.H * 0.1 : 40;
        const yMax = rightField ? this.H - 88 : this.H - 40;
        if (pr.px < xMin || pr.px > xMax || pr.py < yMin || pr.py > yMax) {
          continue;
        }
        // Slide number lives top-right; debugger panel sits bottom-left.
        if (rightField && pr.px > this.W * 0.8 && pr.py < this.H * 0.14) {
          continue;
        }
        if (!rightField && pr.px < 380 && pr.py > this.H - 360) continue;
      }
      if (rightField && !exploded && pr.px < this.W * 0.52) {
        continue;
      }
      if (this.badgeConflicts(i, stage, longest)) continue;
      return i;
    }
    return -1;
  }

  private badgeDensity() {
    return Math.max(1, Math.min(4, Math.round(this.debug.labelDensity ?? 2)));
  }

  private badgeCap() {
    return BADGE_MAX * this.badgeDensity();
  }

  private badgeClearance() {
    const base = this.debug.labelField === "right" ? 160 : 110;
    return base / Math.sqrt(this.badgeDensity());
  }

  private spawnBadge(now: number, stage: number) {
    const d = this.badgeDensity();
    if (this.badges.length >= this.badgeCap()) {
      this.nextBadgeSpawn = now + (450 + Math.random() * 600) / d;
      return;
    }
    const used = this.badges.map((b) => b.i);
    const i = this.pickBadgeNode(stage, used);
    if (i >= 0) {
      const taken = new Set(this.badges.map((b) => b.label));
      const pool = BADGE_LABELS.filter((l) => !taken.has(l));
      const label =
        pool[(Math.random() * pool.length) | 0] ??
        BADGE_LABELS[(Math.random() * BADGE_LABELS.length) | 0]!;
      // After spawn: if two badges are closer than clearance (or pills overlap), keep neither new one.
      if (!this.badgeConflicts(i, stage, label)) {
        this.badges.push({
          i,
          label,
          t0: now,
          dur: 3800 + Math.random() * 2200,
        });
      }
    }
    this.nextBadgeSpawn = now + (550 + Math.random() * 700) / d;
  }

  /**
   * Akon-style particle highlight: ring + mono label pill.
   * Returns false when the badge should be removed.
   */
  private drawBadge(
    badge: ParticleBadge,
    now: number,
    theme: number,
    stage: number,
  ): boolean {
    const age = now - badge.t0;
    if (age > badge.dur) return false;

    let fade = 1;
    if (age < 280) fade = age / 280;
    else if (age > badge.dur - 480) fade = (badge.dur - age) / 480;

    const p = this.pts[badge.i];
    if (!p) return false;
    const pr = this.project(this.posAt(p, stage, now / 1000), p.cap);
    fade *= clamp01((pr.z2 - 0.02) / 0.18);
    if (fade <= 0.01) return age <= badge.dur;

    const ctx = this.ctx;
    const pal = CLUSTER_COLORS[p.clusterId] ?? CLUSTER_COLORS[0]!;
    const rgb = [
      lerp(pal[0][0], pal[1][0], theme),
      lerp(pal[0][1], pal[1][1], theme),
      lerp(pal[0][2], pal[1][2], theme),
    ].map((v) => v | 0) as [number, number, number];

    const pulse = 1 + 0.12 * Math.sin(age / 260);
    const ui = Math.max(1, this.W / 1080);
    const ringR = 5.5 * pulse * ui;

    // Highlight ring on the particle
    ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.8 * fade})`;
    ctx.lineWidth = 1.15 * ui;
    ctx.beginPath();
    ctx.arc(pr.px, pr.py, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${fade})`;
    ctx.beginPath();
    ctx.arc(pr.px, pr.py, 2.2 * ui, 0, Math.PI * 2);
    ctx.fill();

    // Label pill
    ctx.font = `${11 * ui}px "Geist Mono", ui-monospace, Consolas, monospace`;
    const padX = 9 * ui;
    const dot = 2.4 * ui;
    const gap = 6 * ui;
    const textW = ctx.measureText(badge.label).width;
    const boxW = padX + dot * 2 + gap + textW + padX;
    const boxH = 22 * ui;
    const stem = 14 * ui;
    const slotted = badge.slotX != null && badge.slotY != null;
    const fitsRight = pr.px + stem + boxW < this.W - 16 * ui;
    const placeLeft = slotted
      ? !!badge.hangLeft
      : this.debug.labelField === "right"
        ? false
        : pr.px < this.cx || !fitsRight;
    const boxX = slotted
      ? badge.slotX!
      : placeLeft
        ? pr.px - stem - boxW
        : fitsRight
          ? pr.px + stem
          : Math.max(16 * ui, this.W - 16 * ui - boxW);
    const midY = slotted ? badge.slotY! : pr.py;
    const boxY = midY - boxH / 2;
    const ink = theme < 0.5;

    // Stem
    ctx.strokeStyle = ink
      ? `rgba(244,239,230,${0.28 * fade})`
      : `rgba(24,35,46,${0.28 * fade})`;
    ctx.lineWidth = ui;
    ctx.beginPath();
    ctx.moveTo(pr.px + (placeLeft ? -ringR : ringR), pr.py);
    ctx.lineTo(placeLeft ? boxX + boxW : boxX, midY);
    ctx.stroke();

    // Pill
    ctx.fillStyle = ink
      ? `rgba(24,35,46,${0.9 * fade})`
      : `rgba(244,239,230,${0.94 * fade})`;
    ctx.strokeStyle = ink
      ? `rgba(244,239,230,${0.16 * fade})`
      : `rgba(24,35,46,${0.14 * fade})`;
    ctx.lineWidth = ui;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(boxX, boxY, boxW, boxH, 7 * ui);
    } else {
      ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${fade})`;
    ctx.beginPath();
    ctx.arc(boxX + padX + dot, midY, dot, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = ink
      ? `rgba(244,239,230,${0.95 * fade})`
      : `rgba(24,35,46,${0.95 * fade})`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(badge.label, boxX + padX + dot * 2 + gap, midY + 0.5);

    return true;
  }

  private updateBadges(now: number, theme: number, stage: number) {
    if (!this.debug.showLabels) {
      this.badges.length = 0;
      return;
    }
    for (let t = this.badges.length - 1; t >= 0; t--) {
      if (!this.drawBadge(this.badges[t]!, now, theme, stage)) {
        this.badges.splice(t, 1);
      }
    }
    // Exploded satellites own the callouts. Meteors still honor label density.
    if (this.figW > 0.3) {
      this.badges.length = 0;
      return;
    }
    if (now > this.nextBadgeSpawn) this.spawnBadge(now, stage);
  }

  private _stage = 0;

  /**
   * Slides preview / debugger overrides.
   * Live marketing never sets these.
   */
  debug = {
    /** Multiplier on auto rotation (0 = freeze). */
    rotSpeedScale: 1,
    /** Combinable overlays. */
    overlays: {
      meteors: false,
      connections: false,
      agents: false,
    },
    /** 1 = default; >1 pushes particle colors brighter. */
    brightBoost: 1.35,
    /** Akon-style floating labels on random nodes. */
    showLabels: true,
    /** Discrete density: 1 = current, 2 = 2×, 3 = 3× amount + spawn speed. */
    labelDensity: 2,
    /** Still-export bias so slide copy on the left stays clear. */
    labelField: "all" as "all" | "right",
    /** Override layoutAt cx (0–1). Null = auto (0.65 on wide, else 0.5). */
    cxFrac: null as number | null,
    /** Multiply layout radius after stage sizing. */
    radiusScale: 1,
    /** Meteor trail count + spawn speed (1–4×). */
    meteorDensity: 2,
    /** Force Ink (0) or Sand (1) surface; null = stage-driven theme. */
    surface: "ink" as "ink" | "sand",
    /** Agent / exploded-segment satellite count. */
    satelliteCount: 28,
    /** Sand stills: every particle/edge is dark grey (Team / Ask). */
    greySand: false,
  };

  private sandGrey(depth: number): [number, number, number] {
    const t = 0.62 + 0.38 * clamp01(depth);
    const g = 42 + 26 * t;
    return [g, g + 2, g + 6];
  }

  /** Theme 0 = Ink (dark), 1 = Sand (light) */
  static themeAt(stage: number) {
    return pulseWindow(stage, 4.6, 5.0, 5.4, 5.85) * 0.35;
  }

  static bgColorAt(stage: number) {
    const t = KnowledgeInstrument.themeAt(stage);
    const r = Math.round(lerp(24, 244, t));
    const g = Math.round(lerp(35, 239, t));
    const b = Math.round(lerp(46, 230, t));
    return `rgb(${r},${g},${b})`;
  }

  frame(now: number, { stage }: InstrumentFrame) {
    this._stage = stage;
    const ctx = this.ctx;
    const dt = this.lastNow ? Math.min(0.05, (now - this.lastNow) / 1000) : 0.016;
    this.lastNow = now;
    const time = now / 1000;

    // exploded_segments pulses in and out so longitudes2 can close last.
    this.figW = pulseWindow(stage, 6.2, 6.45, 6.75, 7.1);
    const gridW = pulseWindow(stage, 5.15, 5.55, 5.95, 6.4);
    const bandW = clamp01(smoothstep((stage - 7.05) / 0.4));

    const rotSpeed =
      lerp(0.09, 0.028, smoothstep(stage / 1)) *
      (this.reduceMotion ? 0 : 1) *
      (this.debug.rotSpeedScale ?? 1) *
      (1 - 0.35 * bandW) *
      (1 - 0.8 * this.figW);
    this.rot += rotSpeed * dt;
    this.cosY = Math.cos(this.rot);
    this.sinY = Math.sin(this.rot);
    this.layoutAt(stage);

    if (this.figW > 0.01) {
      const n = Math.min(this.satCount(), CAP_LABELS.length);
      const reach = Math.min(
        Math.max(this.W / 2 - 200, 0.36 * this.W),
        2.15 * this.R,
      );
      const lift = Math.min(reach * 0.92, this.cy - 80, 1.45 * this.R);
      this.figOff = Array.from({ length: n }, (_, i) => {
        const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
        return { dx: Math.cos(ang) * reach, dy: Math.sin(ang) * lift };
      });
    } else {
      this.figOff = [];
    }

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    if (this.debug.surface === "sand") {
      ctx.fillStyle = "#F4EFE6";
      ctx.fillRect(0, 0, this.W, this.H);
    }

    const theme =
      this.debug.surface === "sand"
        ? 1
        : this.debug.surface === "ink"
          ? 0
          : KnowledgeInstrument.themeAt(stage);
    const boost = this.debug.brightBoost ?? 1;

    // Graph links after the linked beat — hold through dayzero, then yield.
    let edgeA = pulseWindow(stage, 3.5, 3.62, 5.15, 5.55);
    if (this.debug.overlays.connections) {
      edgeA = Math.max(edgeA, 0.95);
    }

    // Particle / edge cluster color: off for domains, on from linked and held
    // (do not fade at dayzero — the linked palette stays on the gathered sphere)
    const clusterW =
      clamp01(smoothstep((stage - 3.25) / 0.3)) * (1 - this.figW);
    // Domains = one shared color (full by 2.80); palette returns at linked
    const domainsMono = pulseWindow(stage, 2.55, 2.8, 3.2, 3.48);
    // Ink: lines carry the color. Sand: particles go neon so they read on cream.
    const particleClusterW =
      clusterW * (theme > 0.5 ? 0.88 : 0.35) +
      (this.debug.overlays.connections ? 0.75 : 0);

    if (edgeA > 0.01) {
      this.drawEdges(
        edgeA *
          (this.debug.overlays.connections ? 1.35 : 1),
        theme,
        Math.max(clusterW, this.debug.overlays.connections ? 0.85 : 0),
        time,
      );
    }

    // Real lat/long accent on longitudes; optical gaps close on longitudes2.
    const activeCap =
      this.figW > 0.9
        ? Math.floor(time / 2.4) % Math.min(this.satCount(), CAP_LABELS.length)
        : -1;

    const n = this.pts.length;
    for (let i = 0; i < n; i++) {
      const p = this.pts[i]!;
      const pos = this.posAt(p, stage, time);
      const pr = this.project(pos, p.cap);
      if (
        pr.px < -8 ||
        pr.px > this.W + 8 ||
        pr.py < -8 ||
        pr.py > this.H + 8
      ) {
        continue;
      }

      const depth = (pr.z2 + 1) / 2;

      let cr = lerp(p.darkC[0], p.lightC[0], theme);
      let cg = lerp(p.darkC[1], p.lightC[1], theme);
      let cb = lerp(p.darkC[2], p.lightC[2], theme);

      if (particleClusterW > 0.01) {
        const pal = CLUSTER_COLORS[p.clusterId];
        const target = pal[theme > 0.5 ? 1 : 0];
        const w = particleClusterW * (p.isNode ? 1 : theme > 0.5 ? 0.92 : 0.75);
        cr = lerp(cr, target[0], w);
        cg = lerp(cg, target[1], w);
        cb = lerp(cb, target[2], w);
      }

      if (domainsMono > 0.01) {
        const ink = [228, 224, 216];
        const sand = [52, 60, 68];
        const target = theme > 0.5 ? sand : ink;
        cr = lerp(cr, target[0], domainsMono);
        cg = lerp(cg, target[1], domainsMono);
        cb = lerp(cb, target[2], domainsMono);
      }

      if (gridW > 0.01) {
        if (p.lonAccent) {
          if (theme > 0.5) {
            const dim = 1 - 0.12 * gridW;
            cr *= dim;
            cg *= dim;
            cb *= dim;
          } else {
            cr = Math.min(255, cr + 28 * gridW);
            cg = Math.min(255, cg + 28 * gridW);
            cb = Math.min(255, cb + 28 * gridW);
          }
        } else {
          const dim = 1 - 0.38 * gridW;
          cr *= dim;
          cg *= dim;
          cb *= dim;
        }
      }

      if (this.figW > 0.01 && p.cap >= 0) {
        const pal = CLUSTER_COLORS[p.cap % CLUSTER_COLORS.length][theme > 0.5 ? 1 : 0];
        const w = this.figW * (p.cap === activeCap ? 0.95 : 0.55);
        cr = lerp(cr, pal[0], w);
        cg = lerp(cg, pal[1], w);
        cb = lerp(cb, pal[2], w);
      }

      if (this.debug.greySand) {
        const grey = this.sandGrey(depth);
        cr = grey[0];
        cg = grey[1];
        cb = grey[2];
      }

      // Brightness slider is for Ink. On Sand it just washes pigment into the cream.
      if (boost !== 1 && theme < 0.5) {
        cr = Math.min(255, cr * boost);
        cg = Math.min(255, cg * boost);
        cb = Math.min(255, cb * boost);
      }

      let size = 1.45 * p.size * (0.65 + 0.7 * depth);
      if (gridW > 0.01 && p.lonAccent) size += 1.2 * gridW;

      let alpha = 1;
      if (bandW > 0.01) {
        const twinkle =
          0.72 + 0.28 * Math.sin(time * p.twinkle + p.phase);
        const depthA = 0.2 + 0.8 * clamp01(depth);
        const xr = pos.x * this.cosY + pos.z * this.sinY;
        const zr = -pos.x * this.sinY + pos.z * this.cosY;
        const lon = Math.atan2(zr, xr);
        // Darker, slightly wider valleys so gaps still read on the smaller shell.
        const gap = Math.pow(Math.abs(Math.sin(lon * 10)), 0.58);
        alpha = lerp(
          1,
          depthA * twinkle * (0.1 + 0.9 * gap),
          bandW,
        );
        size *= lerp(1, 0.62 + 0.55 * gap, bandW);
      }

      ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${alpha})`;
      ctx.fillRect(pr.px - size / 2, pr.py - size / 2, size, size);
    }

    this.drawCapFigure(this.figW, time, theme);

    if (this.debug.overlays.meteors) {
      this.updateTrails(now, theme, stage);
    } else if (this.trails.length) {
      this.trails.length = 0;
    }
    if (this.debug.overlays.agents) {
      this.drawConsumingAgents(now);
    }

    // Akon-style floating labels on random nodes
    this.updateBadges(now, theme, stage);
  }
}

/** Map scroll progress 0–1 through the sticky track → stage */
export const STAGE_RANGE = 8;

export function stageFromProgress(progress: number): InstrumentFrame {
  const p = clamp01(progress);
  return { stage: Math.min(STAGE_RANGE, p * STAGE_RANGE) };
}

export function progressForStage(stage: number) {
  return clamp01(stage / STAGE_RANGE);
}

export function beatIndexForStage(stage: number) {
  const i = STORY_BEATS.findIndex((b) => stage >= b.min && stage < b.max);
  return i >= 0 ? i : STORY_BEATS.length - 1;
}

/** Scroll Y that lands mid-beat so the slide reads clearly */
export function scrollYForBeatIndex(track: HTMLElement, beatIndex: number) {
  const beat = STORY_BEATS[Math.max(0, Math.min(STORY_BEATS.length - 1, beatIndex))];
  const stage = Math.min(beat.min + 0.08, (beat.min + beat.max) / 2);
  const progress = progressForStage(stage);
  const total = Math.max(track.offsetHeight - window.innerHeight, 1);
  const trackTop = track.getBoundingClientRect().top + window.scrollY;
  return trackTop + progress * total;
}

export type StoryBeat = {
  min: number;
  max: number;
  title: string;
  body: string;
};

export const STORY_BEATS: StoryBeat[] = [
  {
    min: 0,
    max: 1.15,
    title: "Your team's best thinking, preserved forever.",
    body: "Your people hold the real know-how: in their heads, in Slack threads, in calls no one writes down. It lives with them. Then they leave, and it vanishes.",
  },
  {
    min: 1.15,
    max: 2.15,
    title: "Tacit finds order.",
    body: "Passive capture from the tools you already use. Zero behavior change. Knowledge compounds instead of resetting.",
  },
  {
    min: 2.15,
    max: 3.2,
    title: "Domains of know-how, revealed.",
    body: "Negotiation tactics, follow-ups, workflows, systems knowledge, clustered the way your company actually works.",
  },
  {
    min: 3.2,
    max: 4.2,
    title: "Related knowledge, linked.",
    body: "What refines what. Who taught whom. The invisible graph behind how work really gets done.",
  },
  {
    min: 4.2,
    max: 6,
    title: "Day one. Full context.",
    body: "Searchable playbooks for every hire, and the unconscious layer your AI agents were missing.",
  },
];

export function beatForStage(stage: number): StoryBeat {
  return (
    STORY_BEATS.find((b) => stage >= b.min && stage < b.max) ??
    STORY_BEATS[STORY_BEATS.length - 1]
  );
}
