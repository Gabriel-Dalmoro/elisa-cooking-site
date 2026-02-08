
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ArrowLeft, ArrowRight } from "lucide-react";

interface Testimonial {
    id: string;
    name: string;
    rating: number;
    message: string;
    status: 'Approved' | 'Pending' | 'Flagged';
}

interface TestimonialsSectionProps {
    testimonials?: Testimonial[];
}

export function TestimonialsSection({ testimonials = [] }: TestimonialsSectionProps) {
    const [index, setIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-rotate every 5 seconds, unless paused
    useEffect(() => {
        if (!testimonials.length || isPaused) return;
        const interval = setInterval(() => {
            setIndex((state) => (state + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [testimonials.length, isPaused]);

    const handlePrevious = () => {
        setIndex((state) => (state - 1 + testimonials.length) % testimonials.length);
    };

    const handleNext = () => {
        setIndex((state) => (state + 1) % testimonials.length);
    };

    if (!testimonials.length) return null;

    return (
        <section className="py-16 bg-gradient-to-br from-brand-rose/20 via-rose-50/50 to-brand-gold/20 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-brand-rose/30 rounded-full blur-3xl -ml-16 -mt-16" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-brand-gold/30 rounded-full blur-3xl -mr-20 -mb-20" />

            <div className="container px-4 mx-auto relative z-10 flex flex-col items-center">
                {/* Section Header */}
                <div className="text-center mb-8 space-y-3">
                    <span className="text-brand-rose font-bold tracking-widest uppercase text-[10px]">
                        Ce qu'ils en disent
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">
                        Vos mots <span className="text-brand-rose">doux</span>
                    </h2>
                </div>

                {/* Main Content Area with Arrows */}
                <div
                    className="w-full max-w-4xl flex items-center justify-center gap-4 md:gap-8"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Previous Button (Desktop) */}
                    <button
                        onClick={handlePrevious}
                        className="hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white border border-stone-100 shadow-sm text-stone-400 hover:text-brand-rose hover:border-brand-rose/20 transition-all active:scale-95"
                        aria-label="Témoignage précédent"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    {/* Testimonial Card */}
                    <div className="w-full max-w-2xl relative h-[280px] md:h-[220px] flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 p-8 md:p-10 text-center border border-brand-rose/5 relative w-full"
                            >
                                {/* Quote Icon */}
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-br from-brand-gold to-yellow-400 text-stone-900 p-2.5 rounded-full shadow-lg shadow-brand-gold/20">
                                    <Quote className="w-5 h-5 fill-current" />
                                </div>

                                {/* Stars */}
                                <div className="flex justify-center gap-1 mb-4 text-brand-gold mt-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < testimonials[index].rating ? "fill-current" : "text-stone-100 fill-stone-100"}`}
                                        />
                                    ))}
                                </div>

                                {/* Message */}
                                <p className="text-base md:text-lg text-stone-600 font-medium italic leading-relaxed mb-4 line-clamp-3">
                                    "{testimonials[index].message}"
                                </p>

                                {/* Author */}
                                <div className="text-xs font-black uppercase tracking-widest text-stone-900/80">
                                    {testimonials[index].name}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Next Button (Desktop) */}
                    <button
                        onClick={handleNext}
                        className="hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white border border-stone-100 shadow-sm text-stone-400 hover:text-brand-rose hover:border-brand-rose/20 transition-all active:scale-95"
                        aria-label="Témoignage suivant"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Indicators & Mobile Nav */}
                <div className="flex items-center gap-4 mt-8">
                    {/* Mobile Prev */}
                    <button onClick={handlePrevious} className="md:hidden p-2 text-stone-400">
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex gap-2">
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIndex(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === i ? "w-6 bg-brand-rose" : "w-1.5 bg-stone-200 hover:bg-stone-300"
                                    }`}
                                aria-label={`Voir témoignage ${i + 1}`}
                            />
                        ))}
                    </div>

                    {/* Mobile Next */}
                    <button onClick={handleNext} className="md:hidden p-2 text-stone-400">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </section>
    );
}
