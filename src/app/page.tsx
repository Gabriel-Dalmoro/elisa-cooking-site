import { HeroSection } from "@/components/home/HeroSection";
import { ProcessSteps } from "@/components/home/ProcessSteps";
import { ValueProps } from "@/components/home/ValueProps";
import { PhotoGallery } from "@/components/home/PhotoGallery";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <ProcessSteps />
      <ValueProps />
      <PhotoGallery />
      <FinalCTA />
      {/* Additional sections will be added here */}
    </main>
  );
}
