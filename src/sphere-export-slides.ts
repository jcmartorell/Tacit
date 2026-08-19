/**
 * Slides-only sphere still contact sheet / Playwright export source.
 * Uses knowledgeInstrument.slides (fork) — does not affect the live marketing site.
 */
import {
  BotIcon,
  ChatGptIcon,
  ClaudeIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { KnowledgeInstrument } from "./lib/knowledgeInstrument.slides";
import { hugeiconToDataUrl } from "./lib/hugeiconSvg";

const params = new URLSearchParams(location.search);
const SIZE = Math.max(540, Number(params.get("size")) || 2160);
const DPR = Math.max(1, Number(params.get("dpr")) || 2);
const ONLY = params.get("only");
const PARTICLES = 4200;
const ROT = 1.08;

const AGENT_ICONS = {
  team: hugeiconToDataUrl(UserMultipleIcon, "#F4EFE6"),
  people: hugeiconToDataUrl(UserMultipleIcon, "#FFFFFF"),
  claude: hugeiconToDataUrl(ClaudeIcon, "#D97757"),
  chatgpt: hugeiconToDataUrl(ChatGptIcon, "#10A37F"),
  agents: hugeiconToDataUrl(BotIcon, "#1A9E78"),
};

type FrameSpec = {
  id: string;
  label: string;
  mode:
    | "stage"
    | "labeled"
    | "unified"
    | "agents"
    | "cover"
    | "meridians"
    | "meteors"
    | "connections";
  stage?: number;
  /** 16:9 stills for full-bleed / cover-hero deck backgrounds. */
  wide?: boolean;
  count?: number;
};

/** Still frames for VC / speaker decks. */
const FRAMES: FrameSpec[] = [
  { id: "exploded", label: "Fig. — Scattered know-how", mode: "stage", stage: 0.85 },
  { id: "exploded-wide", label: "Fig. — Scattered know-how 16:9", mode: "stage", stage: 0.85, wide: true },
  { id: "exploded-labeled", label: "Fig. — Scattered + KO labels", mode: "labeled", stage: 0.85, wide: true, count: 11 },
  { id: "ordered", label: "Fig. — Delegate the right things", mode: "stage", stage: 1.9 },
  { id: "meridians", label: "Fig. — Ordered shell / meridians", mode: "meridians" },
  { id: "meteors", label: "Fig. — Capture meteors", mode: "meteors" },
  { id: "domains", label: "Fig. — Domains / segments", mode: "stage", stage: 3.1 },
  { id: "linked", label: "Fig. — Related knowledge linked", mode: "stage", stage: 3.92 },
  { id: "connections", label: "Fig. — Bright connections", mode: "connections" },
  { id: "dayzero", label: "Fig. — Day one context", mode: "stage", stage: 4.85 },
  { id: "unified", label: "Fig. — Knowledge sphere", mode: "unified" },
  { id: "agents", label: "Fig. — Agents on the Company Brain", mode: "agents" },
  { id: "agents-cover", label: "Fig. — Cover / Horizon · orbiting agents", mode: "cover" },
];

const hostEl = document.getElementById("frames");
if (!hostEl) throw new Error("#frames missing");
const host = hostEl;

declare global {
  interface Window {
    __SPHERE_FRAMES__?: { id: string; dataUrl: string }[];
    __SPHERE_READY__?: boolean;
  }
}

async function main() {
  const exports: { id: string; dataUrl: string }[] = [];

  const onlyIds = ONLY
    ? new Set(ONLY.split(",").map((s) => s.trim()).filter(Boolean))
    : null;
  const queue = onlyIds ? FRAMES.filter((f) => onlyIds.has(f.id)) : FRAMES;
  if (ONLY && !queue.length) throw new Error(`Unknown frame id: ${ONLY}`);

  for (const spec of queue) {
    const wrap = document.createElement("div");
    wrap.className = "frame";
    wrap.dataset.id = spec.id;

    const canvas = document.createElement("canvas");
    canvas.style.width = "280px";
    canvas.style.height = "280px";

    const caption = document.createElement("span");
    caption.textContent = `${spec.id} · ${spec.label}`;

    wrap.append(canvas, caption);
    host.append(wrap);

    const engine = new KnowledgeInstrument(canvas);
    const w = spec.wide ? Math.round((SIZE * 16) / 9) : SIZE;
    const h = SIZE;
    if (spec.wide) {
      canvas.style.width = "498px";
      canvas.style.height = "280px";
    }
    engine.resize(w, h, DPR);
    engine.rebuild(PARTICLES);

    if (spec.mode === "agents" || spec.mode === "cover") {
      await engine.preloadAgentIcons(AGENT_ICONS);
      engine.debug.satelliteCount = spec.mode === "cover" ? 28 : 20;
      if (spec.mode === "cover") engine.paintCoverAgents(ROT);
      else engine.paintAgentsBackdrop(ROT, 0);
    } else if (spec.mode === "unified") {
      engine.paintUnifiedSphere(ROT);
    } else if (spec.mode === "meridians") {
      engine.paintMeridiansSphere(ROT);
    } else if (spec.mode === "meteors") {
      engine.paintMeteorsSphere(ROT, 0);
    } else if (spec.mode === "connections") {
      engine.paintConnectionsSphere(ROT);
    } else if (spec.mode === "labeled") {
      engine.paintLabeledStatic(spec.stage ?? 0.85, ROT, spec.count ?? 11);
    } else {
      engine.paintStatic(spec.stage ?? 0, ROT);
    }

    exports.push({ id: spec.id, dataUrl: canvas.toDataURL("image/png") });
    canvas.width = 1;
    canvas.height = 1;
  }

  window.__SPHERE_FRAMES__ = exports;
  window.__SPHERE_READY__ = true;
}

void main();
