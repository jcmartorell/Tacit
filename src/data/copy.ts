/** In-page Calendly target — same event as tacit.guru. */
export const DEMO_URL = "#demo";

export const CALENDLY_URL =
  "https://calendly.com/jcmartorell-gplatino/tacit-demo?hide_gdpr_banner=1&background_color=ffffff&text_color=18232E&primary_color=1A9E78";

export const CONTACT_MAIL = "mailto:sales@tacit.guru";

export const site = {
  tagline: "The knowledge behind the work.",
  hero: "Your team's best thinking, preserved forever.",
  heroSupport:
    "Every employee builds years of knowledge that never gets written down. It disappears when they leave. Tacit captures it automatically from Gmail, Slack, Microsoft 365 and Zoom. Zero effort.",
  meta: "Capture knowledge from the tools your team already uses. Don't lose what was never written.",
  ctaPrimary: "Book a 30-min demo",
  ctaSecondary: "See what we capture",
  pilots: "Active pilots · teams capturing knowledge every week",
  integrations:
    "Gmail · Drive · Microsoft 365 · Slack · Zoom · ChatGPT · Claude · more",
};

export type CaptureCard = {
  source: string;
  domain: string;
  body: string;
  person: string;
  role: string;
};

export const feedCaptures: CaptureCard[] = [
  {
    source: "Slack #sales",
    domain: "Sales · Closing",
    body: "When a prospect goes dark after the Zoom demo, send a 90-second Loom recap, not a follow-up email. Reply rate jumps from 12% to 58%. Tag the champion, not the DM.",
    person: "Ana G.",
    role: "Sales Lead",
  },
  {
    source: "Teams · Sales channel",
    domain: "Sales · Discovery calls",
    body: 'On Teams calls, share screen in "Window" mode, not "Desktop". It hides your other tabs and makes you look 10× more prepared. Start recording only after pleasantries.',
    person: "Luis R.",
    role: "Account Executive",
  },
  {
    source: "Slack #deals",
    domain: "Sales · Zoom demos",
    body: "Never demo with default Zoom background. It turns off enterprise buyers. Real environment or blurred. Mute all Slack notifications before screen sharing.",
    person: "Marco V.",
    role: "Senior AE",
  },
  {
    source: "Slack #ops",
    domain: "Workflow · Contract close",
    body: 'Paste the DocuSign link in a Slack DM to the CFO with a 2-line summary of what they\'re signing. Eliminates the "I need to review with legal" delay. Saves 3–5 days per deal.',
    person: "María F.",
    role: "Sales Manager",
  },
];

/** Pain + cost in one section (without vs with). */
export const cost = {
  eyebrow: "What gets lost",
  title: "Your best employee just resigned. Now what?",
  lead: "Five years of client context and hard-won judgment walk out in two weeks. A rushed handoff doc rarely survives the first month.",
  without: {
    title: "Without Tacit",
    body: "Exit interviews and a Notion page nobody updates. The next hire relearns which buyers ghost, which formulas break, which CFO needs two lines, then stores it only in their head again.",
  },
  withTacit: {
    title: "With Tacit",
    body: "Day one, they open a living guide built from what the previous person actually did in Slack, email, and meetings: searchable and ready to run.",
  },
};

export const howItWorks = {
  eyebrow: "How it works",
  title: "No new habits. No empty wiki.",
  steps: [
    {
      n: "01",
      title: "Connect the tools you already use",
      body: "Gmail, Drive, Slack, Microsoft 365, Zoom. About five minutes.",
    },
    {
      n: "02",
      title: "Tacit captures what people actually learn",
      body: "Tactics, exceptions, and decisions from work itself, not forms.",
    },
    {
      n: "03",
      title: "Hand it to the next person ready",
      body: "Structured so a new hire can act without chasing the veteran who left.",
    },
  ],
};

export const categories = {
  eyebrow: "What gets captured",
  title: "Judgment proved in the field. Not mission statements.",
  items: [
    {
      title: "Client negotiation",
      quote:
        '"Enterprise buyers always bring procurement on call 3. Prepare TCO data before, not after."',
    },
    {
      title: "Workflow shortcuts",
      quote:
        "\"Paste DocuSign link in a Slack DM to the CFO with a 2-line summary. It eliminates the 'review with legal' delay every time.\"",
    },
    {
      title: "Decisions & reasoning",
      quote:
        '"We dropped weekly reports. Clients stop reading after week 3. Monthly + exceptions only."',
    },
  ],
};

export const dayZero = {
  eyebrow: "The payoff",
  title: "New hire. Day one. Full context.",
  lead: "A living guide from what their predecessor actually did, not a six-month scavenger hunt.",
  guide: {
    name: "Sofia Martínez",
    role: "Account Manager · Joined today",
    items: [
      {
        title: "How to approach SaaS enterprise prospects",
        meta: "14 tactics from 3 senior reps",
        tag: "Sales · Negotiation",
      },
      {
        title: "Follow-up timing per industry",
        meta: "retail, finance, and tech covered",
        tag: "Client management",
      },
      {
        title: "CRM shortcuts and pipeline rules",
        meta: "what the team actually does",
        tag: "Tools · Workflow",
      },
    ],
    footer: "38 knowledge items ready for your role",
  },
};

export const aiLayer = {
  eyebrow: "The vision",
  title: "A judgment layer for AI agents and employees.",
  lead: "The end goal is to build the judgment layer both AI agents and employees use — how work actually gets decided, not only what's written down. Tacit captures that unwritten know-how so people and agents can act with the same operational judgment.",
  connect: {
    label: "How you plug in",
    items: [
      {
        icon: "mcp",
        title: "Connect via MCP",
        body: "Plug Tacit into Claude or ChatGPT so answers include how your team really works, not only the wiki.",
      },
      {
        icon: "train",
        title: "Feed your own agents",
        body: "Give internal bots operational context: escalations, exceptions, and the judgment that never got documented.",
      },
      {
        icon: "fuel",
        title: "The fuel AI was missing",
        body: "Your company's unwritten know-how, captured from Slack, email, and meetings, finally usable by people and machines.",
      },
    ],
  },
  unlock: {
    label: "What that unlocks",
    items: [
      {
        icon: "graph",
        title: "A living knowledge graph",
        body: "Domains, links, and exceptions agents can navigate, not a flat dump of stale docs.",
      },
      {
        icon: "hitl",
        title: "Human-in-the-loop, by design",
        body: "Tacit doesn't replace your team. It gives agents context so humans keep control of the decisions that matter.",
      },
    ],
  },
};

export const comparison = {
  eyebrow: "Why Tacit",
  title: "Other tools wait for someone to write it down.",
  items: [
    {
      icon: "effort",
      label: "What people do",
      traditional: "Stop work and update a wiki.",
      tacit: "Nothing new. Slack, email, meetings as usual.",
    },
    {
      icon: "timing",
      label: "When it's saved",
      traditional: "Only if someone documents it.",
      tacit: "As work happens, from the tools themselves.",
    },
    {
      icon: "home",
      label: "Where it lives",
      traditional: "Scattered across DMs, drives, and private notes.",
      tacit: "One searchable layer the whole company can use.",
    },
    {
      icon: "hire",
      label: "Day one for a hire",
      traditional: "Stale docs and people to chase.",
      tacit: "A role-ready guide from what the last person did.",
    },
    {
      icon: "ai",
      label: "What your AI knows",
      traditional: "Only what's already written in docs.",
      tacit: "The playbook people actually run, via MCP or your agents.",
    },
  ],
};

export const testimonials = {
  eyebrow: "Early pilots",
  title: "What teams tell us in the first 30 days.",
  items: [
    {
      quote:
        "We connected Slack and Gmail on a Friday. By Monday, 340 knowledge items were captured: things our team had done for years and never wrote down.",
      name: "Ricardo M.",
      role: "CEO · Professional services · Pilot",
    },
    {
      quote:
        "My concern was privacy. After two weeks I stopped thinking about it. The knowledge just accumulates.",
      name: "Carmen L.",
      role: "COO · Logistics · Pilot",
    },
    {
      quote:
        "I searched 'payment exceptions' and got 12 approaches my team built over 3 years. I didn't know half of them existed.",
      name: "Alejandro V.",
      role: "VP Operations · B2B SaaS · Pilot",
    },
  ],
};

export const founder = {
  quote:
    "Documented knowledge gives a company guidelines and direction. But tacit knowledge is the foundation of its identity, character and intelligence. A company cannot survive without it. In the AI paradigm, having this knowledge stops being optional. It becomes the condition for which companies survive this shift, and which don't.",
  name: "Juan Carlos Martorell",
  role: "Founder & CEO · Tacit · MBA IPADE · MSc Neuroscience & AI",
};

export const finalCta = {
  title: "See what Tacit would capture from your last 30 days.",
  lead: "30 minutes. We connect one tool live and show the knowledge already flowing through your work.",
  note: "In pilots, unwritten know-how surfaces within days of connecting Slack or email.",
  questions: "Questions first?",
  email: "sales@tacit.guru",
};
