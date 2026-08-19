/**
 * Live canvas debugger for the slides sphere fork.
 * Always runs KnowledgeInstrument.frame() with a forced stage,
 * and can tween between story states.
 */
import {
  BotIcon,
  ChatGptIcon,
  ClaudeIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { KnowledgeInstrument } from "./lib/knowledgeInstrument.slides";
import { hugeiconToDataUrl } from "./lib/hugeiconSvg";

const AGENT_ICONS = {
  team: hugeiconToDataUrl(UserMultipleIcon, "#F4EFE6"),
  people: hugeiconToDataUrl(UserMultipleIcon, "#FFFFFF"),
  claude: hugeiconToDataUrl(ClaudeIcon, "#D97757"),
  chatgpt: hugeiconToDataUrl(ChatGptIcon, "#10A37F"),
  agents: hugeiconToDataUrl(BotIcon, "#1A9E78"),
};

/** Story beats used by Play sequence (matches preset options). */
const SEQUENCE: { label: string; stage: number }[] = [
  { label: "exploded", stage: 0.85 },
  { label: "ordered", stage: 1.9 },
  { label: "domains", stage: 3.05 },
  { label: "linked", stage: 3.92 },
  { label: "dayzero", stage: 4.85 },
  { label: "longitudes", stage: 5.8 },
  { label: "exploded_segments", stage: 6.55 },
  { label: "longitudes2", stage: 7.55 },
];

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const presetEl = document.getElementById("preset") as HTMLSelectElement;
const overlayMeteorsEl = document.getElementById("overlayMeteors") as HTMLInputElement;
const overlayConnectionsEl = document.getElementById("overlayConnections") as HTMLInputElement;
const overlayAgentsEl = document.getElementById("overlayAgents") as HTMLInputElement;
const meteorDensityEl = document.getElementById("meteorDensity") as HTMLInputElement;
const meteorDensityVal = document.getElementById("meteorDensityVal")!;
const meteorWrap = document.getElementById("meteorWrap") as HTMLElement;
const agentWrap = document.getElementById("agentWrap") as HTMLElement;
const animateWrap = document.getElementById("animateWrap") as HTMLElement;
const stageEl = document.getElementById("stageSlider") as HTMLInputElement;
const rotAutoEl = document.getElementById("autoRotate") as HTMLInputElement;
const satellitesEl = document.getElementById("satellites") as HTMLInputElement;
const satVal = document.getElementById("satVal")!;
const showLabelsEl = document.getElementById("showLabels") as HTMLInputElement;
const labelDensityEl = document.getElementById("labelDensity") as HTMLInputElement;
const labelDensityVal = document.getElementById("labelDensityVal")!;
const labelDensityWrap = document.getElementById("labelDensityWrap") as HTMLElement;
const sandSurfaceEl = document.getElementById("sandSurface") as HTMLInputElement;
const brightEl = document.getElementById("bright") as HTMLInputElement;
const particlesEl = document.getElementById("particles") as HTMLInputElement;
const durationEl = document.getElementById("duration") as HTMLInputElement;
const animateEl = document.getElementById(
  "animateTransitions",
) as HTMLInputElement;
const playEl = document.getElementById("playSeq") as HTMLButtonElement;
const pauseLiveEl = document.getElementById("pauseLive") as HTMLButtonElement;
const stageVal = document.getElementById("stageVal")!;
const brightVal = document.getElementById("brightVal")!;
const durationVal = document.getElementById("durationVal")!;
const meta = document.getElementById("meta")!;

const engine = new KnowledgeInstrument(canvas);
engine.reduceMotion = false;
declare global {
  interface Window {
    __SPHERE_ENGINE__?: KnowledgeInstrument;
    __SPHERE_CAPTURE__?: (kind: "cover") => Promise<void>;
  }
}
window.__SPHERE_ENGINE__ = engine;
let capturing = false;
window.__SPHERE_CAPTURE__ = async (kind: "cover") => {
  capturing = true;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  const controls = document.getElementById("controls");
  if (controls) controls.style.display = "none";
  animateEl.checked = false;
  rotAutoEl.checked = false;
  overlayAgentsEl.checked = true;
  satellitesEl.value = "28";
  engine.debug.satelliteCount = 28;
  engine.debug.overlays.agents = true;
  engine.debug.rotSpeedScale = 0;
  await engine.preloadAgentIcons(AGENT_ICONS);
  engine.resize(1920, 1080, 3);
  if (kind === "cover") engine.paintCoverAgents(1.08);
};

/** Current painted stage (may be mid-tween). */
let stage = Number(stageEl.value) || 1.9;
/** Tween start snapshot. */
let tweenFrom = stage;
let tweenTo = stage;
let tweenStartMs = 0;
let tweenDurMs = 1400;
let tweening = false;

let sequenceIndex = -1;
let sequencing = false;
let holdUntilMs = 0;

let raf = 0;
let livePaused = false;
let lastParticleCount = -1;
let shiftHeld = false;
let dragging = false;
let lastPointerX = 0;

window.addEventListener("keydown", (e) => {
  if (e.key === "Shift") shiftHeld = true;
});
window.addEventListener("keyup", (e) => {
  if (e.key === "Shift") shiftHeld = false;
});
window.addEventListener("blur", () => {
  shiftHeld = false;
});

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function setMeta(text: string, isError = false) {
  meta.textContent = text;
  meta.classList.toggle("error", isError);
}

function resize() {
  engine.resize(Math.max(1, window.innerWidth), Math.max(1, window.innerHeight));
}

function syncStageUi() {
  stageEl.value = String(stage);
  stageVal.textContent = stage.toFixed(2);
  // Keep preset label in sync when we land on a known beat
  if (!tweening && !sequencing) {
    const hit = SEQUENCE.find((s) => Math.abs(s.stage - stage) < 0.005);
    if (hit) presetEl.value = String(hit.stage);
  }
}

function beginTween(to: number, durationMs?: number) {
  tweenFrom = stage;
  tweenTo = to;
  if (!animateEl.checked) {
    tweening = false;
    stage = tweenTo;
    syncStageUi();
    return;
  }
  tweenDurMs = Math.max(80, durationMs ?? Number(durationEl.value) * 1000);
  tweenStartMs = performance.now();
  tweening = Math.abs(tweenTo - tweenFrom) > 0.0005;
  if (!tweening) stage = tweenTo;
}

function stopSequence() {
  sequencing = false;
  sequenceIndex = -1;
  holdUntilMs = 0;
  playEl.textContent = "Play sequence";
  playEl.setAttribute("aria-pressed", "false");
}

function startSequence() {
  sequencing = true;
  sequenceIndex = 0;
  playEl.textContent = "Stop sequence";
  playEl.setAttribute("aria-pressed", "true");
  const first = SEQUENCE[0]!;
  presetEl.value = String(first.stage);
  beginTween(first.stage);
  holdUntilMs = 0;
}

function advanceSequence(now: number) {
  if (!sequencing) return;
  if (tweening) return;
  if (holdUntilMs === 0) {
    // Just landed — hold so the beat reads
    holdUntilMs = now + 900;
    return;
  }
  if (now < holdUntilMs) return;

  sequenceIndex += 1;
  if (sequenceIndex >= SEQUENCE.length) {
    stopSequence();
    return;
  }
  const next = SEQUENCE[sequenceIndex]!;
  presetEl.value = String(next.stage);
  beginTween(next.stage);
  holdUntilMs = 0;
}

function applyTweens(now: number) {
  if (tweening) {
    const t = Math.min(1, (now - tweenStartMs) / tweenDurMs);
    const e = easeInOutCubic(t);
    stage = tweenFrom + (tweenTo - tweenFrom) * e;
    if (t >= 1) {
      stage = tweenTo;
      tweening = false;
    }
  }
  advanceSequence(now);
  syncStageUi();
}

function applyControls() {
  engine.debug.rotSpeedScale = dragging ? 0 : rotAutoEl.checked ? 1 : 0;
  engine.debug.surface = sandSurfaceEl.checked ? "sand" : "ink";
  document.body.classList.toggle("surface-sand", sandSurfaceEl.checked);

  const bright = Number(brightEl.value);
  brightVal.textContent = `${bright.toFixed(2)}x`;
  engine.debug.brightBoost = bright;

  const animateOn = animateEl.checked;
  durationVal.textContent = `${Number(durationEl.value).toFixed(1)}s`;
  durationEl.disabled = !animateOn;
  animateWrap.classList.toggle("is-off", !animateOn);

  const agentsOn = overlayAgentsEl.checked;
  const satCount = Math.max(4, Math.min(30, Math.round(Number(satellitesEl.value) || 28)));
  engine.debug.satelliteCount = satCount;
  satVal.textContent = String(satCount);
  satellitesEl.disabled = !agentsOn;
  agentWrap.classList.toggle("is-off", !agentsOn);

  const labelsOn = showLabelsEl.checked;
  engine.debug.showLabels = labelsOn;
  const density = Math.max(1, Math.min(4, Math.round(Number(labelDensityEl.value) || 2)));
  engine.debug.labelDensity = density;
  labelDensityVal.textContent = `${density}×`;
  labelDensityEl.disabled = !labelsOn;
  labelDensityWrap.classList.toggle("is-off", !labelsOn);

  const meteorsOn = overlayMeteorsEl.checked;
  const meteorDensity = Math.max(1, Math.min(4, Math.round(Number(meteorDensityEl.value) || 2)));
  engine.debug.meteorDensity = meteorDensity;
  meteorDensityVal.textContent = `${meteorDensity}×`;
  meteorDensityEl.disabled = !meteorsOn;
  meteorWrap.classList.toggle("is-off", !meteorsOn);

  engine.debug.overlays = {
    meteors: meteorsOn,
    connections: overlayConnectionsEl.checked,
    agents: agentsOn,
  };

  const raw = Number(particlesEl.value);
  if (Number.isFinite(raw)) {
    const count = Math.round(raw);
    if (count >= 800 && count <= 5000 && count !== lastParticleCount) {
      engine.rebuild(count);
      lastParticleCount = count;
    }
  }
}

function setLivePaused(on: boolean) {
  livePaused = on;
  if (pauseLiveEl) {
    pauseLiveEl.setAttribute("aria-pressed", on ? "true" : "false");
    pauseLiveEl.textContent = on ? "Resume" : "Pause";
  }
  if (on) {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    engine.debug.rotSpeedScale = 0;
    applyControls();
    engine.debug.rotSpeedScale = 0;
    engine.frame(performance.now(), { stage });
    setMeta("paused · rotation, labels, satellites, and meteors frozen");
    return;
  }
  start();
}

function tick(now: number) {
  if (capturing || livePaused) return;
  try {
    resize();
    applyTweens(now);
    applyControls();
    engine.frame(now, { stage });

    const seqLabel =
      sequencing && sequenceIndex >= 0
        ? ` · seq ${SEQUENCE[sequenceIndex]!.label}`
        : "";
    const tweenLabel = tweening ? ` · → ${tweenTo.toFixed(2)}` : "";
    const animLabel = animateEl.checked ? "anim on" : "anim off";
    const on = [
      overlayMeteorsEl.checked && "meteors",
      overlayConnectionsEl.checked && "links",
      overlayAgentsEl.checked && "agents",
    ].filter(Boolean);
    const overlayLabel = on.length ? on.join("+") : "none";
    setMeta(
      `live frame() · stage ${stage.toFixed(2)}${tweenLabel}${seqLabel} · ${animLabel} · overlay ${overlayLabel} · rot ${rotAutoEl.checked ? "on" : "off"} · ${sandSurfaceEl.checked ? "sand" : "ink"}`,
    );
  } catch (err) {
    console.error(err);
    setMeta(err instanceof Error ? err.message : String(err), true);
  }
  raf = requestAnimationFrame(tick);
}

function start() {
  if (capturing) return;
  if (raf) cancelAnimationFrame(raf);
  try {
    resize();
    applyControls();
    syncStageUi();
  } catch (err) {
    console.error(err);
    setMeta(err instanceof Error ? err.message : String(err), true);
    return;
  }
  // Paint immediately; tick() schedules the next rAF itself.
  tick(performance.now());
}

presetEl.addEventListener("change", () => {
  if (presetEl.value === "custom") return;
  stopSequence();
  beginTween(Number(presetEl.value));
});

stageEl.addEventListener("input", () => {
  stopSequence();
  presetEl.value = "custom";
  const v = Number(stageEl.value);
  // Scrub snaps; Shift + animate-on tweens toward the scrub value
  if (shiftHeld && animateEl.checked) {
    beginTween(v);
  } else {
    tweening = false;
    stage = v;
    syncStageUi();
  }
});

animateEl.addEventListener("change", () => {
  if (!animateEl.checked && tweening) {
    tweening = false;
    stage = tweenTo;
    syncStageUi();
  }
  durationEl.disabled = !animateEl.checked;
  animateWrap.classList.toggle("is-off", !animateEl.checked);
});

overlayAgentsEl.addEventListener("change", () => {
  if (overlayAgentsEl.checked) {
    void engine.preloadAgentIcons(AGENT_ICONS);
  }
});

playEl.addEventListener("click", () => {
  if (livePaused) setLivePaused(false);
  if (sequencing) stopSequence();
  else startSequence();
});

pauseLiveEl?.addEventListener("click", () => setLivePaused(!livePaused));

window.addEventListener("keydown", (e) => {
  if (e.key !== "p" && e.key !== "P") return;
  if ((e.target as HTMLElement | null)?.closest("input, select, textarea")) return;
  e.preventDefault();
  setLivePaused(!livePaused);
});

durationEl.addEventListener("input", () => {
  durationVal.textContent = `${Number(durationEl.value).toFixed(1)}s`;
});

particlesEl.addEventListener("change", () => {
  const n = Math.round(Number(particlesEl.value));
  const clamped = Number.isFinite(n) ? Math.max(800, Math.min(5000, n)) : 3500;
  particlesEl.value = String(clamped);
});

canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  dragging = true;
  lastPointerX = e.clientX;
  canvas.classList.add("is-dragging");
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastPointerX;
  lastPointerX = e.clientX;
  // Horizontal drag only — yaw around Y. Content follows the pointer.
  engine.rot += (dx / Math.max(1, engine.W)) * Math.PI * 0.8;
});

function endDrag(e: PointerEvent) {
  if (!dragging) return;
  dragging = false;
  canvas.classList.remove("is-dragging");
  if (canvas.hasPointerCapture(e.pointerId)) {
    canvas.releasePointerCapture(e.pointerId);
  }
}

canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

window.addEventListener("resize", resize);

try {
  void engine.preloadAgentIcons(AGENT_ICONS).then(() => start());
  start();
} catch (err) {
  console.error(err);
  setMeta(err instanceof Error ? err.message : String(err), true);
}
