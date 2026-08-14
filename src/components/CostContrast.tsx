import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { cost, DEMO_URL } from "../data/copy";

export function CostContrast() {
  return (
    <section className="section" aria-labelledby="cost-title">
      <div className="wrap">
        <p className="eyebrow">{cost.eyebrow}</p>
        <h2 className="section-title" id="cost-title">
          Your best employee just <em className="hl">resigned</em>. Now what?
        </h2>
        <p className="section-lead">{cost.lead}</p>
        <div className="cost-split">
          <div className="cost-col cost-col--bad">
            <h3>
              <span className="cost-col-icon" aria-hidden="true">
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={18}
                  color="currentColor"
                  strokeWidth={2}
                />
              </span>
              {cost.without.title}
            </h3>
            <p>{cost.without.body}</p>
          </div>
          <div className="cost-col cost-col--good">
            <h3>
              <span className="cost-col-icon" aria-hidden="true">
                <HugeiconsIcon
                  icon={Tick02Icon}
                  size={18}
                  color="currentColor"
                  strokeWidth={2}
                />
              </span>
              {cost.withTacit.title}
            </h3>
            <p>{cost.withTacit.body}</p>
          </div>
        </div>
        <p className="section-action">
          <a className="btn btn-primary" href={DEMO_URL}>
            Stop losing knowledge →
          </a>
        </p>
      </div>
    </section>
  );
}
