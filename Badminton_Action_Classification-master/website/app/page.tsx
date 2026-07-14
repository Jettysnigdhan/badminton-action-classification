import dynamic from "next/dynamic";
import { IntroSequence } from "@/components/IntroSequence";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TrustBar } from "@/components/TrustBar";
import { ProductPitch } from "@/components/ProductPitch";
import { Solution } from "@/components/Solution";
import { ShotDefinitions } from "@/components/ShotDefinitions";
import { Footer } from "@/components/Footer";
import { ClosingCta } from "@/components/cta/ClosingCta";

// Code-split below-the-fold, interaction-heavy sections.
const ClassificationShowcase = dynamic(() =>
  import("@/components/ClassificationShowcase").then((m) => m.ClassificationShowcase)
);
const UseCases = dynamic(() => import("@/components/UseCases").then((m) => m.UseCases));
const Tournaments = dynamic(() => import("@/components/Tournaments").then((m) => m.Tournaments));
const PlayerDashboard = dynamic(() => import("@/components/PlayerDashboard").then((m) => m.PlayerDashboard));
const Faq = dynamic(() => import("@/components/Faq").then((m) => m.Faq));
const LiveDemo = dynamic(() => import("@/components/LiveDemo").then((m) => m.LiveDemo));
const Demo = dynamic(() => import("@/components/Demo").then((m) => m.Demo));

export default function HomePage() {
  return (
    <>
      <IntroSequence />
      <Navbar />
      <main id="main">
        <Hero />
        <TrustBar />
        <LiveDemo />
        <Demo />
        <ProductPitch />
        <Solution />
        <ShotDefinitions />
        <ClassificationShowcase />
        <UseCases />
        <Tournaments />
        <PlayerDashboard />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
