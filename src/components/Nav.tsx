import { useEffect, useState } from "react";
import { DEMO_URL, site } from "../data/copy";
import "./Nav.css";

function sectionUnderNavIsDark() {
  const probeY = 56;
  const darkSections = document.querySelectorAll<HTMLElement>(
    "#top, #for-ai, .section-ink, .ai-section",
  );

  for (const section of darkSections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= probeY && rect.bottom > probeY) return true;
  }
  return false;
}

export function Nav() {
  const [onSand, setOnSand] = useState(false);

  useEffect(() => {
    const update = () => {
      setOnSand(!sectionUnderNavIsDark());
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <header className={`nav ${onSand ? "nav-on-sand" : "nav-on-ink"}`}>
      <div className="wrap">
        <div className="nav-shell">
          <a className="nav-brand" href="#top" aria-label="Tacit home">
            <img src="/tacit-mark.svg" alt="" width={28} height={28} />
            <span>Tacit</span>
          </a>
          <nav className="nav-links" aria-label="Primary">
            <a href="#captures">What is captured</a>
            <a href="#how-it-works">How it works</a>
            <a href="#for-ai">For AI</a>
            <a href="#compare">Why Tacit</a>
          </nav>
          <a className="btn btn-primary nav-cta" href={DEMO_URL}>
            {site.ctaPrimary}
          </a>
        </div>
      </div>
    </header>
  );
}
