/** Canvas-2D knowledge instrument — Akon-style particle sphere with scroll stages. */

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
};

type Edge = { a: number; b: number; sameCluster: boolean };

/**
 * Segment palettes on Ink — yellow / reddish / blueish families.
 * Each entry: [darkRGB, lightRGB] for theme lerp.
 */
const CLUSTER_COLORS: [[number, number, number], [number, number, number]][] = [
  // Amber gold
  [
    [196, 146, 62],
    [232, 196, 118],
  ],
  // Soft coral / terracotta
  [
    [194, 98, 86],
    [232, 148, 132],
  ],
  // Steel blue
  [
    [88, 132, 178],
    [148, 184, 220],
  ],
  // Warm ochre
  [
    [178, 128, 58],
    [218, 178, 108],
  ],
  // Dusty rose
  [
    [176, 92, 110],
    [220, 148, 162],
  ],
  // Periwinkle / slate blue
  [
    [104, 124, 168],
    [160, 176, 210],
  ],
];

/** Neutral link color on Ink — soft champagne, not Pulse green */
const EDGE_BASE: [number, number, number] = [168, 158, 138];

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
  particleCount = 4200;
  private reduceMotion = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  resize(width: number, height: number) {
    this.W = Math.max(1, width);
    this.H = Math.max(1, height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
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
   * up to five agents (random among three kinds) that connect, draw
   * knowledge, disconnect, and return — anything plugs into the graph.
   * Pass `timeMs` for animation; omit for a still frame.
   */
  paintAgentsBackdrop(rot = 1.12, timeMs = 0) {
    const animated = !this.reduceMotion && timeMs > 0;
    const liveRot = animated ? rot + timeMs * 0.000032 : rot;
    this.paintColoredSphereStatic(liveRot);
    this.drawConsumingAgents(animated ? timeMs : 0);
  }

  /** Still of the colored unified sphere (no agent satellites). */
  paintUnifiedSphere(rot = 1.12) {
    this.paintColoredSphereStatic(rot);
  }

  /** Sphere layout + cluster colors + links — mapped knowledge, together. */
  private paintColoredSphereStatic(rot: number) {
    this.rot = rot;
    this.cosY = Math.cos(rot);
    this.sinY = Math.sin(rot);
    this.lastNow = 0;
    // Stage ~2.15: ordered sphere framing, edges on, before segments pull apart
    const stage = 2.15;
    this._stage = stage;
    this.layoutAt(stage);

    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);

    const edgeA = 0.85;
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
      if (edge.sameCluster) {
        const c = CLUSTER_COLORS[pa.clusterId][0];
        r = lerp(r, c[0], 0.55);
        g = lerp(g, c[1], 0.55);
        bl = lerp(bl, c[2], 0.55);
      }
      const alpha = edgeA * (0.18 + 0.45 * depth);
      ctx.strokeStyle = `rgba(${r | 0},${g | 0},${bl | 0},${alpha})`;
      ctx.lineWidth = edge.sameCluster ? 1.15 : 0.85;
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
      const pal = CLUSTER_COLORS[p.clusterId];
      const target = pal[0];
      let cr = lerp(p.darkC[0], target[0], clusterW * (p.isNode ? 1 : 0.72));
      let cg = lerp(p.darkC[1], target[1], clusterW * (p.isNode ? 1 : 0.72));
      let cb = lerp(p.darkC[2], target[2], clusterW * (p.isNode ? 1 : 0.72));
      if (p.isNode) {
        cr = lerp(cr, 210, 0.22);
        cg = lerp(cg, 198, 0.22);
        cb = lerp(cb, 168, 0.22);
      }
      const size = 1.35 * p.size * (0.65 + 0.7 * depth);
      ctx.fillStyle = `rgb(${cr | 0},${cg | 0},${cb | 0})`;
      ctx.fillRect(pr.px - size / 2, pr.py - size / 2, size, size);
    }
  }

  private drawConsumingAgents(timeMs = 0) {
    if (this.W < 900) return;

    const ctx = this.ctx;

    /** Three defined connectors — anything can plug into the graph. */
    const kinds: {
      label: string;
      icon: string;
      palette: [number, number, number];
    }[] = [
      {
        label: "Claude",
        icon: "claude",
        palette: CLUSTER_COLORS[2][0],
      },
      {
        label: "ChatGPT",
        icon: "chatgpt",
        palette: CLUSTER_COLORS[0][0],
      },
      {
        label: "Your agents",
        icon: "agents",
        palette: CLUSTER_COLORS[1][0],
      },
    ];

    /**
     * Up to 5 concurrent slots. Each cycle picks a random kind + angle
     * (deterministic per slot×cycle so frames stay stable). Not ordered —
     * the point is many things connecting into one graph.
     */
    const SLOT_COUNT = 5;
    const slots = [
      { phaseMs: 0, cycleMs: 9200, homeAngle: -1.15, baseDist: 1.5 },
      { phaseMs: 1800, cycleMs: 10800, homeAngle: -0.35, baseDist: 1.66 },
      { phaseMs: 4100, cycleMs: 9800, homeAngle: 0.45, baseDist: 1.54 },
      { phaseMs: 6400, cycleMs: 11400, homeAngle: 1.15, baseDist: 1.7 },
      { phaseMs: 2900, cycleMs: 10100, homeAngle: 1.85, baseDist: 1.48 },
    ];

    /** Stable 0..1 hash from two ints — no Math.random per frame. */
    const hash01 = (a: number, b: number) => {
      let n = (a * 374761393 + b * 668265263) | 0;
      n = (n ^ (n >>> 13)) * 1274126177;
      return ((n >>> 0) % 10000) / 10000;
    };

    const badgeR = Math.min(20, Math.min(this.W, this.H) * 0.026);
    const staticMode = timeMs <= 0;

    for (let i = 0; i < SLOT_COUNT; i++) {
      const slot = slots[i];
      const elapsed = timeMs + slot.phaseMs;
      const cycleIndex = staticMode
        ? i
        : Math.floor(elapsed / slot.cycleMs);
      const local = staticMode
        ? 0.42 + hash01(i, 7) * 0.2
        : (elapsed % slot.cycleMs) / slot.cycleMs;

      const kind = kinds[Math.floor(hash01(i, cycleIndex) * kinds.length) % kinds.length];
      const angleJitter = (hash01(cycleIndex, i + 3) - 0.5) * 0.85;
      const distJitter = (hash01(i + 11, cycleIndex) - 0.5) * 0.14;

      // Lifecycle: appear → connect → feed → disconnect → vanish
      let presence = 1;
      let connect = 1;
      let feeding = 1;
      if (!staticMode) {
        if (local < 0.1) {
          presence = smoothstep(local / 0.1);
          connect = 0;
          feeding = 0;
        } else if (local < 0.26) {
          presence = 1;
          connect = smoothstep((local - 0.1) / 0.16);
          feeding = 0;
        } else if (local < 0.64) {
          presence = 1;
          connect = 1;
          feeding = 1;
        } else if (local < 0.78) {
          presence = 1;
          connect = 1 - smoothstep((local - 0.64) / 0.14);
          feeding = 1 - smoothstep((local - 0.64) / 0.1);
        } else {
          presence = 1 - smoothstep((local - 0.78) / 0.22);
          connect = 0;
          feeding = 0;
        }
      }

      if (presence < 0.02) continue;

      const wanderT = staticMode ? 0 : timeMs * 0.001;
      const angle =
        slot.homeAngle +
        angleJitter +
        Math.sin(wanderT * 0.31 + i * 1.7) * 0.18 +
        Math.cos(wanderT * 0.19 + i * 0.9) * 0.08;
      const exitBoost = staticMode ? 0 : (1 - presence) * 0.18;
      const dist =
        slot.baseDist +
        distJitter +
        Math.sin(wanderT * 0.37 + i * 2.1) * 0.06 +
        exitBoost;

      const satX = this.cx + Math.cos(angle) * this.R * dist;
      const satY = this.cy + Math.sin(angle) * this.R * dist;
      if (satX < 24 || satX > this.W - 16 || satY < 24 || satY > this.H - 28) {
        continue;
      }

      const dx = satX - this.cx;
      const dy = satY - this.cy;
      const len = Math.hypot(dx, dy) || 1;
      const hubX = this.cx + (dx / len) * this.R * 0.92;
      const hubY = this.cy + (dy / len) * this.R * 0.92;
      const cpx = (hubX + satX) * 0.5 + (-dy / len) * this.R * 0.12;
      const cpy = (hubY + satY) * 0.5 + (dx / len) * this.R * 0.12;

      const curveAt = (t: number) => {
        const mt = 1 - t;
        return {
          x: mt * mt * hubX + 2 * mt * t * cpx + t * t * satX,
          y: mt * mt * hubY + 2 * mt * t * cpy + t * t * satY,
        };
      };

      if (connect > 0.02) {
        ctx.save();
        ctx.globalAlpha = connect * presence * 0.95;
        ctx.beginPath();
        ctx.moveTo(hubX, hubY);
        const steps = Math.max(3, Math.ceil(28 * connect));
        for (let s = 1; s <= steps; s++) {
          const t = (s / steps) * connect;
          const p = curveAt(t);
          ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(26, 158, 120, 0.45)";
        ctx.lineWidth = 1.35;
        ctx.setLineDash([3.5, 5]);
        ctx.lineDashOffset = staticMode ? 0 : -((timeMs * 0.028) % 17);
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      if (feeding > 0.02 && connect > 0.55) {
        const [r, g, b] = kind.palette;
        for (let p = 0; p < 4; p++) {
          const base = staticMode
            ? 0.25 + p * 0.2
            : (timeMs * 0.00022 + p * 0.22 + i * 0.13) % 1;
          const t = base * connect;
          if (t < 0.04 || t > connect - 0.02) continue;
          const pt = curveAt(t);
          const s = (2.1 + t * 1.4) * feeding * presence;
          ctx.globalAlpha = feeding * presence;
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(pt.x - s / 2, pt.y - s / 2, s, s);
          ctx.globalAlpha = 1;
        }
      }

      ctx.save();
      ctx.globalAlpha = presence;
      const appearScale = 0.86 + 0.14 * presence;

      ctx.beginPath();
      ctx.arc(satX, satY, (badgeR + 6) * appearScale, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(24, 35, 46, 0.72)";
      ctx.fill();
      ctx.strokeStyle = "rgba(244, 239, 230, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const img = this.agentIcons.get(kind.icon);
      if (img) {
        const s = badgeR * 1.65 * appearScale;
        ctx.drawImage(img, satX - s / 2, satY - s / 2, s, s);
      } else {
        ctx.beginPath();
        ctx.arc(satX, satY, badgeR * 0.45 * appearScale, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${kind.palette[0]},${kind.palette[1]},${kind.palette[2]})`;
        ctx.fill();
      }

      ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
      ctx.fillStyle = "rgba(244, 239, 230, 0.85)";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(
        kind.label.toUpperCase(),
        satX,
        satY + (badgeR + 10) * appearScale,
      );
      ctx.restore();
    }
  }

  private buildParticles() {
    const centroids: Vec3[] = [];
    for (let t = 0; t < 6; t++) {
      const s = 1 - (t / 5) * 2;
      const i = Math.sqrt(Math.max(0, 1 - s * s));
      const a = t * GOLDEN * 7.3;
      centroids.push({ x: Math.cos(a) * i, y: s, z: Math.sin(a) * i });
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
      const palette = CLUSTER_COLORS[clusterId];
      const grayD = 165 + 90 * Math.random();
      const grayL = 30 + 70 * Math.random();

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
        lightC: accent
          ? palette[1]
          : [grayL, grayL + 8, grayL + 18],
        size,
        phase: Math.random() * Math.PI * 2,
        twinkle: 1.2 + 2.2 * Math.random(),
      });
    }

    this.pts.forEach((e, t) => {
      if (e.size > 1.35) {
        e.isNode = true;
        this.nodeIdx.push(t);
      }
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
    // Camera framing across beats — right-biased so left copy stays readable
    const CX = [0.56, 0.58, 0.58, 0.6, 0.58, 0.55, 0.55];
    const CY = [0.5, 0.5, 0.5, 0.5, 0.5, 0.52, 0.52];
    // Slightly larger framing while exploded so the cloud fills the stage
    const RR = [0.42, 0.4, 0.33, 0.32, 0.33, 0.34, 0.34];
    const i = Math.min(5, Math.floor(stage));
    const t = smoothstep(Math.min(1, (stage - i) / 0.6));
    const mobile = this.W < 768;
    this.cx = (mobile ? 0.5 : lerp(CX[i], CX[i + 1], t)) * this.W;
    this.cy = lerp(CY[i], CY[i + 1], t) * this.H;
    this.R =
      lerp(RR[i], RR[i + 1], t) * Math.min(this.W, this.H) * (mobile ? 0.88 : 1);
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
    const i = Math.min(5, Math.floor(stage));
    const a = smoothstep(Math.min(1, (stage - i) / 0.6));
    return lerpVec(this.keyPos(p, i, time), this.keyPos(p, i + 1, time), a);
  }

  private project(e: Vec3): { px: number; py: number; z2: number } {
    const n = e.x * this.cosY + e.z * this.sinY;
    const o = -e.x * this.sinY + e.z * this.cosY;
    // Fixed tilt ~10°
    const tiltC = 0.9838436927881214;
    const tiltS = -0.17902957342582418;
    const z2 = tiltS * e.y + tiltC * o;
    const d = 1 / (1 - z2 / 3.6);
    return {
      px: this.cx + n * this.R * d,
      py: this.cy + (tiltC * e.y - tiltS * o) * this.R * d,
      z2,
    };
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
      const a = this.project(this.posAt(pa, this._stage, time));
      const b = this.project(this.posAt(pb, this._stage, time));
      const depth = ((a.z2 + b.z2) / 2 + 1) / 2;
      let r = EDGE_BASE[0];
      let g = EDGE_BASE[1];
      let bl = EDGE_BASE[2];
      if (clusterW > 0.01 && edge.sameCluster) {
        const c = CLUSTER_COLORS[pa.clusterId][theme > 0.5 ? 1 : 0];
        r = lerp(r, c[0], clusterW);
        g = lerp(g, c[1], clusterW);
        bl = lerp(bl, c[2], clusterW);
      }
      // Full opacity — depth only affects stroke weight
      if (strength < 0.02) continue;
      ctx.strokeStyle = `rgb(${r | 0},${g | 0},${bl | 0})`;
      ctx.lineWidth =
        (edge.sameCluster ? 1.15 : 0.75) * (0.45 + 0.55 * depth) * strength;
      ctx.beginPath();
      ctx.moveTo(a.px, a.py);
      ctx.lineTo(b.px, b.py);
      ctx.stroke();
    }
  }

  private _stage = 0;

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

    const rotSpeed =
      lerp(0.09, 0.028, smoothstep(stage / 1)) *
      (this.reduceMotion ? 0 : 1);
    this.rot += rotSpeed * dt;
    this.cosY = Math.cos(this.rot);
    this.sinY = Math.sin(this.rot);
    this.layoutAt(stage);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);

    const theme = KnowledgeInstrument.themeAt(stage);

    // Edges: appear once the cloud collapses into order
    const edgeA = Math.max(
      pulseWindow(stage, 1.9, 2.45, 4.8, 5.5),
      pulseWindow(stage, 3.0, 3.4, 4.2, 4.8) * 0.5,
    );
    const clusterW = pulseWindow(stage, 2.55, 3.15, 4.4, 5.2);

    if (edgeA > 0.01) this.drawEdges(edgeA, theme, clusterW, time);

    const n = this.pts.length;
    for (let i = 0; i < n; i++) {
      const p = this.pts[i];
      const pos = this.posAt(p, stage, time);
      const pr = this.project(pos);
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

      if (clusterW > 0.01) {
        const pal = CLUSTER_COLORS[p.clusterId];
        const target = theme > 0.5 ? pal[1] : pal[0];
        const w = clusterW * (p.isNode ? 1 : 0.7);
        cr = lerp(cr, target[0], w);
        cg = lerp(cg, target[1], w);
        cb = lerp(cb, target[2], w);
      }

      // Soft sand accent on nodes when ordered (not Pulse green)
      const orderW = pulseWindow(stage, 1.85, 2.4, 5.0, 5.6);
      if (orderW > 0.01 && p.isNode) {
        cr = lerp(cr, 210, orderW * 0.4);
        cg = lerp(cg, 198, orderW * 0.4);
        cb = lerp(cb, 168, orderW * 0.4);
      }

      // Full opacity — depth only affects size
      const size = 1.35 * p.size * (0.65 + 0.7 * depth);
      ctx.fillStyle = `rgb(${cr | 0},${cg | 0},${cb | 0})`;
      ctx.fillRect(pr.px - size / 2, pr.py - size / 2, size, size);
    }
  }
}

/** Map scroll progress 0–1 through the sticky track → stage */
export const STAGE_RANGE = 5.2;

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
  highlight?: string;
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
    title: "A judgment layer for AI agents and employees.",
    highlight: "judgment layer",
    body: "The end goal is to build the judgment layer both AI agents and employees use — how work actually gets decided, not only what's written down. Tacit captures that unwritten know-how so people and agents can act with the same operational judgment.",
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
