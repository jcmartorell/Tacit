import { useEffect, useRef } from "react";
import {
  BotIcon,
  ChatGptIcon,
  ClaudeIcon,
} from "@hugeicons/core-free-icons";
import { KnowledgeInstrument } from "../lib/knowledgeInstrument";
import { hugeiconToDataUrl } from "../lib/hugeiconSvg";

const STATIC_ROT = 1.12;

const AGENT_ICONS = {
  claude: hugeiconToDataUrl(ClaudeIcon, "#D97757"),
  chatgpt: hugeiconToDataUrl(ChatGptIcon, "#10A37F"),
  agents: hugeiconToDataUrl(BotIcon, "#1A9E78"),
};

function particleBudget() {
  if (typeof window === "undefined") return 1600;
  const w = window.innerWidth;
  if (w < 640) return 900;
  if (w < 1024) return 1400;
  return 2400;
}

/**
 * Animated knowledge sphere with up to five agents (from Claude / ChatGPT /
 * Your agents) that connect at random, pull knowledge, disconnect, and return.
 * Pauses off-screen; respects reduced motion.
 */
export function InstrumentBackdrop() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const engine = new KnowledgeInstrument(canvas);
    let lastRebuildW = window.innerWidth;
    let cancelled = false;
    let raf = 0;
    let visible = true;
    let iconsReady = false;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const paintFrame = (timeMs = 0) => {
      if (cancelled) return;
      engine.resize(host.clientWidth, host.clientHeight);
      engine.paintAgentsBackdrop(STATIC_ROT, reduceMotion ? 0 : timeMs);
    };

    const tick = (now: number) => {
      if (cancelled) return;
      if (visible && iconsReady) paintFrame(now);
      if (!reduceMotion) raf = requestAnimationFrame(tick);
    };

    engine.rebuild(particleBudget());
    void engine.preloadAgentIcons(AGENT_ICONS).then(() => {
      if (cancelled) return;
      iconsReady = true;
      paintFrame(performance.now());
      if (!reduceMotion && !raf) raf = requestAnimationFrame(tick);
    });
    paintFrame(0);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
      },
      { rootMargin: "80px", threshold: 0.02 },
    );
    io.observe(host);

    const ro = new ResizeObserver(() => {
      if (reduceMotion || !visible) paintFrame(performance.now());
    });
    ro.observe(host);

    const onResizeRebuild = () => {
      if (Math.abs(window.innerWidth - lastRebuildW) < 80) return;
      lastRebuildW = window.innerWidth;
      engine.rebuild(particleBudget());
      paintFrame(performance.now());
    };

    window.addEventListener("resize", onResizeRebuild);

    if (!reduceMotion) raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", onResizeRebuild);
    };
  }, []);

  return (
    <div className="instrument-backdrop" ref={hostRef} aria-hidden="true">
      <canvas ref={canvasRef} className="instrument-backdrop-canvas" />
      <div className="instrument-backdrop-veil" />
    </div>
  );
}
