import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-stone-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Left Content (Text) */}
                    <div className="py-12 lg:py-24 flex flex-col items-center lg:items-start text-center lg:text-left">
                        <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl flex flex-col gap-2">
                            <span className="sr-only">Elisa Batch Cooking : Votre Cheffe à Domicile à Annecy</span>
                            <span>Vous gagnez du <span className="text-brand-rose">temps</span>,</span>
                            <span>je m'occupe de tout.</span>
                        </h1>

                        <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start gap-3">
                            <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-brand-gold" />
                            <p className="text-lg leading-relaxed text-stone-600 sm:text-xl">
                                Savourez une cuisine d'exception chez vous, avec <span className="font-semibold text-stone-900">50% d'avantage fiscal</span>.
                            </p>
                        </div>

                        <div className="mt-10">
                            <Button
                                asChild
                                size="lg"
                                className="h-14 px-10 text-lg font-bold bg-brand-rose hover:bg-brand-rose/90 text-white shadow-xl shadow-brand-rose/20 transition-all hover:scale-105"
                            >
                                <Link href="/simulateur">Simuler mon tarif</Link>
                            </Button>
                        </div>

                        <div className="mt-8 flex items-center gap-4 text-sm font-medium text-stone-400">
                            <span className="h-px w-8 bg-stone-200" />
                            <span>Spécialiste Batch Cooking à Annecy</span>
                            <span className="h-px w-8 bg-stone-200" />
                        </div>
                    </div>

                    {/* Right Content (Image) */}
                    <div className="relative h-[400px] w-full overflow-hidden rounded-3xl shadow-2xl lg:h-[600px] bg-stone-200">
                        <Image
                            src="/images/hero-food.png"
                            alt="Gourmet healthy food plated beautifully"
                            fill
                            className="object-cover transition-transform duration-700 hover:scale-105"
                            priority
                            unoptimized
                        />
                        {/* Subtle warm overlay */}
                        <div className="absolute inset-0 bg-brand-gold/5 mix-blend-multiply" />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/20 to-transparent" />
                    </div>
                </div>
            </div>

            {/* Background Decorative Elements */}
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-rose/5 blur-3xl" />
            <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-brand-gold/5 blur-3xl" />
        </section>
    );
}
