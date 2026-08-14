import { howItWorks } from "../data/copy";

export function HowItWorks() {
  return (
    <section
      className="section how-section"
      id="how-it-works"
      aria-labelledby="how-title"
    >
      <div className="wrap">
        <p className="eyebrow">{howItWorks.eyebrow}</p>
        <h2 className="section-title" id="how-title">
          <em className="hl">No new habits.</em> No empty wiki.
        </h2>
        <ol className="steps">
          {howItWorks.steps.map((step) => (
            <li className="step" key={step.n}>
              <p className="step-n">{step.n}</p>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
