import { dayZero, DEMO_URL } from "../data/copy";

export function DayZero() {
  const { guide } = dayZero;
  return (
    <section className="section" aria-labelledby="dayzero-title">
      <div className="wrap grid-2">
        <div>
          <p className="eyebrow">{dayZero.eyebrow}</p>
          <h2 className="section-title" id="dayzero-title">
            New hire. <em className="hl">Day one.</em> Full context.
          </h2>
          <p className="section-lead">{dayZero.lead}</p>
          <p className="section-action">
            <a className="btn btn-primary" href={DEMO_URL}>
              Book a demo →
            </a>
          </p>
        </div>
        <div className="dayzero-panel">
          <div className="dayzero-person">
            <div className="dayzero-avatar" aria-hidden="true">
              S
            </div>
            <div>
              <strong>{guide.name}</strong>
              <span>{guide.role}</span>
            </div>
          </div>
          <p className="eyebrow eyebrow--soft">
            Your Tacit knowledge guide
          </p>
          <ul className="dayzero-list">
            {guide.items.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <p className="meta">{item.meta}</p>
                <p className="tag">{item.tag}</p>
              </li>
            ))}
          </ul>
          <p className="dayzero-footer">{guide.footer}</p>
        </div>
      </div>
    </section>
  );
}
