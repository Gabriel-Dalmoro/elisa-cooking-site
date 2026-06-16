"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Gift, Heart, Info, Mail, MessageSquare, ShieldCheck, User, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';

const PACKAGES = [
    {
        id: 'discovery',
        name: 'Pack Découverte',
        recipes: 3,
        people: 4,
        price: 150,
        groceryEstimate: 60,
        description: 'La formule idéale pour faire découvrir le confort du batch cooking.',
        badge: 'Le plus accessible',
        timeSaved: '4h 45',
    },
    {
        id: 'special',
        name: 'Pack Spécial',
        recipes: 4,
        people: 4,
        price: 190,
        groceryEstimate: 80,
        description: 'Notre formule sur-mesure la plus demandée pour offrir en cadeau de naissance.',
        badge: 'Idéal Naissance',
        timeSaved: '6h 00',
    },
    {
        id: 'family',
        name: 'Pack Famille',
        recipes: 5,
        people: 4,
        price: 230,
        groceryEstimate: 100,
        description: 'Une semaine complète de repas sains et réconfortants cuisinés pour toute la famille.',
        badge: 'Populaire',
        isRecommended: true,
        timeSaved: '7h 05',
    },
    {
        id: 'comfort',
        name: 'Pack Confort',
        recipes: 6,
        people: 4,
        price: 270,
        groceryEstimate: 120,
        description: 'Le summum de la sérénité culinaire : 6 repas cuisinés sur-mesure.',
        badge: 'Grand Confort',
        timeSaved: '8h 15',
    },
];

export default function GiftCardPage() {
    const [step, setStep] = useState(0);
    const [selectedPackId, setSelectedPackId] = useState('family');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
    
    const [formData, setFormData] = useState({
        senderName: '',
        recipientName: '',
        message: '',
        deliveryEmail: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const selectedPack = useMemo(() => {
        return PACKAGES.find(p => p.id === selectedPackId) || PACKAGES[1];
    }, [selectedPackId]);

    const handleNext = () => {
        if (step === 1 && (!formData.senderName || !formData.recipientName || !formData.deliveryEmail)) {
            setErrorMsg('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        setErrorMsg('');
        setStep(s => Math.min(s + 1, 2));
    };

    const handlePrev = () => {
        setErrorMsg('');
        setStep(s => Math.max(s - 1, 0));
    };

    const handleCheckout = async () => {
        setIsSubmitting(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/gift-card/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packageId: selectedPackId,
                    ...formData,
                }),
            });
            const data = await res.json();
            if (data.success && data.url) {
                window.location.href = data.url;
            } else {
                setErrorMsg(data.error || 'Une erreur est survenue lors de la redirection.');
            }
        } catch (err) {
            setErrorMsg('Erreur réseau. Veuillez réessayer plus tard.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-stone-50 py-12 md:py-20 relative overflow-hidden text-stone-900 selection:bg-brand-rose/20">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand-rose/5 blur-[120px] rounded-full -mr-20 -mt-20 -z-10" />
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-brand-gold/5 blur-[100px] rounded-full -ml-20 -mb-20 -z-10" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                {/* Header */}
                <header className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 bg-brand-rose/10 text-brand-rose px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
                    >
                        <Gift className="h-4 w-4" /> Offrir un Bon Cadeau
                    </motion.div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
                        Offrez de la <span className="font-handwriting text-brand-rose lowercase text-4xl md:text-5xl">sérénité</span> en cuisine
                    </h1>
                    <p className="text-stone-500 text-sm md:text-base max-w-md mx-auto">
                        Faites plaisir à vos proches (jeunes parents, anniversaires, fêtes) en leur offrant une semaine de repas sains et faits maison.
                    </p>
                    
                    {/* Stepper progress */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        {[0, 1, 2].map((s) => (
                            <div
                                key={s}
                                className={`h-2.5 rounded-full transition-all duration-500 ${
                                    s === step ? 'w-10 bg-brand-rose' : s < step ? 'w-2.5 bg-emerald-500' : 'w-2.5 bg-stone-200'
                                }`}
                            />
                        ))}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Panel: Form Steps */}
                    <div className="lg:col-span-6 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-stone-100 min-h-[420px] flex flex-col justify-between">
                        <AnimatePresence mode="wait">
                            {step === 0 && (
                                <motion.div
                                    key="step0"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold tracking-tight mb-1 text-stone-900">1. Choisissez votre Formule</h2>
                                        <p className="text-stone-400 text-xs font-medium">Sélectionnez la formule de batch cooking à offrir.</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {PACKAGES.map((pack) => {
                                            const isSelected = selectedPackId === pack.id;
                                            return (
                                                <button
                                                    key={pack.id}
                                                    type="button"
                                                    onClick={() => setSelectedPackId(pack.id)}
                                                    className={`w-full flex items-center justify-between p-4 md:p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden cursor-pointer ${
                                                        isSelected
                                                            ? 'border-brand-rose bg-rose-50/20 shadow-md shadow-brand-rose/5'
                                                            : 'border-stone-100 bg-white hover:border-stone-200'
                                                    }`}
                                                >
                                                    {pack.badge && (
                                                        <span className={`absolute -top-1 right-8 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-b-md ${
                                                            pack.isRecommended ? 'bg-brand-gold text-stone-900' : 'bg-stone-100 text-stone-400'
                                                        }`}>
                                                            {pack.badge}
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-4">
                                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                                                            isSelected ? 'bg-brand-rose text-white' : 'bg-stone-50 text-stone-400'
                                                        }`}>
                                                            <Gift className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-bold text-stone-900 leading-tight">{pack.name}</h3>
                                                            <p className="text-[10px] text-brand-rose font-bold mt-1">
                                                                {pack.recipes} repas pour {pack.people} personnes (Soit {pack.recipes * pack.people} portions/assiettes)
                                                            </p>
                                                            <p className="text-[10px] text-stone-400 font-medium mt-1 leading-snug">{pack.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <span className="text-lg font-black text-stone-950">{pack.price}€</span>
                                                        <span className="text-[9px] text-stone-400 block uppercase font-bold">Service seul</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="flex flex-col items-center gap-3 pt-4">
                                        <p className="text-[10px] text-stone-400 text-center font-medium">
                                            💡 Les bons cadeaux ont une durée de validité de 6 mois à compter de la date d&apos;achat.
                                        </p>
                                        <div className="flex justify-end w-full">
                                            <button
                                                type="button"
                                                onClick={handleNext}
                                                className="rounded-full px-6 py-3 bg-brand-gold hover:bg-brand-gold/90 text-stone-900 font-bold shadow-lg shadow-brand-gold/10 text-sm flex items-center gap-2 group cursor-pointer border-none"
                                            >
                                                Continuer <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold tracking-tight mb-1 text-stone-900">2. Personnalisez la Carte</h2>
                                        <p className="text-stone-400 text-xs font-medium">Ces informations seront imprimées sur la version PDF.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label htmlFor="senderName" className="text-[10px] font-black uppercase text-stone-400 ml-1">De la part de (Donateur)</label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                                                    <input
                                                        id="senderName"
                                                        placeholder="Ex: Thomas Bernard"
                                                        className="w-full pl-11 pr-4 h-12 rounded-xl border-2 border-stone-100 bg-stone-50/50 text-xs focus:border-brand-rose focus:ring-none outline-none text-stone-950 font-bold"
                                                        value={formData.senderName}
                                                        onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label htmlFor="recipientName" className="text-[10px] font-black uppercase text-stone-400 ml-1 font-bold">Pour (Bénéficiaire)</label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                                                    <input
                                                        id="recipientName"
                                                        placeholder="Ex: Marie Martin"
                                                        className="w-full pl-11 pr-4 h-12 rounded-xl border-2 border-stone-100 bg-stone-50/50 text-xs focus:border-brand-rose focus:ring-none outline-none text-stone-950 font-bold"
                                                        value={formData.recipientName}
                                                        onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label htmlFor="deliveryEmail" className="text-[10px] font-black uppercase text-stone-400 ml-1 font-bold">Email de livraison</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                                                <input
                                                    id="deliveryEmail"
                                                    type="email"
                                                    placeholder="votre@email.com"
                                                    className="w-full pl-11 pr-4 h-12 rounded-xl border-2 border-stone-100 bg-stone-50/50 text-xs focus:border-brand-rose focus:ring-none outline-none text-stone-950 font-bold"
                                                    value={formData.deliveryEmail}
                                                    onChange={(e) => setFormData({ ...formData, deliveryEmail: e.target.value })}
                                                />
                                            </div>
                                            <p className="text-[9px] text-stone-400 italic leading-snug ml-1">Le bon cadeau PDF et son code unique seront envoyés à cette adresse.</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label htmlFor="message" className="text-[10px] font-black uppercase text-stone-400 ml-1 font-bold">Message personnel</label>
                                            <div className="relative">
                                                <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-stone-300" />
                                                <textarea
                                                    id="message"
                                                    placeholder="Ex: Pour vous soulager à l'arrivée du bébé..."
                                                    className="w-full pl-11 pr-4 py-3 h-24 rounded-xl border-2 border-stone-100 bg-stone-50/50 text-xs focus:border-brand-rose focus:ring-none outline-none text-stone-950 font-bold resize-none"
                                                    value={formData.message}
                                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {errorMsg && <p className="text-red-500 text-xs font-bold leading-none">{errorMsg}</p>}

                                    <div className="flex justify-between items-center pt-4">
                                        <button type="button" onClick={handlePrev} className="rounded-full px-5 py-3 text-xs font-bold text-stone-400 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer border-none bg-transparent"><ArrowLeft className="h-4 w-4" /> Retour</button>
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="rounded-full px-6 py-3 bg-brand-gold hover:bg-brand-gold/90 text-stone-900 font-bold shadow-lg shadow-brand-gold/10 text-sm flex items-center gap-2 group cursor-pointer border-none"
                                        >
                                            Continuer <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold tracking-tight mb-1 text-stone-900">3. Confirmation & Paiement</h2>
                                        <p className="text-stone-400 text-xs font-medium">Vérifiez vos détails avant d’être redirigé vers le paiement sécurisé Stripe.</p>
                                    </div>

                                    <div className="bg-stone-50 border border-stone-100 rounded-2xl p-5 space-y-4 text-xs">
                                        <div className="flex justify-between items-center pb-3 border-b border-stone-200/50">
                                            <span className="font-bold text-stone-400">Formule sélectionnée :</span>
                                            <span className="font-bold text-stone-900">{selectedPack.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-stone-200/50">
                                            <span className="font-bold text-stone-400">Prestation de service :</span>
                                            <span className="font-bold text-stone-900">{selectedPack.price}€</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-stone-200/50">
                                            <span className="font-bold text-stone-400">Offert par :</span>
                                            <span className="font-black text-brand-rose">{formData.senderName || 'Thomas Bernard'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-stone-200/50">
                                            <span className="font-bold text-stone-400">À l’attention de :</span>
                                            <span className="font-black text-brand-rose">{formData.recipientName || 'Marie Martin'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-stone-200/50">
                                            <span className="font-bold text-stone-400">Envoyé à :</span>
                                            <span className="font-bold text-stone-900">{formData.deliveryEmail}</span>
                                        </div>
                                        <div className="flex justify-between items-start pb-3 border-b border-stone-200/50">
                                            <span className="font-bold text-stone-400 shrink-0">Message :</span>
                                            <span className="text-stone-600 italic text-right pl-4">{formData.message || 'Aucun message.'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="font-bold text-stone-900 uppercase">Total à régler :</span>
                                            <span className="text-lg font-black text-brand-rose">{selectedPack.price}€</span>
                                        </div>
                                        <div className="bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 border border-brand-rose/15 p-5 rounded-2xl flex items-start gap-4 text-stone-850 mt-4 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-rose/5 rounded-full blur-xl -mr-12 -mt-12 pointer-events-none" />
                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-rose/10 flex items-center justify-center text-brand-rose shadow-inner">
                                                <Sparkles className="h-5 w-5 animate-pulse" />
                                            </div>
                                            <div className="text-left space-y-1 z-10">
                                                <p className="text-[10px] uppercase font-black text-brand-rose tracking-wider leading-none mb-1">Le cadeau idéal</p>
                                                <h4 className="text-xs font-bold text-stone-900 leading-tight">Offrez-lui {selectedPack.timeSaved} de pure liberté !</h4>
                                                <p className="text-[11px] font-medium text-stone-600 leading-relaxed">
                                                    C&apos;est le luxe ultime de ne pas avoir à planifier, faire les courses, cuisiner ni nettoyer pendant toute une semaine. Autant d&apos;heures libérées pour prendre soin de soi et profiter de ses proches.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {errorMsg && <p className="text-red-500 text-xs font-bold leading-none">{errorMsg}</p>}

                                    <div className="flex justify-between items-center pt-4">
                                        <button type="button" onClick={handlePrev} className="rounded-full px-5 py-3 text-xs font-bold text-stone-400 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer border-none bg-transparent"><ArrowLeft className="h-4 w-4" /> Retour</button>
                                        <button
                                            type="button"
                                            onClick={() => setIsConfirmModalOpen(true)}
                                            className="rounded-full px-8 py-4 bg-brand-rose hover:bg-brand-rose/90 text-white font-bold shadow-xl shadow-brand-rose/20 text-sm flex items-center gap-2 group cursor-pointer border-none"
                                        >
                                            Payer {selectedPack.price}€
                                            <ShieldCheck className="h-4 w-4 transition-transform group-hover:scale-110" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Panel: Live Visual Card Preview */}
                    <div className="lg:col-span-6 lg:sticky lg:top-8 space-y-6 flex flex-col items-center w-full">
                        <div className="text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Aperçu en temps réel</span>
                        </div>

                        {/* Interactive dynamic gift card container (Bigger & More Premium) */}
                        <div className="bg-gradient-to-br from-stone-50 via-white to-rose-50/15 rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-[0_25px_60px_rgba(225,86,122,0.12)] border border-stone-100/80 overflow-hidden relative w-full max-w-xl aspect-[1.58/1] flex flex-col justify-between select-none">
                            <div className="absolute inset-4 border-2 sm:border-[3px] border-brand-gold/45 rounded-[1.75rem] pointer-events-none" />
                            <div className="absolute inset-4.5 border border-stone-100/30 rounded-[1.70rem] pointer-events-none" />
                            
                            {/* Header row */}
                            <div className="flex justify-between items-center w-full z-10">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <img
                                        src="images/logo.jpg"
                                        alt="Logo"
                                        className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded-full border border-stone-200/50 shadow-sm"
                                    />
                                    <span className="text-sm sm:text-base md:text-lg font-black tracking-tight text-stone-900">
                                        Elisa <span className="text-brand-rose">Batch Cooking</span>
                                    </span>
                                </div>
                                <div className="text-[9px] sm:text-xs font-black tracking-[0.2em] text-stone-400 uppercase">
                                    BON CADEAU
                                </div>
                            </div>

                            {/* Main message */}
                            <div className="my-auto px-4 py-4 flex flex-col justify-center items-center text-center z-10">
                                <p className="font-handwriting text-brand-rose text-sm sm:text-base md:text-lg lg:text-base xl:text-xl leading-relaxed max-w-[85%] mx-auto">
                                    Pour une séance de Batch Cooking avec {selectedPack.recipes} plats maison pour {selectedPack.people} personnes préparés chez vous
                                </p>
                            </div>

                            {/* Footer info */}
                            <div className="flex justify-between items-end text-stone-900 z-10">
                                {/* Left Side: Names */}
                                <div className="text-left space-y-0.5">
                                    <div>
                                        <span className="text-[6px] font-bold text-stone-400 uppercase tracking-widest block leading-none">Offert à</span>
                                        <span className="text-[10px] sm:text-xs font-black text-stone-850 leading-tight block">
                                            {formData.recipientName || 'Marie Martin'}
                                        </span>
                                    </div>
                                    <div className="pt-1">
                                        <span className="text-[6px] font-bold text-stone-400 uppercase tracking-widest block leading-none">De la part de</span>
                                        <span className="text-[10px] sm:text-xs font-black text-stone-850 leading-tight block">
                                            {formData.senderName || 'Thomas Bernard'}
                                        </span>
                                    </div>
                                </div>

                                {/* Right Side: Expiry */}
                                <div className="text-right pb-1">
                                    <span className="text-[6px] font-bold text-stone-400 uppercase tracking-widest block leading-none">Validité</span>
                                    <span className="text-[10px] sm:text-xs font-black text-stone-850 leading-tight block">
                                        6 mois
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Terms Confirmation Modal */}
            <AnimatePresence>
                {isConfirmModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsConfirmModalOpen(false)}
                            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
                        />

                        {/* Modal card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-md w-full shadow-2xl border border-stone-100 space-y-6 relative z-10"
                        >
                            <div>
                                <h3 className="text-xl font-bold tracking-tight text-stone-900 mb-1">Conditions de votre Bon Cadeau</h3>
                                <p className="text-stone-400 text-xs font-medium">Veuillez accepter les conditions ci-dessous pour finaliser l&apos;achat.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-3 items-start bg-rose-50/35 p-4 rounded-2xl border border-rose-100/30">
                                    <Info className="h-5 w-5 text-brand-rose shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-bold text-stone-900 mb-1">Coût des ingrédients</h4>
                                        <p className="text-[10px] text-stone-600 leading-relaxed font-medium">
                                            Les ingrédients ne sont <strong>pas inclus</strong>. Le coût des courses reste entièrement à la charge du bénéficiaire lors de la séance (il varie selon les plats choisis).
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start bg-amber-50/35 p-4 rounded-2xl border border-amber-100/30">
                                    <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-bold text-stone-900 mb-1">Durée de validité (6 mois)</h4>
                                        <p className="text-[10px] text-stone-600 leading-relaxed font-medium">
                                            Le bon cadeau est valable pendant <strong>6 mois</strong> à compter de la date d&apos;achat pour planifier et effectuer la séance.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start bg-emerald-50/35 p-4 rounded-2xl border border-emerald-100/30">
                                    <Info className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-bold text-stone-900 mb-1">Réglementation fiscale (SAP)</h4>
                                        <p className="text-[10px] text-stone-600 leading-relaxed font-medium">
                                            L&apos;achat d&apos;un bon cadeau n&apos;ouvre pas droit au crédit d&apos;impôt pour l&apos;acheteur. Aucun avantage fiscal ne s&apos;appliquera sur cette session.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[10px] text-stone-400 text-center leading-normal">
                                Retrouvez tous les détails dans nos{" "}
                                <Link
                                    href="/cgv"
                                    target="_blank"
                                    className="text-brand-rose underline font-bold hover:text-brand-rose/80"
                                >
                                    Conditions Générales de Vente
                                </Link>
                                .
                            </p>

                            {/* Acceptance checkbox */}
                            <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-100/60">
                                <input
                                    type="checkbox"
                                    id="termsCheck"
                                    checked={hasAcceptedTerms}
                                    onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-stone-300 text-brand-rose focus:ring-brand-rose cursor-pointer accent-brand-rose"
                                />
                                <label htmlFor="termsCheck" className="text-[10px] sm:text-[11px] font-bold text-stone-700 cursor-pointer leading-snug">
                                    Je confirme avoir pris connaissance et accepter ces conditions d&apos;achat et de validité.
                                </label>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsConfirmModalOpen(false);
                                        setHasAcceptedTerms(false);
                                    }}
                                    className="flex-1 rounded-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 text-xs font-bold transition-colors cursor-pointer border-none"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    disabled={!hasAcceptedTerms || isSubmitting}
                                    onClick={handleCheckout}
                                    className="flex-1 rounded-full py-3 bg-brand-rose hover:bg-brand-rose/90 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none flex items-center justify-center gap-1.5"
                                >
                                    {isSubmitting ? 'Redirection...' : 'Confirmer & Payer'}
                                    <ShieldCheck className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
