/**
 * Marketing landing: live KnowledgeInstrument on white ground.
 * Scroll drives stage: scattered motion → linked graph → perfect ordered sphere.
 */
import { KnowledgeInstrument } from "./lib/knowledgeInstrument.slides";

const canvas = document.getElementById("sphere-bg") as HTMLCanvasElement;
const engine = new KnowledgeInstrument(canvas);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
engine.reduceMotion = reduceMotion;
engine.debug.surface = "white";
engine.debug.brightBoost = 1.28;
engine.debug.overlays = { meteors: false, connections: false, agents: false };
engine.debug.showLabels = false;
engine.debug.cxFrac = 0.72;
engine.debug.radiusScale = 1.08;

engine.rebuild(3200);

/** Scroll story — same beats as sphere-export / deck sequence. */
type Beat = {
  /** 0–1 document scroll progress */
  t: number;
  stage: number;
  /** Auto-orbit strength */
  rot: number;
  /** Graph edges overlay */
  conn: number;
};

const BEATS: Beat[] = [
  { t: 0, stage: 0.85, rot: 1.05, conn: 0 }, // scattered motion
  { t: 0.18, stage: 1.35, rot: 0.88, conn: 0.1 }, // gathering
  { t: 0.34, stage: 1.95, rot: 0.62, conn: 0.35 }, // ordered shell forms
  { t: 0.52, stage: 3.92, rot: 0.48, conn: 1 }, // knowledge graph
  { t: 0.72, stage: 3.2, rot: 0.34, conn: 0.75 }, // settling
  { t: 0.88, stage: 2.35, rot: 0.22, conn: 0.4 }, // tightening
  { t: 1, stage: 2.12, rot: 0.16, conn: 0.15 }, // perfect ordered sphere
];

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function sampleBeats(progress: number): Beat {
  const p = clamp01(progress);
  if (p <= BEATS[0]!.t) return { ...BEATS[0]! };
  for (let i = 1; i < BEATS.length; i++) {
    const a = BEATS[i - 1]!;
    const b = BEATS[i]!;
    if (p <= b.t) {
      const u = (p - a.t) / Math.max(1e-6, b.t - a.t);
      // smoothstep for less mechanical stage jumps
      const e = u * u * (3 - 2 * u);
      return {
        t: p,
        stage: lerp(a.stage, b.stage, e),
        rot: lerp(a.rot, b.rot, e),
        conn: lerp(a.conn, b.conn, e),
      };
    }
  }
  return { ...BEATS[BEATS.length - 1]! };
}

function scrollProgress() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return clamp01(window.scrollY / max);
}

let target = sampleBeats(0);
let current = { ...target };

function syncFromScroll() {
  target = sampleBeats(scrollProgress());
}

function resize() {
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  engine.resize(w, h);
}

let raf = 0;
function tick(now: number) {
  resize();

  // Soft follow so stage eases while scrolling fast
  const follow = reduceMotion ? 1 : 0.085;
  current.stage = lerp(current.stage, target.stage, follow);
  current.rot = lerp(current.rot, target.rot, follow);
  current.conn = lerp(current.conn, target.conn, follow);

  if (reduceMotion) {
    engine.debug.rotSpeedScale = 0;
    engine.debug.overlays.connections = false;
    // Jump to near-final ordered sphere when motion is reduced
    engine.frame(now, { stage: 2.12 });
  } else {
    engine.debug.rotSpeedScale = current.rot;
    engine.debug.overlays.connections = current.conn > 0.28;
    engine.frame(now, { stage: current.stage });
  }

  raf = requestAnimationFrame(tick);
}

window.addEventListener("scroll", syncFromScroll, { passive: true });
window.addEventListener("resize", () => {
  resize();
  syncFromScroll();
});

syncFromScroll();
resize();
raf = requestAnimationFrame(tick);

window.addEventListener("beforeunload", () => {
  if (raf) cancelAnimationFrame(raf);
});
