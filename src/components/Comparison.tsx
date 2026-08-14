import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  BookOpen01Icon,
  Clock01Icon,
  UserAdd01Icon,
  UserEdit01Icon,
} from "@hugeicons/core-free-icons";
import { comparison } from "../data/copy";

const ICONS = {
  effort: UserEdit01Icon,
  timing: Clock01Icon,
  home: BookOpen01Icon,
  hire: UserAdd01Icon,
  ai: AiBrain01Icon,
} as const;

type ContrastIcon = keyof typeof ICONS;

export function Comparison() {
  return (
    <section className="section" id="compare" aria-labelledby="compare-title">
      <div className="wrap">
        <p className="eyebrow">{comparison.eyebrow}</p>
        <h2 className="section-title" id="compare-title">
          Other tools wait for someone to{" "}
          <em className="hl">write it down</em>.
        </h2>
        <div className="contrast-list">
          <div className="contrast-head" aria-hidden="true">
            <span className="contrast-head-icon" />
            <span />
            <span>How companies try today</span>
            <span>With Tacit</span>
          </div>
          {comparison.items.map((item) => (
            <article className="contrast-row" key={item.label}>
              <span className="contrast-icon" aria-hidden="true">
                <HugeiconsIcon
                  icon={ICONS[item.icon as ContrastIcon]}
                  size={20}
                  color="currentColor"
                  strokeWidth={1.75}
                />
              </span>
              <h3>{item.label}</h3>
              <p className="contrast-traditional">
                <span className="contrast-mobile-label">Today</span>
                {item.traditional}
              </p>
              <p className="contrast-tacit">
                <span className="contrast-mobile-label">Tacit</span>
                {item.tacit}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
