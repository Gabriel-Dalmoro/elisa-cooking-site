import { HeroSection } from "@/components/home/HeroSection";
import { ProcessSteps } from "@/components/home/ProcessSteps";
import { ValueProps } from "@/components/home/ValueProps";
import { PhotoGallery } from "@/components/home/PhotoGallery";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Suspense } from "react";
import { getTestimonials } from "@/lib/googleSheets";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";

// Revalidate testimonials every 10 minutes
export const revalidate = 600;

export default async function Home() {
  const testimonials = await getTestimonials();

  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<div className="h-[600px] bg-stone-50" />}>
        <HeroSection />
      </Suspense>
      <ProcessSteps />
      <TestimonialsSection testimonials={testimonials} />
      <ValueProps />
      <PhotoGallery />
      <FinalCTA />
      {/* Additional sections will be added here */}
    </main>
  );
}
