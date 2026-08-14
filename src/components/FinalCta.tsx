import { useEffect, useRef } from "react";
import { CALENDLY_URL, CONTACT_MAIL, finalCta } from "../data/copy";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: {
        url: string;
        parentElement: HTMLElement;
      }) => void;
    };
  }
}

function loadCalendlyScript(): Promise<void> {
  if (window.Calendly) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(
    'script[src="https://assets.calendly.com/assets/external/widget.js"]',
  );
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      if (window.Calendly) resolve();
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Calendly script failed to load"));
    document.body.appendChild(script);
  });
}

export function FinalCta() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let cancelled = false;

    void loadCalendlyScript().then(() => {
      if (cancelled || !mountRef.current || !window.Calendly) return;
      if (mountRef.current.querySelector("iframe")) return;
      window.Calendly.initInlineWidget({
        url: CALENDLY_URL,
        parentElement: mountRef.current,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className="section section-ink final-cta"
      id="demo"
      aria-labelledby="final-title"
    >
      <div className="wrap">
        <p className="eyebrow">See it live</p>
        <h2 className="section-title" id="final-title">
          See what Tacit would <em className="hl">capture</em> from your last 30
          days.
        </h2>
        <p className="section-lead">{finalCta.lead}</p>
        <p className="final-note">{finalCta.note}</p>

        <div className="calendly-wrapper">
          <div
            ref={mountRef}
            className="calendly-inline-widget"
            aria-label="Schedule a demo"
          />
        </div>

        <p className="final-questions">
          {finalCta.questions}
          <a href={CONTACT_MAIL}>{finalCta.email}</a>
        </p>
      </div>
    </section>
  );
}
