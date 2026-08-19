import { useEffect, useRef, useState } from "react";
import {
  KnowledgeInstrument,
  STORY_BEATS,
  beatForStage,
  beatIndexForStage,
  scrollYForBeatIndex,
  stageFromProgress,
  type StoryBeat,
} from "../lib/knowledgeInstrument";
import { DEMO_URL, site } from "../data/copy";
import "./KnowledgeSphere.css";

function particleBudget() {
  if (typeof window === "undefined") return 3200;
  const w = window.innerWidth;
  if (w < 640) return 1800;
  if (w < 1024) return 2800;
  return 4200;
}

function TitleWithHighlight({
  title,
  highlight,
}: {
  title: string;
  highlight?: string;
}) {
  if (!highlight || !title.includes(highlight)) return title;
  const [before, after] = title.split(highlight);
  return (
    <>
      {before}
      <em className="hl">{highlight}</em>
      {after}
    </>
  );
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

export function KnowledgeSphere() {
  const trackRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef({ stage: 0 });
  const [beat, setBeat] = useState<StoryBeat>(() => beatForStage(0));
  const [fadedIn, setFadedIn] = useState(false);
  const [shownBeat, setShownBeat] = useState<StoryBeat>(() => beatForStage(0));
  const [textPhase, setTextPhase] = useState<"in" | "out" | "idle">("idle");

  useEffect(() => {
    const canvas = canvasRef.current;
    const sticky = stickyRef.current;
    const track = trackRef.current;
    if (!canvas || !sticky || !track) return;

    const engine = new KnowledgeInstrument(canvas);

    const resize = () => {
      engine.resize(sticky.clientWidth, sticky.clientHeight);
    };

    engine.rebuild(particleBudget());
    resize();

    // Intro fade after first paint / particles ready
    const fadeTimer = window.setTimeout(() => setFadedIn(true), 40);

    const ro = new ResizeObserver(resize);
    ro.observe(sticky);

    let raf = 0;
    let lastBeatTitle = beat.title;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const updateScroll = () => {
      if (reduceMotion) {
        frameRef.current = { stage: 2.4 };
      } else {
        const rect = track.getBoundingClientRect();
        const total = Math.max(track.offsetHeight - window.innerHeight, 1);
        const scrolled = Math.min(Math.max(-rect.top, 0), total);
        const progress = scrolled / total;
        frameRef.current = stageFromProgress(progress);
      }

      const nextBeat = beatForStage(frameRef.current.stage);
      if (nextBeat.title !== lastBeatTitle) {
        lastBeatTitle = nextBeat.title;
        setBeat(nextBeat);
      }
    };

    const inCanvasSection = () => {
      const rect = track.getBoundingClientRect();
      return rect.top <= 8 && rect.bottom >= window.innerHeight * 0.55;
    };

    const goToBeat = (index: number) => {
      const clamped = Math.max(0, Math.min(STORY_BEATS.length - 1, index));
      const y = scrollYForBeatIndex(track, clamped);
      window.scrollTo({
        top: y,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (!inCanvasSection()) return;

      const next =
        e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown";
      const prev =
        e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp";
      if (!next && !prev) return;

      const idx = beatIndexForStage(frameRef.current.stage);

      if (next) {
        e.preventDefault();
        if (idx >= STORY_BEATS.length - 1) {
          const end =
            track.getBoundingClientRect().top +
            window.scrollY +
            track.offsetHeight -
            window.innerHeight +
            8;
          window.scrollTo({
            top: end,
            behavior: reduceMotion ? "auto" : "smooth",
          });
          return;
        }
        goToBeat(idx + 1);
        return;
      }

      e.preventDefault();
      goToBeat(idx <= 0 ? 0 : idx - 1);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      engine.frame(now, frameRef.current);
    };

    updateScroll();
    raf = requestAnimationFrame(tick);
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    const onResizeRebuild = () => {
      engine.rebuild(particleBudget());
      resize();
    };
    window.addEventListener("resize", onResizeRebuild);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fadeTimer);
      ro.disconnect();
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
      window.removeEventListener("resize", onResizeRebuild);
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Beat copy: short fade-out, then slide-up + fade-in
  useEffect(() => {
    if (beat.title === shownBeat.title) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      setShownBeat(beat);
      setTextPhase("in");
      return;
    }

    setTextPhase("out");
    const t = window.setTimeout(() => {
      setShownBeat(beat);
      setTextPhase("in");
    }, 200);
    return () => window.clearTimeout(t);
  }, [beat, shownBeat.title]);

  const showHeroCta = shownBeat.min < 1.15 || shownBeat.min >= 4.2;
  const activeSlide = Math.max(
    0,
    STORY_BEATS.findIndex((b) => b.title === beat.title),
  );

  const goToSlide = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: scrollYForBeatIndex(track, index),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <section
      ref={trackRef}
      className="instrument-track"
      id="top"
      aria-label="Knowledge sphere story. Use arrow keys or slide dots to move between slides."
    >
      <div ref={stickyRef} className="instrument-panel">
        <canvas
          ref={canvasRef}
          className={`instrument-canvas${fadedIn ? " is-visible" : ""}`}
          aria-hidden="true"
        />
        <div
          className={`instrument-veil${fadedIn ? " is-visible" : ""}`}
          aria-hidden="true"
        />
        <div className={`wrap instrument-copy${fadedIn ? " is-visible" : ""}`}>
          <div
            key={shownBeat.title}
            className={`instrument-copy-swap is-${textPhase}`}
          >
            <h1 className="instrument-title">
              <TitleWithHighlight
                title={shownBeat.title}
                highlight={shownBeat.highlight}
              />
            </h1>
            <p className="instrument-body">{shownBeat.body}</p>
            {showHeroCta && (
              <div className="instrument-cta">
                <a className="btn btn-primary" href={DEMO_URL}>
                  {site.ctaPrimary}
                </a>
                <a className="btn btn-ghost" href="#captures">
                  {site.ctaSecondary}
                </a>
              </div>
            )}
          </div>
        </div>
        <nav
          className={`instrument-dots${fadedIn ? " is-visible" : ""}`}
          aria-label="Story slides"
        >
          {STORY_BEATS.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              className={`instrument-dot${i === activeSlide ? " is-active" : ""}`}
              aria-label={`Slide ${i + 1} of ${STORY_BEATS.length}`}
              aria-current={i === activeSlide ? "true" : undefined}
              onClick={() => goToSlide(i)}
            />
          ))}
        </nav>
      </div>
    </section>
  );
}
