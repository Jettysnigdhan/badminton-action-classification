import dynamic from "next/dynamic";
import { IntroSequence } from "@/components/IntroSequence";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TrustBar } from "@/components/TrustBar";
import { Problem } from "@/components/Problem";
import { Solution } from "@/components/Solution";
import { Footer } from "@/components/Footer";
import { StickyCta } from "@/components/cta/StickyCta";
import { ClosingCta } from "@/components/cta/ClosingCta";

const AnimatedModelGraphs = dynamic(() =>
  import("@/components/AnimatedModelGraphs").then((m) => m.AnimatedModelGraphs)
);

// Code-split below-the-fold, interaction-heavy sections.
const SkeletonAnatomy = dynamic(() =>
  import("@/components/SkeletonAnatomy").then((m) => m.SkeletonAnatomy)
);
const DataFlow = dynamic(() =>
  import("@/components/DataFlow").then((m) => m.DataFlow)
);
const ModelArchitecture = dynamic(() =>
  import("@/components/ModelArchitecture").then((m) => m.ModelArchitecture)
);
const ClassificationShowcase = dynamic(() =>
  import("@/components/ClassificationShowcase").then((m) => m.ClassificationShowcase)
);
const Metrics = dynamic(() => import("@/components/Metrics").then((m) => m.Metrics));
const UseCases = dynamic(() => import("@/components/UseCases").then((m) => m.UseCases));
const ResearchPaper = dynamic(() =>
  import("@/components/ResearchPaper").then((m) => m.ResearchPaper)
);
const Faq = dynamic(() => import("@/components/Faq").then((m) => m.Faq));
const Demo = dynamic(() => import("@/components/Demo").then((m) => m.Demo));
const TechStack = dynamic(() =>
  import("@/components/TechStack").then((m) => m.TechStack)
);

export default function HomePage() {
  return (
    <>
      <IntroSequence />
      <Navbar />
      <main id="main">
        <Hero />
        <TrustBar />
        <Problem />
        <Solution />
        <SkeletonAnatomy />
        <DataFlow />
        <ModelArchitecture />
        <ClassificationShowcase />
        <AnimatedModelGraphs />
        <Metrics />
        <UseCases />
        <ResearchPaper />
        <Faq />
        <Demo />
        <TechStack />
        <ClosingCta />
      </main>
      <Footer />
      <StickyCta />
    </>
  );
}
