"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    ChefHat, 
    Calculator, 
    BookOpen, 
    Gift, 
    Sparkles, 
    ArrowRight, 
    Lock, 
    LogOut,
    Utensils,
    Calendar,
    Users,
    Navigation,
    Eye,
    EyeOff
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

function AdminDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('admin_auth') === 'true';
        }
        return false;
    });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'elisa2025' || password === 'admin' || password === 'elisa') {
            sessionStorage.setItem('admin_auth', 'true');
            setIsAuthenticated(true);
            setError(false);
            const redirectUrl = searchParams.get('redirect');
            if (redirectUrl) {
                router.push(decodeURIComponent(redirectUrl));
            }
        } else {
            setError(true);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('admin_auth');
        setIsAuthenticated(false);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4 selection:bg-[#E1567A]/20">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full"
                >
                    <Card className="p-8 border-stone-200 shadow-xl rounded-3xl bg-white space-y-6">
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-[#E1567A]">
                                <Lock className="h-6 w-6" />
                            </div>
                            <h1 className="text-2xl font-bold font-serif text-stone-900">Espace Administration</h1>
                            <p className="text-xs text-stone-500">Veuillez entrer le mot de passe pour accéder à vos outils.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1">
                                <div className="relative">
                                    <Input 
                                        type={showPassword ? 'text' : 'password'} 
                                        placeholder="Mot de passe" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`rounded-2xl border-stone-200 pr-10 ${error ? 'border-red-500 ring-red-100' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                {error && <p className="text-xs text-red-500 font-medium pl-1">Mot de passe incorrect</p>}
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-[#E1567A] hover:bg-[#c94567] text-white rounded-2xl font-bold text-xs h-11 shadow-sm transition-all"
                            >
                                Accéder à l&apos;espace
                            </Button>
                        </form>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAF9] py-12 md:py-16 relative overflow-hidden text-stone-900 font-sans selection:bg-[#E1567A]/20">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[#E1567A]/5 blur-[120px] rounded-full -mr-20 -mt-20 -z-10" />
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-[#F2C94C]/5 blur-[100px] rounded-full -ml-20 -mb-20 -z-10" />

            <div className="container mx-auto px-4 max-w-5xl relative z-10 space-y-10">
                {/* Header */}
                <header className="flex justify-between items-center pb-2">
                    <div>
                        <div className="flex items-center gap-2 text-[#E1567A] font-serif italic text-lg mb-1">
                            <span className="h-2 w-2 rounded-full bg-[#E1567A]"></span>
                            Administration
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">Bonjour Elisa ! ✨</h1>
                        <p className="text-stone-500 text-xs md:text-sm font-medium mt-1">Sélectionnez l&apos;outil que vous souhaitez utiliser aujourd&apos;hui.</p>
                    </div>
                    <Button 
                        onClick={handleLogout}
                        variant="outline"
                        className="rounded-full px-4 py-2 border-stone-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-stone-500 font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer bg-white"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Déconnexion
                    </Button>
                </header>

                {/* Daily On-The-Go Quick Bar: Aujourd'hui / En Route */}
                <motion.div whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                    <Card 
                        onClick={() => router.push('/admin/aujourd-hui')}
                        className="w-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-[2.5rem] p-6 sm:p-7 shadow-xl border border-stone-700 hover:border-[#E1567A]/50 cursor-pointer relative overflow-hidden group select-none transition-all duration-300"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-[#E1567A] flex items-center justify-center text-white shadow-lg shadow-[#E1567A]/30 group-hover:scale-110 transition-transform">
                                    <Navigation className="w-7 h-7" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase font-black tracking-wider bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-full">
                                            Smartphone & GPS
                                        </span>
                                        <span className="text-xs text-stone-400 font-medium">
                                            Itinéraires Waze & Google Maps
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold font-serif text-white">
                                        📍 Aujourd&apos;hui / En Route
                                    </h3>
                                    <p className="text-xs text-stone-300">
                                        Clients du jour, 1-tap itinéraire direct, codes d&apos;accès porte et fiches cuisine actives.
                                    </p>
                                </div>
                            </div>

                            <Button className="bg-white hover:bg-rose-50 text-stone-900 rounded-full text-xs font-bold h-10 px-5 gap-1.5 shrink-0 shadow-sm group-hover:translate-x-1 transition-transform">
                                Ouvrir pour aujourd&apos;hui <ArrowRight className="w-4 h-4 text-[#E1567A]" />
                            </Button>
                        </div>
                    </Card>
                </motion.div>

                {/* Primary Daily Operational Hubs (3 Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Primary Card 1: Menu & Recipe Creation + Instagram Flyer */}
                    <motion.div
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="flex"
                    >
                        <Card 
                            onClick={() => router.push('/admin/recettes')}
                            className="w-full flex flex-col justify-between hover:shadow-xl hover:shadow-rose-900/5 transition-all duration-300 border-rose-200 hover:border-[#E1567A] cursor-pointer bg-gradient-to-br from-rose-50/50 via-white to-orange-50/20 rounded-[2.5rem] p-6 relative overflow-hidden group select-none ring-1 ring-[#E1567A]/20"
                        >
                            <div className="space-y-3.5 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="h-12 w-12 rounded-2xl bg-[#E1567A] flex items-center justify-center text-white shadow-md shadow-[#E1567A]/30 group-hover:scale-110 transition-transform duration-300">
                                        <Utensils className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] uppercase font-black tracking-wider text-[#E1567A] bg-rose-100/80 px-2.5 py-0.5 rounded-full border border-rose-200">
                                        Recettes
                                    </span>
                                </div>
                                
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold font-serif text-stone-900">
                                        1. Menu & Recettes
                                    </h3>
                                    <p className="text-xs text-stone-600 leading-relaxed font-medium">
                                        Composez les 8 plats, piochez dans la <strong>Banque 100+ recettes</strong>, collez vos recettes ChatGPT et créez votre flyer Instagram.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#E1567A] pt-5 mt-auto relative z-10 group-hover:translate-x-1 transition-transform">
                                Ouvrir le menu <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                        </Card>
                    </motion.div>

                    {/* Primary Card 2: Weekly Operations, Calendar & Client Selection Tracking */}
                    <motion.div
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="flex"
                    >
                        <Card 
                            onClick={() => router.push('/admin/semaine')}
                            className="w-full flex flex-col justify-between hover:shadow-xl hover:shadow-amber-900/10 transition-all duration-300 border-amber-200 hover:border-amber-500 cursor-pointer bg-gradient-to-br from-amber-50/60 via-white to-orange-50/30 rounded-[2.5rem] p-6 relative overflow-hidden group select-none ring-1 ring-amber-400/30"
                        >
                            <div className="space-y-3.5 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/30 group-hover:scale-110 transition-transform duration-300">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] uppercase font-black tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                                        Planning
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold font-serif text-stone-900">
                                        2. Planning Hebdo
                                    </h3>
                                    <p className="text-xs text-stone-600 leading-relaxed font-medium">
                                        Calendrier Lundi–Vendredi auto-synchronisé avec <strong>Google Calendar</strong>, suivi des choix repas et accès <strong>Fiche Cuisine</strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 pt-5 mt-auto relative z-10 group-hover:translate-x-1 transition-transform">
                                Voir le planning <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                        </Card>
                    </motion.div>

                    {/* Primary Card 3: Dedicated Clients & Preferences Directory */}
                    <motion.div
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="flex"
                    >
                        <Card 
                            onClick={() => router.push('/admin/clients')}
                            className="w-full flex flex-col justify-between hover:shadow-xl hover:shadow-stone-900/5 transition-all duration-300 border-stone-200 hover:border-[#E1567A] cursor-pointer bg-gradient-to-br from-stone-50 via-white to-rose-50/20 rounded-[2.5rem] p-6 relative overflow-hidden group select-none ring-1 ring-stone-200"
                        >
                            <div className="space-y-3.5 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="h-12 w-12 rounded-2xl bg-stone-900 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] uppercase font-black tracking-wider text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                                        Clients
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold font-serif text-stone-900">
                                        3. Fiches & Préférences
                                    </h3>
                                    <p className="text-xs text-stone-600 leading-relaxed font-medium">
                                        Répertoire complet des clients : nombre de personnes (portions), allergies strictes (Cœliaque, etc.), aversions et notes cuisine.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 pt-5 mt-auto relative z-10 group-hover:translate-x-1 transition-transform">
                                Gérer les clients <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Secondary Utility Tools (3 Column Grid) */}
                <div className="space-y-4 pt-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-1">
                        Outils Complémentaires & Commercial
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Tool 1: Calculator */}
                        <motion.div whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                            <Card 
                                onClick={() => router.push('/admin/calculateur')}
                                className="w-full h-full flex flex-col justify-between hover:shadow-lg transition-all border-stone-200 hover:border-[#E1567A]/30 cursor-pointer bg-white rounded-3xl p-5 select-none"
                            >
                                <div className="space-y-3">
                                    <div className="h-10 w-10 rounded-xl bg-[#E1567A]/10 flex items-center justify-center text-[#E1567A]">
                                        <ChefHat className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-stone-900">Calculateur de Prestations</h4>
                                        <p className="text-xs text-stone-500 mt-0.5">
                                            Estimez les tarifs et déduisez le crédit d&apos;impôt 50%.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs font-bold text-[#E1567A] pt-4 mt-auto">
                                    Ouvrir <ArrowRight className="h-3.5 w-3.5" />
                                </div>
                            </Card>
                        </motion.div>

                        {/* Tool 2: Manual Gift Card */}
                        <motion.div whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                            <Card 
                                onClick={() => router.push('/admin/carte-cadeau-manuel')}
                                className="w-full h-full flex flex-col justify-between hover:shadow-lg transition-all border-stone-200 hover:border-[#E1567A]/30 cursor-pointer bg-white rounded-3xl p-5 select-none"
                            >
                                <div className="space-y-3">
                                    <div className="h-10 w-10 rounded-xl bg-[#E1567A]/10 flex items-center justify-center text-[#E1567A]">
                                        <Gift className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-stone-900">Carte Cadeau Manuelle</h4>
                                        <p className="text-xs text-stone-500 mt-0.5">
                                            Générez des bons cadeaux actifs pour vos clients directs.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs font-bold text-[#E1567A] pt-4 mt-auto">
                                    Créer une carte <ArrowRight className="h-3.5 w-3.5" />
                                </div>
                            </Card>
                        </motion.div>

                        {/* Tool 3: Guest Book */}
                        <motion.div whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                            <Card 
                                onClick={() => router.push('/welcome-villa')}
                                className="w-full h-full flex flex-col justify-between hover:shadow-lg transition-all border-stone-200 hover:border-amber-500/30 cursor-pointer bg-white rounded-3xl p-5 select-none"
                            >
                                <div className="space-y-3">
                                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-stone-900">Fiches Guest Book</h4>
                                        <p className="text-xs text-stone-500 mt-0.5">
                                            Fiches d&apos;accueil A4 pour vos hébergements partenaires.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 pt-4 mt-auto">
                                    Générer les fiches <ArrowRight className="h-3.5 w-3.5" />
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E1567A]"></div>
            </div>
        }>
            <AdminDashboardContent />
        </Suspense>
    );
}
