"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    ArrowRight, 
    Gift, 
    Info, 
    Mail, 
    MessageSquare, 
    ShieldCheck, 
    User, 
    Sparkles,
    CheckCircle2,
    Calendar,
    FileText,
    ArrowUpRight
} from 'lucide-react';
import AdminGuard from '@/components/admin/AdminGuard';

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

export default function ManualGiftCardPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [selectedPackId, setSelectedPackId] = useState('family');
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customRecipes, setCustomRecipes] = useState<3 | 5 | 6>(5);
    const [customPeople, setCustomPeople] = useState<number>(4);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
    
    const todayStr = useMemo(() => {
        return new Date().toLocaleDateString('fr-CA'); // YYYY-MM-DD local format
    }, []);

    const formatDateDMY = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    const [formData, setFormData] = useState({
        senderName: '',
        recipientName: '',
        message: '',
        deliveryEmail: '',
        startDate: new Date().toLocaleDateString('fr-CA'),
        customText: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, active: false });
    const [isEntering, setIsEntering] = useState(false);

    // State for the generated voucher details
    const [generatedVoucher, setGeneratedVoucher] = useState({
        code: '',
        expiryDate: '',
        amount: 0,
        packageName: '',
        startDate: '',
        customText: '',
    });

    // 3D Card Hover Effects
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isEntering) return;
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Rotation thresholds
        const rX = ((mouseY / height) - 0.5) * -15; // Max 15deg
        const rY = ((mouseX / width) - 0.5) * 15;
        
        // Glare positions
        const gX = (mouseX / width) * 100;
        const gY = (mouseY / height) * 100;
        
        setTilt({ x: rY, y: rX, glareX: gX, glareY: gY, active: true });
    };

    const handleMouseLeave = () => {
        setIsEntering(true);
        setTilt({ x: 0, y: 0, glareX: 50, glareY: 50, active: false });
        setTimeout(() => setIsEntering(false), 300);
    };

    const selectedPack = useMemo(() => {
        if (isCustomMode) {
            const basePrices: Record<number, number> = { 3: 120, 5: 200, 6: 240 };
            const price = basePrices[customRecipes] + (customPeople - 1) * 10;
            const timeSavedMap: Record<number, string> = { 3: '4h 45', 5: '7h 05', 6: '8h 15' };
            return {
                id: 'custom',
                name: `Formule Sur-Mesure (${customRecipes} recettes / ${customPeople} personnes)`,
                recipes: customRecipes,
                people: customPeople,
                price: price,
                groceryEstimate: 0,
                description: `Une formule sur-mesure personnalisée avec ${customRecipes} repas pour ${customPeople} personnes.`,
                timeSaved: timeSavedMap[customRecipes] || '7h 05',
            };
        }
        return PACKAGES.find(p => p.id === selectedPackId) || PACKAGES[2];
    }, [isCustomMode, selectedPackId, customRecipes, customPeople]);

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

    const handleGenerateManualCard = async () => {
        setIsSubmitting(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/admin/gift-card/manual', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer elisa2024'
                },
                body: JSON.stringify({
                    packageId: isCustomMode ? 'custom' : selectedPackId,
                    customRecipes: isCustomMode ? customRecipes : undefined,
                    customPeople: isCustomMode ? customPeople : undefined,
                    ...formData,
                }),
            });
            const data = await res.json();
            if (data.success && data.code) {
                setGeneratedVoucher({
                    code: data.code,
                    expiryDate: data.expiryDate,
                    amount: data.amount,
                    packageName: data.packageName,
                    startDate: data.startDate || '',
                    customText: data.customText || '',
                });
                setIsConfirmModalOpen(false);
                setStep(3); // Go to success page
            } else {
                setErrorMsg(data.error || 'Une erreur est survenue lors de la génération.');
                setIsConfirmModalOpen(false);
            }
        } catch (err) {
            setErrorMsg('Erreur réseau. Veuillez réessayer.');
            setIsConfirmModalOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setStep(0);
        setSelectedPackId('family');
        setIsCustomMode(false);
        setCustomRecipes(5);
        setCustomPeople(4);
        setFormData({
            senderName: '',
            recipientName: '',
            message: '',
            deliveryEmail: '',
            startDate: new Date().toLocaleDateString('fr-CA'),
            customText: '',
        });
        setGeneratedVoucher({
            code: '',
            expiryDate: '',
            amount: 0,
            packageName: '',
            startDate: '',
            customText: '',
        });
        setHasAcceptedTerms(false);
        setErrorMsg('');
    };

    return (
        <AdminGuard>
            <main className="min-h-screen bg-stone-50 py-12 md:py-20 relative overflow-hidden text-stone-900 selection:bg-brand-rose/20">
                {/* Background elements */}
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand-rose/5 blur-[120px] rounded-full -mr-20 -mt-20 -z-10" />
                <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-brand-gold/5 blur-[100px] rounded-full -ml-20 -mb-20 -z-10" />

                <div className="container mx-auto px-4 max-w-6xl relative z-10">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-[#E1567A]/10 text-[#E1567A] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
                                <Gift className="h-4 w-4" /> Espace Admin • Générateur Manuel
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight font-sans">
                                Créer une Carte Cadeau Manuelle
                            </h1>
                            <p className="text-stone-500 text-xs md:text-sm font-medium mt-1">
                                Génère une carte cadeau active sans intermédiaire de paiement.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/admin')}
                            className="rounded-full px-5 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 font-bold text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4" /> Retour à l'admin
                        </button>
                    </header>

                    {/* Check if we are in Success Screen */}
                    {step === 3 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-stone-100 space-y-8"
                        >
                            <div className="text-center space-y-3">
                                <div className="mx-auto bg-emerald-500 text-white p-4 rounded-3xl w-fit shadow-lg shadow-emerald-500/20">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">Carte Cadeau Générée ! ✨</h2>
                                <p className="text-stone-500 text-xs md:text-sm font-medium max-w-md mx-auto leading-relaxed">
                                    La carte cadeau est désormais enregistrée et active. Un e-mail contenant le PDF du bon cadeau a été envoyé à l'adresse de livraison.
                                </p>
                            </div>

                            {/* Gift Card info block */}
                            <div className="bg-stone-50 border border-stone-100 rounded-3xl p-6 md:p-8 space-y-4 text-sm max-w-lg mx-auto">
                                <div className="flex justify-between items-center pb-3 border-b border-stone-250/40">
                                    <span className="font-bold text-stone-400">Code Bon Cadeau :</span>
                                    <span className="font-black text-lg text-brand-rose select-all tracking-wider bg-rose-50 border border-brand-rose/10 px-3 py-1 rounded-xl">
                                        {generatedVoucher.code}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-stone-250/40">
                                    <span className="font-bold text-stone-400">Formule :</span>
                                    <span className="font-bold text-stone-900">{generatedVoucher.packageName}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-stone-250/40">
                                    <span className="font-bold text-stone-400">Date d'activation :</span>
                                    <span className="font-bold text-stone-900">{generatedVoucher.startDate}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-stone-250/40">
                                    <span className="font-bold text-stone-400">Date d'expiration :</span>
                                    <div className="flex items-center gap-1.5 font-bold text-stone-900">
                                        <Calendar className="h-4 w-4 text-[#F2C94C]" /> {generatedVoucher.expiryDate}
                                    </div>
                                </div>
                                {generatedVoucher.customText && (
                                    <div className="flex flex-col gap-1 pb-3 border-b border-stone-250/40 text-left">
                                        <span className="font-bold text-stone-400">Texte personnalisé :</span>
                                        <span className="font-medium text-stone-700 italic leading-relaxed">{generatedVoucher.customText}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pb-3 border-b border-stone-250/40">
                                    <span className="font-bold text-stone-400">Bénéficiaire :</span>
                                    <span className="font-bold text-stone-900">{formData.recipientName}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-stone-250/40">
                                    <span className="font-bold text-stone-400">Destinataire Email :</span>
                                    <span className="font-bold text-stone-900">{formData.deliveryEmail}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="font-bold text-stone-900 uppercase">Valeur de la prestation :</span>
                                    <span className="text-xl font-black text-brand-rose">{generatedVoucher.amount}€</span>
                                </div>
                            </div>

                            {/* IMPORTANT warning block */}
                            <div className="bg-rose-50/50 border-2 border-[#E1567A]/30 p-5 rounded-2xl flex items-start gap-4 max-w-lg mx-auto text-stone-850 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#E1567A]/5 rounded-full blur-xl pointer-events-none" />
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-[#E1567A]/10 flex items-center justify-center text-[#E1567A]">
                                    <Info className="h-5 w-5 animate-pulse" />
                                </div>
                                <div className="text-left space-y-1 z-10">
                                    <h4 className="text-xs font-black text-rose-700 uppercase tracking-wider leading-none mb-1">Action Requise : Facture Manuelle</h4>
                                    <p className="text-xs font-bold text-stone-900">N'oubliez pas d'émettre la facture !</p>
                                    <p className="text-[11px] font-medium text-stone-600 leading-relaxed">
                                        Ce bon cadeau est maintenant <strong>actif</strong>, mais aucun paiement n'a été perçu via Stripe. Vous devez <strong>créer et envoyer manuellement une facture de {generatedVoucher.amount}€</strong> à <strong>{formData.deliveryEmail}</strong> pour finaliser la transaction.
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="rounded-full px-8 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5"
                                >
                                    <Gift className="h-4 w-4" /> Créer un autre bon cadeau
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/admin')}
                                    className="rounded-full px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5"
                                >
                                    Retour au tableau de bord <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Left Panel: Form Steps */}
                            <div className="lg:col-span-6 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-stone-100 min-h-[420px] flex flex-col justify-between">
                                {/* Stepper Progress Bar */}
                                <div className="no-print-layout mb-8 flex justify-between items-center relative px-2">
                                    <div className="absolute left-6 right-6 top-[15px] h-[2px] bg-stone-100 -z-10" />
                                    <div 
                                        className="absolute left-6 top-[15px] h-[2px] bg-brand-rose -z-10 transition-all duration-300"
                                        style={{ width: `${step === 0 ? '0%' : step === 1 ? '50%' : '100%'}` }}
                                    />
                                    {[0, 1, 2].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => {
                                                if (s < step) setStep(s);
                                            }}
                                            disabled={s > step}
                                            className={`h-8 px-3 rounded-full text-xs font-bold transition-all border flex items-center justify-center ${
                                                s === step 
                                                    ? 'bg-brand-rose border-brand-rose text-white shadow-md shadow-brand-rose/25 scale-110' 
                                                    : s < step 
                                                        ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 cursor-pointer' 
                                                        : 'bg-white border-stone-200 text-stone-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {s + 1}
                                        </button>
                                    ))}
                                </div>

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
                                                <h2 className="text-xl font-bold tracking-tight mb-1 text-stone-900">1. Choisissez la Formule</h2>
                                                <p className="text-stone-400 text-xs font-medium">Sélectionnez la formule de batch cooking à offrir.</p>
                                            </div>

                                            {/* Tabs for Recommended vs Custom */}
                                            <div className="flex bg-stone-100/80 p-1.5 rounded-2xl gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCustomMode(false)}
                                                    className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all cursor-pointer border-none ${
                                                        !isCustomMode
                                                            ? 'bg-white text-stone-900 shadow-sm'
                                                            : 'text-stone-400 hover:text-stone-600 bg-transparent'
                                                    }`}
                                                >
                                                    Formules Recommandées
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCustomMode(true)}
                                                    className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all cursor-pointer border-none ${
                                                        isCustomMode
                                                            ? 'bg-white text-stone-900 shadow-sm'
                                                            : 'text-stone-400 hover:text-stone-600 bg-transparent'
                                                    }`}
                                                >
                                                    Formule Sur-Mesure
                                                </button>
                                            </div>

                                            {!isCustomMode ? (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {PACKAGES.map((pack) => {
                                                        const isSelected = selectedPackId === pack.id;
                                                        return (
                                                            <button
                                                                key={pack.id}
                                                                type="button"
                                                                onClick={() => setSelectedPackId(pack.id)}
                                                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                                                                    isSelected
                                                                        ? 'border-brand-rose bg-rose-50/10 shadow-md shadow-brand-rose/5'
                                                                        : 'border-stone-100 bg-white hover:border-stone-200'
                                                                }`}
                                                            >
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-black text-stone-900">{pack.name}</span>
                                                                        {pack.badge && (
                                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                                                pack.isRecommended ? 'bg-brand-rose text-white' : 'bg-stone-150 text-stone-500'
                                                                            }`}>
                                                                                {pack.badge}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[11px] text-stone-400 leading-snug font-medium max-w-[280px]">
                                                                        {pack.recipes} recettes • {pack.people} personnes • environ {pack.timeSaved} d'autonomie
                                                                    </p>
                                                                </div>
                                                                <div className="text-right ml-4">
                                                                    <span className="text-lg font-black text-stone-950">{pack.price}€</span>
                                                                    <span className="text-[9px] text-stone-400 block uppercase font-bold">Service seul</span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {/* Selector: People */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Nombre de personnes</span>
                                                            <span className="text-xs font-bold text-brand-rose">{customPeople} personnes</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {[2, 3, 4, 5, 6].map((p) => (
                                                                <button
                                                                    key={p}
                                                                    type="button"
                                                                    onClick={() => setCustomPeople(p)}
                                                                    className={`flex-1 py-3 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                                                        customPeople === p
                                                                            ? 'bg-brand-rose border-brand-rose text-white shadow-md shadow-brand-rose/10'
                                                                            : 'bg-stone-50 border-stone-100 hover:border-stone-200 text-stone-600'
                                                                    }`}
                                                                >
                                                                    {p}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Selector: Recipes */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Nombre de repas / recettes</span>
                                                            <span className="text-xs font-bold text-brand-rose">{customRecipes} recettes</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {[3, 5, 6].map((r) => (
                                                                <button
                                                                    key={r}
                                                                    type="button"
                                                                    onClick={() => setCustomRecipes(r as 3 | 5 | 6)}
                                                                    className={`flex-1 py-3 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                                                        customRecipes === r
                                                                            ? 'bg-brand-rose border-brand-rose text-white shadow-md shadow-brand-rose/10'
                                                                            : 'bg-stone-50 border-stone-100 hover:border-stone-200 text-stone-600'
                                                                    }`}
                                                                >
                                                                    {r} recettes
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Portion info & Pricing details */}
                                                    <div className="bg-stone-50/50 border border-stone-100 rounded-2xl p-5 flex justify-between items-center relative overflow-hidden">
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-bold text-stone-900">Total : {customRecipes * customPeople} portions / assiettes</p>
                                                            <p className="text-[10px] text-stone-400 font-medium leading-tight">
                                                                Idéal pour couvrir {customRecipes} repas complets de la semaine.
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xl font-black text-stone-950">{selectedPack.price}€</span>
                                                            <span className="text-[9px] text-stone-400 block uppercase font-bold">Service seul</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-col items-center gap-3 pt-4">
                                                <p className="text-[10px] text-stone-400 text-center font-medium">
                                                    💡 Les bons cadeaux ont une validité de 6 mois à compter de leur date d'activation.
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
                                                    <label htmlFor="deliveryEmail" className="text-[10px] font-black uppercase text-stone-400 ml-1 font-bold">Email du destinataire facture/livraison</label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                                                        <input
                                                            id="deliveryEmail"
                                                            type="email"
                                                            placeholder="client@email.com"
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

                                                <div className="border-t border-stone-100/60 pt-4 space-y-4">
                                                    <div className="space-y-1.5">
                                                        <label htmlFor="startDate" className="text-[10px] font-black uppercase text-stone-400 ml-1 font-bold">Date de début de validité</label>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300 pointer-events-none" />
                                                            <input
                                                                id="startDate"
                                                                type="date"
                                                                className="w-full pl-11 pr-4 h-12 rounded-xl border-2 border-stone-100 bg-stone-50/50 text-xs focus:border-brand-rose focus:ring-none outline-none text-stone-950 font-bold"
                                                                value={formData.startDate}
                                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                            />
                                                        </div>
                                                        <p className="text-[9px] text-stone-400 italic leading-snug ml-1">
                                                            Par défaut : aujourd'hui. La date d'expiration de 6 mois sera calculée à partir de cette date de début.
                                                        </p>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label htmlFor="customText" className="text-[10px] font-black uppercase text-stone-400 ml-1 font-bold">Texte personnalisé sur le bon (optionnel)</label>
                                                        <div className="relative">
                                                            <FileText className="absolute left-4 top-4 h-4 w-4 text-stone-300 pointer-events-none" />
                                                            <textarea
                                                                id="customText"
                                                                placeholder="Ex: Pour 1 mois d'abonnement au Batch Cooking (4 séances)..."
                                                                className="w-full pl-11 pr-4 py-3 h-20 rounded-xl border-2 border-stone-100 bg-stone-50/50 text-xs focus:border-brand-rose focus:ring-none outline-none text-stone-950 font-bold resize-none"
                                                                value={formData.customText}
                                                                onChange={(e) => setFormData({ ...formData, customText: e.target.value })}
                                                            />
                                                        </div>
                                                        <p className="text-[9px] text-stone-400 italic leading-snug ml-1">
                                                            Remplace le descriptif par défaut de la formule sur l'aperçu visuel de la carte.
                                                        </p>
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
                                                <h2 className="text-xl font-bold tracking-tight mb-1 text-stone-900">3. Confirmation & Génération</h2>
                                                <p className="text-stone-400 text-xs font-medium">Vérifiez les détails du bon cadeau avant d'activer.</p>
                                            </div>

                                            <div className="bg-stone-50 border border-stone-100 rounded-2xl p-5 space-y-4 text-xs">
                                                <div className="flex justify-between items-center pb-3 border-b border-stone-200/50">
                                                    <span className="font-bold text-stone-400">Formule :</span>
                                                    <span className="font-bold text-stone-900">{selectedPack.name}</span>
                                                </div>
                                                <div className="flex justify-between items-center pb-3 border-b border-stone-200/50">
                                                    <span className="font-bold text-stone-400">Valeur de la prestation :</span>
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
                                                    <span className="font-bold text-stone-900 uppercase">Total à facturer :</span>
                                                    <span className="text-lg font-black text-brand-rose">{selectedPack.price}€</span>
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
                                                    Générer la Carte Cadeau
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

                                {/* Wrapper for floating card and floor shadow */}
                                <div 
                                    style={{ perspective: 1000 }}
                                    className="relative w-full max-w-xl aspect-[1.58/1] flex items-center justify-center mt-4"
                                >
                                    {/* Floor Shadow */}
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

                                    {/* Dynamic gift card container */}
                                    <motion.div
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={handleMouseLeave}
                                        animate={{
                                            rotateX: tilt.y,
                                            rotateY: tilt.x,
                                            y: tilt.active ? -12 : 0,
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
                                        className="bg-gradient-to-br from-stone-50 via-white to-rose-50/15 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 border border-stone-100/80 overflow-hidden relative w-full h-full flex flex-col justify-between select-none cursor-default shadow-lg"
                                    >
                                        {/* Glare Effect overlay */}
                                        <div
                                            style={{
                                                background: tilt.active
                                                    ? `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.22) 0%, transparent 55%)`
                                                    : "transparent",
                                            }}
                                            className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
                                        />

                                        <div style={{ transform: "translateZ(20px)" }} className="absolute inset-3 sm:inset-4.5 border-2 sm:border-[3px] border-brand-gold/45 rounded-[1.45rem] sm:rounded-[1.75rem] pointer-events-none transition-transform duration-200" />
                                        <div className="absolute inset-3.5 sm:inset-5 border border-stone-100/30 rounded-[1.40rem] sm:rounded-[1.70rem] pointer-events-none" />
                                        
                                        {/* Header row */}
                                        <div style={{ transform: "translateZ(35px)" }} className="flex justify-between items-center w-full z-10 transition-transform duration-200">
                                            <div className="flex items-center gap-2 sm:gap-4">
                                                <img
                                                    src="/images/logo.jpg"
                                                    alt="Logo"
                                                    className="h-9 w-9 sm:h-12 sm:w-12 object-contain rounded-full border border-stone-200/50 shadow-sm"
                                                />
                                                <span className="text-xs sm:text-base md:text-lg font-black tracking-tight text-stone-900">
                                                    Elisa <span className="text-brand-rose">Batch Cooking</span>
                                                </span>
                                            </div>
                                            <div className="text-[9px] sm:text-xs font-black tracking-[0.2em] text-stone-400 uppercase">
                                                BON CADEAU
                                            </div>
                                        </div>

                                        {/* Main message */}
                                        <div style={{ transform: "translateZ(50px)" }} className="my-auto px-2 py-2 sm:py-4 flex flex-col justify-center items-center text-center z-10 transition-transform duration-200 w-full">
                                            <p className="font-handwriting text-brand-rose text-xs sm:text-sm md:text-base lg:text-sm xl:text-base leading-relaxed max-w-[85%] mx-auto font-bold whitespace-pre-wrap break-words">
                                                {formData.customText.trim() !== '' 
                                                    ? formData.customText 
                                                    : `Pour une séance de Batch Cooking avec ${selectedPack.recipes} plats maison pour ${selectedPack.people} personnes préparés chez vous`
                                                }
                                            </p>
                                        </div>

                                        {/* Footer info */}
                                        <div style={{ transform: "translateZ(30px)" }} className="flex justify-between items-end text-stone-900 z-10 transition-transform duration-200">
                                            {/* Left Side: Names */}
                                            <div className="text-left space-y-0.5">
                                                <div>
                                                    <span className="text-[7px] font-bold text-stone-400 uppercase tracking-widest block leading-none">Offert à</span>
                                                    <span className="text-[9px] sm:text-xs font-black text-stone-850 leading-tight block font-sans">
                                                        {formData.recipientName || 'Marie Martin'}
                                                    </span>
                                                </div>
                                                <div className="pt-0.5 sm:pt-1">
                                                    <span className="text-[7px] font-bold text-stone-400 uppercase tracking-widest block leading-none">De la part de</span>
                                                    <span className="text-[9px] sm:text-xs font-black text-stone-850 leading-tight block font-sans">
                                                        {formData.senderName || 'Thomas Bernard'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right Side: Expiry */}
                                            <div className="text-right pb-0.5">
                                                <span className="text-[7px] font-bold text-stone-400 uppercase tracking-widest block leading-none">Validité</span>
                                                <span className="text-[9px] sm:text-xs font-black text-stone-850 leading-tight block font-sans">
                                                    {formData.startDate && formData.startDate !== todayStr
                                                        ? `6 mois (dès le ${formatDateDMY(formData.startDate)})`
                                                        : '6 mois'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    )}
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
                                    <h3 className="text-xl font-bold tracking-tight text-stone-900 mb-1">Génération de la Carte Cadeau</h3>
                                    <p className="text-stone-400 text-xs font-medium">Veuillez prendre connaissance des conditions de génération manuelle.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-3 items-start bg-rose-50/35 p-4 rounded-2xl border border-rose-100/30">
                                        <Info className="h-5 w-5 text-brand-rose shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-bold text-stone-900 mb-1">Facturation Directe</h4>
                                            <p className="text-[10px] text-stone-600 leading-relaxed font-medium">
                                                Aucun débit bancaire en ligne ne sera effectué. En générant cette carte cadeau, vous acceptez de <strong>créer et transmettre manuellement la facture correspondante</strong> au client.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 items-start bg-amber-50/35 p-4 rounded-2xl border border-amber-100/30">
                                        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-bold text-stone-900 mb-1">Envoi Automatique par E-mail</h4>
                                            <p className="text-[10px] text-stone-600 leading-relaxed font-medium">
                                                Le destinataire renseigné (<strong>{formData.deliveryEmail}</strong>) recevra automatiquement le bon cadeau sous format PDF avec son code unique de réservation.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 items-start bg-emerald-50/35 p-4 rounded-2xl border border-emerald-100/30">
                                        <Info className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-bold text-stone-900 mb-1">Validité du bon (6 mois)</h4>
                                            <p className="text-[10px] text-stone-600 leading-relaxed font-medium">
                                                Le bon cadeau généré sera immédiatement <strong>Actif</strong> et valable 6 mois à compter d'aujourd'hui.
                                            </p>
                                        </div>
                                    </div>
                                </div>

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
                                        Je confirme vouloir activer ce bon cadeau et m'engage à créer la facture manuellement de {selectedPack.price}€.
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
                                        onClick={handleGenerateManualCard}
                                        className="flex-1 rounded-full py-3 bg-brand-rose hover:bg-brand-rose/90 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none flex items-center justify-center gap-1.5"
                                    >
                                        {isSubmitting ? 'Génération...' : 'Confirmer & Générer'}
                                        <ShieldCheck className="h-4 w-4" />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </AdminGuard>
    );
}
