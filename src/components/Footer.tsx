import { site } from "../data/copy";
import "./Footer.css";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <a className="footer-brand" href="#top">
          <img src="/tacit-mark.svg" alt="" width={22} height={22} />
          <span>Tacit</span>
        </a>
        <p className="footer-tagline">{site.tagline}</p>
        <p className="footer-meta">
          <a href="mailto:sales@tacit.guru">sales@tacit.guru</a>
          <span>·</span>
          <a href="https://app.tacit.guru">app.tacit.guru</a>
          <span>·</span>
          <span>© {year} Tacit</span>
        </p>
      </div>
    </footer>
  );
}
