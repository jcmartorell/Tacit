import { testimonials } from "../data/copy";

export function Testimonials() {
  return (
    <section className="section quotes-section" aria-labelledby="testimonials-title">
      <div className="wrap">
        <p className="eyebrow">{testimonials.eyebrow}</p>
        <h2 className="section-title" id="testimonials-title">
          {testimonials.title}
        </h2>
        <div className="quotes">
          {testimonials.items.map((t) => (
            <figure className="quote-block" key={t.name}>
              <blockquote>“{t.quote}”</blockquote>
              <figcaption>
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
