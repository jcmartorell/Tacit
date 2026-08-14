import type { CaptureCard } from "./copy";

export type SphereCluster = {
  id: string;
  label: string;
  color: string;
  captures: CaptureCard[];
};

export const clusters: SphereCluster[] = [
  {
    id: "negotiation",
    label: "Sales · Closing",
    color: "#1A9E78",
    captures: [
      {
        source: "Slack #sales",
        domain: "Sales · Closing",
        body: "When a prospect goes dark after the Zoom demo, send a 90-second Loom recap, not a follow-up email. Tag the champion, not the DM.",
        person: "Ana G.",
        role: "Sales Lead",
      },
      {
        source: "Gmail",
        domain: "Sales · Negotiation",
        body: "Enterprise buyers always bring procurement on call 3. Prepare TCO data before, not after.",
        person: "Marco V.",
        role: "Senior AE",
      },
    ],
  },
  {
    id: "followups",
    label: "Follow-ups",
    color: "#4BA3C3",
    captures: [
      {
        source: "Slack #deals",
        domain: "Client management",
        body: "Retail clients: follow up Tuesday 10am. Never call on quarter-close weeks.",
        person: "Luis R.",
        role: "Account Executive",
      },
      {
        source: "Outlook",
        domain: "Follow-up sequences",
        body: "Paste the DocuSign link in a Slack DM to the CFO with a 2-line summary. Saves 3–5 days per deal.",
        person: "María F.",
        role: "Sales Manager",
      },
    ],
  },
  {
    id: "workflows",
    label: "Workflows",
    color: "#7BC47F",
    captures: [
      {
        source: "Teams",
        domain: "Tools · Workflow",
        body: 'Share screen in "Window" mode, not "Desktop". Start recording only after pleasantries.',
        person: "Luis R.",
        role: "Account Executive",
      },
      {
        source: "Slack #ops",
        domain: "Workflow efficiencies",
        body: "Mute all Slack notifications before screen sharing or clients see your DMs scrolling.",
        person: "Marco V.",
        role: "Senior AE",
      },
    ],
  },
  {
    id: "data",
    label: "Excel & data",
    color: "#C4A35A",
    captures: [
      {
        source: "Drive",
        domain: "Excel & data structures",
        body: "XLOOKUP with IFERROR on the supplier table. VLOOKUP breaks silently when columns are reordered.",
        person: "Elena P.",
        role: "Ops Analyst",
      },
    ],
  },
  {
    id: "systems",
    label: "Systems",
    color: "#8A9BA8",
    captures: [
      {
        source: "Slack #eng",
        domain: "System & tool knowledge",
        body: "The Stripe webhook retry loop triggers duplicates. Check idempotency key first always.",
        person: "Diego S.",
        role: "Engineer",
      },
    ],
  },
  {
    id: "decisions",
    label: "Decisions",
    color: "#6B8F71",
    captures: [
      {
        source: "Zoom",
        domain: "Decisions & reasoning",
        body: "We dropped weekly reports. Clients stop reading after week 3. Monthly + exceptions only.",
        person: "Carmen L.",
        role: "COO",
      },
      {
        source: "Notion export",
        domain: "Decisions",
        body: "Never demo with default Zoom background. It turns off enterprise buyers.",
        person: "Ana G.",
        role: "Sales Lead",
      },
    ],
  },
];

export const NODES_PER_CLUSTER = 18;
