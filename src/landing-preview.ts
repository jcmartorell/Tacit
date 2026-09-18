/**
 * Marketing landing preview: live KnowledgeInstrument as white-ground background.
 * Same engine as sphere-preview-slides.html (light palette + auto-orbit).
 */
import { KnowledgeInstrument } from "./lib/knowledgeInstrument.slides";

const canvas = document.getElementById("sphere-bg") as HTMLCanvasElement;
const engine = new KnowledgeInstrument(canvas);

engine.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
engine.debug.surface = "white";
engine.debug.rotSpeedScale = engine.reduceMotion ? 0 : 0.55;
engine.debug.brightBoost = 1.25;
engine.debug.overlays = { meteors: false, connections: false, agents: false };
engine.debug.showLabels = false;
engine.debug.cxFrac = 0.72;
engine.debug.radiusScale = 1.05;

const STAGE = 7.55; // longitudes2
engine.rebuild(2800);

function resize() {
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  engine.resize(w, h);
}

let raf = 0;
function tick(now: number) {
  resize();
  engine.frame(now, { stage: STAGE });
  raf = requestAnimationFrame(tick);
}

window.addEventListener("resize", resize);
resize();
raf = requestAnimationFrame(tick);

window.addEventListener("beforeunload", () => {
  if (raf) cancelAnimationFrame(raf);
});
