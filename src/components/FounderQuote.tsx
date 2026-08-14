import { founder } from "../data/copy";

export function FounderQuote() {
  return (
    <section className="section section-ink" aria-labelledby="founder-title">
      <div className="wrap founder">
        <p className="eyebrow" id="founder-title">
          From the founder
        </p>
        <blockquote>
          “Documented knowledge gives a company guidelines and direction. But{" "}
          <strong>tacit knowledge</strong> is the foundation of its{" "}
          <strong>identity, character and intelligence</strong>. A company
          cannot survive without it. In the AI paradigm, having this knowledge{" "}
          <strong>stops being optional</strong>. It becomes the condition for
          which companies <strong>survive this shift</strong>, and which
          don't.”
        </blockquote>
        <cite>
          {founder.name}
          <span>{founder.role}</span>
        </cite>
      </div>
    </section>
  );
}
