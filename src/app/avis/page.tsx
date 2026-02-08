
"use client";

import { useState } from "react";
import { Star, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function FeedbackPage() {
    const [name, setName] = useState("");
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (rating === 0) {
            setError("Veuillez sélectionner une note d'étoiles.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/testimonials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, rating, message }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Une erreur est survenue.");
            }

            setIsSuccess(true);
            setName("");
            setRating(0);
            setMessage("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-stone-50 flex items-center justify-center p-4 py-20">
            <div className="w-full max-w-lg">
                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-emerald-900/10 text-center space-y-6"
                        >
                            <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                                <Check className="w-10 h-10 stroke-[3px]" />
                            </div>
                            <h2 className="text-3xl font-black text-stone-900 tracking-tight">Merci beaucoup !</h2>
                            <p className="text-stone-500 font-medium">
                                Votre avis a bien été reçu. Il sera visible sur le site après validation par Elisa.
                            </p>
                            <Button
                                onClick={() => setIsSuccess(false)}
                                className="mt-4 rounded-full bg-stone-100 text-stone-900 hover:bg-stone-200 border-none font-bold"
                            >
                                Envoyer un autre avis
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-brand-rose/10 space-y-8 relative overflow-hidden"
                        >
                            {/* Decorative Blobs */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-rose/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

                            <div className="text-center space-y-2 relative z-10">
                                <span className="text-xs font-black uppercase tracking-widest text-brand-rose">Votre expérience</span>
                                <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">Laissez un avis</h1>
                                <p className="text-stone-500 text-sm font-medium">Partagez votre expérience avec Elisa Batch Cooking.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                {/* Rating Input */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                                            >
                                                <Star
                                                    className={`w-8 h-8 md:w-10 md:h-10 transition-colors ${(hoverRating || rating) >= star
                                                            ? "fill-brand-gold text-brand-gold"
                                                            : "fill-stone-100 text-stone-200"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-stone-400 h-4">
                                        {rating === 5 ? "Excellent !" : rating === 4 ? "Très bien" : rating === 3 ? "Bien" : rating > 0 ? "Merci pour votre retour" : ""}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-2">Votre Prénom</label>
                                        <Input
                                            required
                                            placeholder="Ex: Sophie"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="h-12 rounded-xl bg-stone-50 border-stone-100 focus:border-brand-rose/50 focus:ring-brand-rose/20 text-stone-900 placeholder:text-stone-400"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-2">Votre Message</label>
                                        <Textarea
                                            required
                                            placeholder="Ce que vous avez le plus apprécié..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="min-h-[120px] rounded-xl bg-stone-50 border-stone-100 focus:border-brand-rose/50 focus:ring-brand-rose/20 text-stone-900 placeholder:text-stone-400 resize-none p-4"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-lg text-xs font-bold">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-14 rounded-full text-base font-black uppercase tracking-widest bg-brand-rose hover:bg-brand-rose/90 text-white shadow-xl shadow-brand-rose/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Envoi en cours..." : "Envoyer mon avis"}
                                </Button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
