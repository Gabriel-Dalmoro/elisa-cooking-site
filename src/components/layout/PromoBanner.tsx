"use client";

import { useEffect, useState, useMemo } from "react";
import { Flame, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { SiteConfig } from "@/lib/googleSheets";

interface PromoBannerProps {
    config: SiteConfig;
}

export function PromoBanner({ config }: PromoBannerProps) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isExpired, setIsExpired] = useState(false);

    const expiryDate = useMemo(() => {
        if (!config.promoExpiry) return null;
        return new Date(config.promoExpiry);
    }, [config.promoExpiry]);

    useEffect(() => {
        if (!expiryDate) return;

        const updateTimer = () => {
            const now = new Date();
            const difference = expiryDate.getTime() - now.getTime();

            if (difference <= 0) {
                setIsExpired(true);
                return;
            }

            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expiryDate]);

    if (!config.promoActive || isExpired) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-stone-900 overflow-hidden group h-[180px] lg:h-20 flex items-center border-b border-white/10 shadow-2xl">
            {/* Mesh Gradient Background */}
            <div className="absolute inset-0 bg-stone-900" />
            <div className="absolute inset-0 opacity-40">
                <div className="absolute -top-[100%] -left-[50%] w-[200%] h-[300%] bg-[radial-gradient(circle_at_center,var(--brand-rose)_0%,transparent_50%)] animate-[spin_20s_linear_infinite]" />
                <div className="absolute -bottom-[100%] -right-[50%] w-[200%] h-[300%] bg-[radial-gradient(circle_at_center,var(--brand-gold)_0%,transparent_50%)] animate-[spin_15s_linear_infinite_reverse]" />
            </div>
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-3xl" />

            <div className="container mx-auto px-4 relative z-10 py-3 lg:py-0">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8">
                    {/* Left: Info */}
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-rose text-white shadow-xl shadow-brand-rose/40 ring-4 ring-white/10 animate-pulse">
                            <Flame className="h-7 w-7 fill-current" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-brand-rose animate-ping" />
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-gold">
                                    {config.promoLabel || "Vente Flash"}
                                </p>
                            </div>
                            <p className="text-base sm:text-lg font-black text-white leading-tight">
                                Remise exceptionnelle de <span className="text-brand-rose">-{config.promoDiscount}%</span>
                            </p>
                        </div>
                    </div>

                    {/* Middle: Countdown (BIG) */}
                    <div className="flex flex-col items-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-500 mb-1">Fin de l'offre dans</p>
                        <div className="flex items-center gap-4 bg-black/40 px-6 py-2 rounded-2xl border border-white/5 shadow-inner">
                            <div className="flex flex-col items-center min-w-[3rem]">
                                <span className="text-2xl font-black text-white tabular-nums leading-none">{timeLeft.days}</span>
                                <span className="text-[8px] font-bold uppercase tracking-widest text-stone-500 mt-1">Jours</span>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="flex flex-col items-center min-w-[3rem]">
                                <span className="text-2xl font-black text-white tabular-nums leading-none">{timeLeft.hours.toString().padStart(2, '0')}</span>
                                <span className="text-[8px] font-bold uppercase tracking-widest text-stone-500 mt-1">Heures</span>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="flex flex-col items-center min-w-[3rem]">
                                <span className="text-2xl font-black text-white tabular-nums leading-none">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                                <span className="text-[8px] font-bold uppercase tracking-widest text-stone-500 mt-1">Min</span>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="flex flex-col items-center min-w-[3rem]">
                                <span className="text-2xl font-black text-brand-rose tabular-nums leading-none animate-pulse">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                                <span className="text-[8px] font-bold uppercase tracking-widest text-stone-500 mt-1">Sec</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: CTA */}
                    <div className="hidden lg:block">
                        <Link
                            href="/simulateur"
                            className="group/btn flex items-center gap-3 px-8 py-3.5 bg-white text-stone-900 rounded-full text-xs font-black uppercase tracking-[0.2em] hover:bg-brand-rose hover:text-white transition-all shadow-2xl hover:scale-105 active:scale-95"
                        >
                            J'en profite
                            <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

