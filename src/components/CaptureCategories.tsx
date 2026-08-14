import { categories } from "../data/copy";

export function CaptureCategories() {
  return (
    <section className="section" aria-labelledby="categories-title">
      <div className="wrap">
        <p className="eyebrow">{categories.eyebrow}</p>
        <h2 className="section-title" id="categories-title">
          <em className="hl">Judgment</em> proved in the field. Not mission
          statements.
        </h2>
        <div className="category-list">
          {categories.items.map((item) => (
            <figure className="category" key={item.title}>
              <blockquote>{item.quote}</blockquote>
              <figcaption>{item.title}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
