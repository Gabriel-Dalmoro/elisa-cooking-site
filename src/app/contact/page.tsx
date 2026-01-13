"use client";

import Link from "next/link";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, Send, MessageSquare, Instagram, Facebook, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log("Contact Form Data:", formData);
        setIsSubmitting(false);
        setIsSent(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
    };

    const contactInfo = [
        {
            icon: Mail,
            label: "Email",
            value: "contact@chefelisa.fr",
            href: "mailto:contact@chefelisa.fr",
            color: "brand-rose"
        },
        {
            icon: Phone,
            label: "Téléphone",
            value: "06 00 00 00 00",
            href: "tel:+33600000000",
            color: "brand-gold"
        },
        {
            icon: MapPin,
            label: "Secteur",
            value: "Annecy & Alentours",
            color: "brand-rose"
        }
    ];

    return (
        <main className="min-h-screen bg-stone-50 py-16 md:py-24 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand-rose/5 blur-[120px] rounded-full -mr-20 -mt-20 -z-10" />
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-brand-gold/5 blur-[100px] rounded-full -ml-20 -mb-20 -z-10" />

            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <header className="text-center mb-16 md:mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-rose/10 text-brand-rose text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-6"
                    >
                        <MessageSquare className="h-4 w-4" /> Contact & Réservations
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-stone-900 mb-6 tracking-tight"
                    >
                        Discutons de votre <br /> <span className="text-brand-rose">prochain festin</span>.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-stone-500 text-lg md:text-xl max-w-2xl mx-auto"
                    >
                        Une question, une envie particulière ou une demande de devis sur mesure ? Je suis à votre écoute.
                    </motion.p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left: Contact Info */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="grid grid-cols-1 gap-4">
                            {contactInfo.map((info, i) => (
                                <motion.div
                                    key={info.label}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 + 0.3 }}
                                >
                                    {info.href ? (
                                        <a
                                            href={info.href}
                                            className="group flex items-center gap-6 p-6 rounded-[2rem] bg-white border border-stone-100 shadow-sm hover:shadow-xl hover:border-brand-rose/20 transition-all duration-500"
                                        >
                                            <div className={cn(
                                                "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110",
                                                info.color === "brand-rose" ? "bg-brand-rose/10 text-brand-rose" : "bg-brand-gold/10 text-brand-gold"
                                            )}>
                                                <info.icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-600 mb-1">{info.label}</span>
                                                <span className="text-lg font-bold text-stone-900">{info.value}</span>
                                            </div>
                                        </a>
                                    ) : (
                                        <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-white border border-stone-100 shadow-sm">
                                            <div className={cn(
                                                "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg",
                                                info.color === "brand-rose" ? "bg-brand-rose/10 text-brand-rose" : "bg-brand-gold/10 text-brand-gold"
                                            )}>
                                                <info.icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-600 mb-1">{info.label}</span>
                                                <span className="text-lg font-bold text-stone-900">{info.value}</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Additional Box */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-brand-gold/10 border border-brand-gold/20 p-8 rounded-[2.5rem] relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <Clock className="h-5 w-5 text-brand-gold" />
                                    <h3 className="font-bold text-stone-900">Réponse Rapide</h3>
                                </div>
                                <p className="text-stone-600 text-sm leading-relaxed">
                                    Je consulte mes messages quotidiennement. Vous recevrez une réponse sous <span className="font-bold text-stone-900">24 à 48 heures</span> maximum.
                                </p>
                            </div>
                        </motion.div>

                        <div className="flex gap-4 px-4">
                            <Link href="#" className="h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-stone-100 text-stone-600 hover:text-brand-rose hover:shadow-lg transition-all">
                                <Instagram className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-stone-100 text-stone-600 hover:text-brand-rose hover:shadow-lg transition-all">
                                <Facebook className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Right: Contact Form */}
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-stone-200/50 border border-stone-100 relative overflow-hidden"
                        >
                            <AnimatePresence mode="wait">
                                {!isSent ? (
                                    <motion.form
                                        key="form"
                                        initial={{ opacity: 1 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        onSubmit={handleSubmit}
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-stone-600 ml-1">Nom & Prénom</Label>
                                                <Input
                                                    id="name"
                                                    required
                                                    placeholder="Jean Dupont"
                                                    className="rounded-2xl border-stone-100 bg-stone-50/50 h-14 focus:ring-brand-rose text-stone-900 placeholder:text-stone-300"
                                                    value={formData.name}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-stone-600 ml-1">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    required
                                                    placeholder="jean@exemple.com"
                                                    className="rounded-2xl border-stone-100 bg-stone-50/50 h-14 focus:ring-brand-rose text-stone-900 placeholder:text-stone-300"
                                                    value={formData.email}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="subject" className="text-[10px] font-black uppercase tracking-widest text-stone-600 ml-1">Sujet</Label>
                                            <Input
                                                id="subject"
                                                required
                                                placeholder="Comment puis-je vous aider ?"
                                                className="rounded-2xl border-stone-100 bg-stone-50/50 h-14 focus:ring-brand-rose text-stone-900 placeholder:text-stone-300"
                                                value={formData.subject}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, subject: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest text-stone-600 ml-1">Message</Label>
                                            <Textarea
                                                id="message"
                                                required
                                                placeholder="Parlez-moi de votre projet culinaire..."
                                                className="rounded-[2rem] border-stone-100 bg-stone-50/50 min-h-[180px] focus:ring-brand-rose text-stone-900 placeholder:text-stone-300 p-6"
                                                value={formData.message}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                size="lg"
                                                className="w-full rounded-full py-8 h-auto bg-brand-rose hover:bg-brand-rose/90 text-white shadow-xl shadow-brand-rose/20 text-lg font-bold group border-none transition-all hover:scale-[1.02] disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-3">
                                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Envoi en cours...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        Envoyer le message
                                                        <Send className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    </motion.form>
                                ) : (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="py-12 flex flex-col items-center text-center space-y-6"
                                    >
                                        <div className="h-24 w-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/10 mb-4">
                                            <CheckCircle2 className="h-12 w-12 stroke-[2.5px]" />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-black text-stone-900 tracking-tight">Message Envoyé !</h2>
                                            <p className="text-stone-500 text-lg">
                                                Merci pour votre confiance. <br />
                                                Je reviens vers vous dès que mes fourneaux se calment.
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setIsSent(false)}
                                            className="text-stone-400 hover:text-stone-900 rounded-full h-12 px-8"
                                        >
                                            Envoyer un autre message
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>
            </div>
        </main>
    );
}
