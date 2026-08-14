import { KnowledgeInstrument } from "./lib/knowledgeInstrument";

const SIZE = 1080;
const PARTICLES = 4200;
const ROT = 1.08;

type FrameSpec = {
  id: string;
  label: string;
  mode: "stage" | "unified";
  stage?: number;
};

/** Still frames matching marketing canvas beats / layout keys. */
const FRAMES: FrameSpec[] = [
  { id: "exploded", label: "Fig. — Scattered know-how", mode: "stage", stage: 0.85 },
  { id: "ordered", label: "Fig. — Tacit finds order", mode: "stage", stage: 2.12 },
  { id: "domains", label: "Fig. — Domains / segments", mode: "stage", stage: 3.1 },
  { id: "linked", label: "Fig. — Related knowledge linked", mode: "stage", stage: 3.55 },
  { id: "dayzero", label: "Fig. — Day one context", mode: "stage", stage: 4.85 },
  { id: "unified", label: "Fig. — Knowledge sphere", mode: "unified" },
];

const host = document.getElementById("frames");
if (!host) throw new Error("#frames missing");

const exports: { id: string; dataUrl: string }[] = [];

for (const spec of FRAMES) {
  const wrap = document.createElement("div");
  wrap.className = "frame";
  wrap.dataset.id = spec.id;

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  canvas.style.width = `${SIZE}px`;
  canvas.style.height = `${SIZE}px`;

  const caption = document.createElement("span");
  caption.textContent = `${spec.id} · ${spec.label}`;

  wrap.append(canvas, caption);
  host.append(wrap);

  const engine = new KnowledgeInstrument(canvas);
  engine.resize(SIZE, SIZE);
  engine.rebuild(PARTICLES);

  if (spec.mode === "unified") {
    engine.paintUnifiedSphere(ROT);
  } else {
    engine.paintStatic(spec.stage ?? 0, ROT);
  }

  exports.push({ id: spec.id, dataUrl: canvas.toDataURL("image/png") });
}

declare global {
  interface Window {
    __SPHERE_FRAMES__?: { id: string; dataUrl: string }[];
    __SPHERE_READY__?: boolean;
  }
}

window.__SPHERE_FRAMES__ = exports;
window.__SPHERE_READY__ = true;
