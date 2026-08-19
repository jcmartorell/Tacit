import { feedCaptures } from "../data/copy";

export function CaptureFeed() {
  return (
    <section className="section feed" id="captures" aria-labelledby="feed-title">
      <div className="wrap">
        <p className="eyebrow">Knowledge captured today</p>
        <h2 className="section-title" id="feed-title">
          What <em className="hl">living knowledge</em> looks like.
        </h2>
        <p className="section-lead">
          Live from the tools your team already uses. Zero manual actions.
        </p>
        <div className="feed-track">
          {feedCaptures.map((c) => (
            <article className="capture-card" key={`${c.person}-${c.source}`}>
              <p className="capture-card-meta">
                <span>{c.source}</span>
                <span>{c.domain}</span>
              </p>
              <p className="capture-card-body">{c.body}</p>
              <p className="capture-card-person">
                {c.person} · {c.role}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
