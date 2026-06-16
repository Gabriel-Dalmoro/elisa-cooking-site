"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Gift, Sparkles, Check } from "lucide-react";
import { motion } from "framer-motion";

export function GiftCardSection() {
    const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, active: false });
    const [isEntering, setIsEntering] = useState(false);
    const enterTimeoutRef = React.useRef<any>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const box = card.getBoundingClientRect();
        const x = e.clientX - box.left - box.width / 2;
        const y = e.clientY - box.top - box.height / 2;
        const rotateX = -(y / (box.height / 2)) * 18;
        const rotateY = (x / (box.width / 2)) * 18;
        const gX = ((e.clientX - box.left) / box.width) * 100;
        const gY = ((e.clientY - box.top) / box.height) * 100;

        if (!tilt.active) {
            setIsEntering(true);
            if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
            enterTimeoutRef.current = setTimeout(() => {
                setIsEntering(false);
            }, 300);
        }

        setTilt({ x: rotateY, y: rotateX, glareX: gX, glareY: gY, active: true });
    };

    const handleMouseLeave = () => {
        if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
        setIsEntering(false);
        setTilt({ x: 0, y: 0, glareX: 50, glareY: 50, active: false });
    };
    return (
        <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-stone-50 via-white to-stone-50">
            {/* Background decorative elements */}
            <div className="absolute top-1/4 right-0 w-80 h-80 bg-brand-rose/5 rounded-full blur-[100px] pointer-events-none -mr-40" />
            <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none -ml-40" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                    
                    {/* Left Column: Sales Copy & Features */}
                    <div className="lg:col-span-6 space-y-8 text-left">
                        <div className="inline-flex items-center gap-2 bg-brand-rose/10 text-brand-rose px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                            <Gift className="h-4 w-4" /> NOUVEAUTÉ
                        </div>
                        
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-stone-900 leading-tight">
                                Offrez le luxe ultime : <br />
                                <span className="font-handwriting text-brand-rose lowercase text-4xl md:text-5xl">du temps libre</span> pour soi.
                            </h2>
                            <p className="text-stone-500 text-base md:text-lg leading-relaxed">
                                Le cadeau idéal pour célébrer une naissance, un anniversaire, une fête, ou tout simplement pour soulager le quotidien de vos proches.
                            </p>
                        </div>

                        {/* Benefits list */}
                        <div className="space-y-4 pt-2">
                            <div className="flex gap-3 items-start">
                                <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                                    <Check className="h-3.5 w-3.5 stroke-[3px]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-stone-900">Une semaine complète de sérénité</h4>
                                    <p className="text-xs text-stone-500 leading-normal">
                                        Pas de courses, pas de planification de repas, pas de cuisine ni de vaisselle pour le bénéficiaire.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start">
                                <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                                    <Check className="h-3.5 w-3.5 stroke-[3px]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-stone-900">Repas sains et cuisinés sur-mesure</h4>
                                    <p className="text-xs text-stone-500 leading-normal">
                                        Préparés à domicile par leur Cheffe dédiée avec des ingrédients frais de saison.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start">
                                <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                                    <Check className="h-3.5 w-3.5 stroke-[3px]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-stone-900">Carte personnalisée instantanée</h4>
                                    <p className="text-xs text-stone-500 leading-normal">
                                        Ajoutez votre message, choisissez la formule et recevez instantanément votre bon cadeau numérique par email.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <Link
                                href="/carte-cadeau"
                                className="rounded-full px-8 py-4 bg-brand-rose hover:bg-brand-rose/90 text-white font-bold shadow-xl shadow-brand-rose/20 text-sm transition-all hover:scale-[1.02] flex items-center gap-2 border-none cursor-pointer"
                            >
                                Choisir un Bon Cadeau
                                <Gift className="h-4 w-4" />
                            </Link>
                            <span className="text-xs text-stone-400 font-semibold italic">Valable 6 mois • À partir de 150€</span>
                        </div>
                    </div>

                    {/* Right Column: Beautiful Gift Card Visual Representation */}
                    <div className="lg:col-span-6 flex items-center justify-center relative w-full">
                        {/* Background glowing rings */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-rose/10 via-transparent to-brand-gold/15 rounded-[3rem] blur-3xl pointer-events-none -z-10 scale-95" />
                        
                        {/* Wrapper for floating card and floor shadow (with parent perspective) */}
                        <div 
                            style={{ perspective: 1000 }}
                            className="relative w-full max-w-lg aspect-[1.58/1] flex items-center justify-center"
                        >
                            {/* Realistic Floor Shadow */}
                            <div
                                style={{
                                    transform: tilt.active 
                                        ? `translateX(${-tilt.x * 1.5}px) translateY(${4 + tilt.y * 0.5}px) scale(0.92)` 
                                        : "none",
                                    opacity: tilt.active ? 0.08 : 0.15,
                                    transition: isEntering
                                        ? "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1)"
                                        : tilt.active
                                            ? "none"
                                            : "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
                                }}
                                className="absolute bottom-[-15px] left-[8%] right-[8%] h-6 bg-brand-rose/25 rounded-full blur-xl pointer-events-none -z-10"
                            />

                            {/* Mockup Card with 3D tilt effect */}
                            <motion.div
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                animate={{
                                    rotateX: tilt.y,
                                    rotateY: tilt.x,
                                    y: tilt.active ? -12 : 0, // Lift
                                }}
                                transition={{ type: "spring", stiffness: 150, damping: 22, mass: 0.5 }}
                                style={{
                                    transformStyle: "preserve-3d",
                                    perspective: 1000,
                                    boxShadow: tilt.active
                                        ? `${-tilt.x * 2.5}px ${tilt.y * 2.5}px ${25 + Math.sqrt(tilt.x*tilt.x + tilt.y*tilt.y) * 2}px rgba(0, 0, 0, ${0.07 + (Math.sqrt(tilt.x*tilt.x + tilt.y*tilt.y) / 250)}),
                                           ${-tilt.x * 5}px ${tilt.y * 5}px ${60 + Math.sqrt(tilt.x*tilt.x + tilt.y*tilt.y) * 2.5}px rgba(225, 29, 72, ${0.05 + (Math.sqrt(tilt.x*tilt.x + tilt.y*tilt.y) / 350)})`
                                        : "0 15px 40px -10px rgba(0, 0, 0, 0.08), 0 20px 40px -15px rgba(225, 29, 72, 0.04)",
                                    transition: isEntering
                                        ? "box-shadow 0.3s cubic-bezier(0.25, 1, 0.5, 1)"
                                        : tilt.active
                                            ? "none"
                                            : "box-shadow 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
                                }}
                                className="bg-gradient-to-br from-stone-50 via-white to-rose-50/15 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-10 border border-stone-100/80 overflow-hidden relative w-full h-full flex flex-col justify-between select-none cursor-default group shadow-lg"
                            >
                                {/* Dynamic Glare Effect overlay */}
                                <div
                                    style={{
                                        background: tilt.active
                                            ? `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.22) 0%, transparent 55%)`
                                            : "transparent",
                                    }}
                                    className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
                                />

                                {/* Card borders */}
                                <div style={{ transform: "translateZ(20px)" }} className="absolute inset-3 sm:inset-4.5 border-2 sm:border-[3px] border-brand-gold/45 rounded-[1.45rem] sm:rounded-[1.75rem] pointer-events-none transition-transform duration-200" />
                                <div className="absolute inset-3.5 sm:inset-5 border border-stone-100/30 rounded-[1.40rem] sm:rounded-[1.70rem] pointer-events-none" />
                                
                                {/* Card Header */}
                                <div style={{ transform: "translateZ(35px)" }} className="flex justify-between items-center w-full z-10 transition-transform duration-200">
                                    <div className="flex items-center gap-2 sm:gap-4">
                                        <img
                                            src="/images/logo.jpg"
                                            alt="Logo"
                                            className="h-9 w-9 sm:h-12 sm:w-12 object-contain rounded-full border border-stone-200/50 shadow-sm transition-transform duration-500 group-hover:rotate-[360deg]"
                                        />
                                        <span className="text-xs sm:text-base md:text-lg font-black tracking-tight text-stone-900">
                                            Elisa <span className="text-brand-rose">Batch Cooking</span>
                                        </span>
                                    </div>
                                    <span className="text-[9px] sm:text-xs font-black tracking-[0.2em] text-stone-400 uppercase">
                                        BON CADEAU
                                    </span>
                                </div>

                                {/* Card Content Cursive Text */}
                                <div style={{ transform: "translateZ(50px)" }} className="my-auto px-2 py-2 sm:py-4 flex flex-col justify-center items-center text-center z-10 transition-transform duration-200">
                                    <p className="font-handwriting text-brand-rose text-xs sm:text-xl md:text-2xl leading-relaxed max-w-[90%] mx-auto">
                                        Pour une séance de Batch Cooking avec de délicieux plats faits maison préparés chez vous
                                    </p>
                                </div>

                                {/* Card Footer Info */}
                                <div style={{ transform: "translateZ(30px)" }} className="flex justify-between items-end text-stone-900 z-10 transition-transform duration-200">
                                    <div className="text-left space-y-0.5">
                                        <div>
                                            <span className="text-[7px] font-bold text-stone-400 uppercase tracking-widest block leading-none">Pour</span>
                                            <span className="text-[9px] sm:text-xs font-black text-stone-850 block leading-tight">Marie & Julien</span>
                                        </div>
                                        <div className="pt-0.5 sm:pt-1">
                                            <span className="text-[7px] font-bold text-stone-400 uppercase tracking-widest block leading-none">De la part de</span>
                                            <span className="text-[9px] sm:text-xs font-black text-stone-850 block leading-tight">Nathalie</span>
                                        </div>
                                    </div>
                                    <div className="text-right pb-0.5">
                                        <span className="text-[7px] font-bold text-stone-400 uppercase tracking-widest block leading-none">Validité</span>
                                        <span className="text-[9px] sm:text-xs font-black text-stone-850 block leading-tight">6 mois</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
