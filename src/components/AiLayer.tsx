import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  ChartNetworkIcon,
  Plug01Icon,
  BotIcon,
  SparklesIcon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import { aiLayer } from "../data/copy";
import { InstrumentBackdrop } from "./InstrumentBackdrop";

const ICONS = {
  mcp: Plug01Icon,
  train: BotIcon,
  fuel: SparklesIcon,
  graph: ChartNetworkIcon,
  delegate: AiBrain01Icon,
  hitl: UserCheck01Icon,
} as const;

type AiIcon = keyof typeof ICONS;

const ALL_POINTS = [...aiLayer.connect.items, ...aiLayer.unlock.items];

function PointCard({
  icon,
  title,
  body,
}: {
  icon: AiIcon;
  title: string;
  body: string;
}) {
  return (
    <li className="ai-point">
      <span className="ai-point-icon" aria-hidden="true">
        <HugeiconsIcon
          icon={ICONS[icon]}
          size={22}
          color="#18232E"
          strokeWidth={1.75}
        />
      </span>
      <h3>{title}</h3>
      <p>{body}</p>
    </li>
  );
}

export function AiLayer() {
  return (
    <section
      className="section section-ink ai-section"
      id="for-ai"
      aria-labelledby="ai-title"
    >
      <InstrumentBackdrop />
      <div className="wrap ai-content">
        <div className="ai-intro">
          <p className="eyebrow">{aiLayer.eyebrow}</p>
          <h2 className="section-title" id="ai-title">
            The <em className="hl">unconscious layer</em> of your AI agents.
          </h2>
          <p className="section-lead">{aiLayer.lead}</p>
        </div>

        <ul className="ai-points">
          {ALL_POINTS.map((point) => (
            <PointCard
              key={point.title}
              icon={point.icon as AiIcon}
              title={point.title}
              body={point.body}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
