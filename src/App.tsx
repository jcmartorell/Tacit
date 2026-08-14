import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { CaptureFeed } from "./components/CaptureFeed";
import { CostContrast } from "./components/CostContrast";
import { HowItWorks } from "./components/HowItWorks";
import { CaptureCategories } from "./components/CaptureCategories";
import { DayZero } from "./components/DayZero";
import { AiLayer } from "./components/AiLayer";
import { Comparison } from "./components/Comparison";
import { Testimonials } from "./components/Testimonials";
import { FounderQuote } from "./components/FounderQuote";
import { FinalCta } from "./components/FinalCta";
import { Footer } from "./components/Footer";
import "./components/sections.css";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <CaptureFeed />
        <CostContrast />
        <HowItWorks />
        <CaptureCategories />
        <DayZero />
        <AiLayer />
        <Comparison />
        <Testimonials />
        <FounderQuote />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
