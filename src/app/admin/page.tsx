"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    ShieldCheck, 
    ChefHat, 
    BookOpen, 
    Gift, 
    LogOut, 
    ArrowRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

function AdminDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [authError, setAuthError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const isAuth = sessionStorage.getItem('admin_auth') === 'true';
        if (isAuth) {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === 'elisa2024') {
            sessionStorage.setItem('admin_auth', 'true');
            setIsAuthenticated(true);
            setAuthError(false);

            // Check if there is a redirect query parameter
            const redirectUrl = searchParams.get('redirect');
            if (redirectUrl) {
                router.replace(decodeURIComponent(redirectUrl));
            }
        } else {
            setAuthError(true);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('admin_auth');
        setIsAuthenticated(false);
        setPasswordInput('');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E1567A]"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] p-4 relative overflow-hidden select-none">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#E1567A]/5 blur-[100px] rounded-full -mr-20 -mt-20 -z-10" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F2C94C]/5 blur-[100px] rounded-full -ml-20 -mb-20 -z-10" />

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    <Card className="shadow-xl border-stone-100/80 bg-white/80 backdrop-blur-md rounded-3xl p-2">
                        <CardHeader className="text-center space-y-2 pt-6">
                            <div className="mx-auto bg-stone-900 text-white p-3.5 rounded-2xl w-fit shadow-lg shadow-stone-900/10 mb-2">
                                <ShieldCheck className="w-6 h-6 text-[#F2C94C]" />
                            </div>
                            <CardTitle className="text-2xl font-black text-stone-900 tracking-tight">Espace Admin Elisa</CardTitle>
                            <CardDescription className="text-stone-500 text-xs font-medium max-w-[280px] mx-auto leading-relaxed">
                                Veuillez entrer le mot de passe administrateur pour accéder aux outils de gestion.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-[10px] font-black uppercase text-stone-400 ml-1">Mot de passe</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={passwordInput}
                                        onChange={(e) => {
                                            setPasswordInput(e.target.value);
                                            if (authError) setAuthError(false);
                                        }}
                                        placeholder="••••••••"
                                        className="text-lg text-center tracking-widest h-12 rounded-xl border-stone-200 focus:border-[#E1567A] focus:ring-0 bg-stone-50/50"
                                    />
                                </div>
                                {authError && (
                                    <motion.p 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-rose-500 text-xs font-bold text-center mt-1"
                                    >
                                        Mot de passe incorrect
                                    </motion.p>
                                )}
                                <Button 
                                    type="submit" 
                                    className="w-full bg-stone-900 hover:bg-stone-850 text-white font-bold h-12 rounded-xl transition-all shadow-md shadow-stone-900/10 cursor-pointer"
                                >
                                    Se connecter
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAF9] py-12 md:py-20 relative overflow-hidden text-stone-900 font-sans selection:bg-[#E1567A]/20">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[#E1567A]/5 blur-[120px] rounded-full -mr-20 -mt-20 -z-10" />
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-[#F2C94C]/5 blur-[100px] rounded-full -ml-20 -mb-20 -z-10" />

            <div className="container mx-auto px-4 max-w-5xl relative z-10">
                {/* Header */}
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <div className="flex items-center gap-2 text-[#E1567A] font-serif italic text-lg mb-1">
                            <span className="h-2 w-2 rounded-full bg-[#E1567A]"></span>
                            Administration
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">Bonjour Elisa ! ✨</h1>
                        <p className="text-stone-500 text-xs md:text-sm font-medium mt-1">Sélectionnez l'outil que vous souhaitez utiliser aujourd'hui.</p>
                    </div>
                    <Button 
                        onClick={handleLogout}
                        variant="outline"
                        className="rounded-full px-4 py-2 border-stone-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-stone-500 font-bold text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer bg-white"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Déconnexion
                    </Button>
                </header>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Calculator */}
                    <motion.div
                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        className="flex"
                    >
                        <Card 
                            onClick={() => router.push('/admin/calculateur')}
                            className="w-full flex flex-col justify-between hover:shadow-xl hover:shadow-stone-900/5 transition-all duration-300 border-stone-100 hover:border-[#E1567A]/30 cursor-pointer bg-white rounded-[2rem] p-6 relative overflow-hidden group select-none"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E1567A]/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-[#E1567A]/10 transition-colors" />
                            <div className="space-y-4 relative z-10">
                                <div className="h-12 w-12 rounded-2xl bg-[#E1567A]/10 flex items-center justify-center text-[#E1567A] group-hover:scale-110 transition-transform duration-300">
                                    <ChefHat className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-stone-900">Calculateur de Prestations</h3>
                                    <p className="text-xs text-stone-500 leading-relaxed font-medium">
                                        Estimez et générez des devis personnalisés pour vos séances de batch cooking et déduisez le crédit d'impôt.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-[#E1567A] pt-6 mt-auto relative z-10 group-hover:translate-x-1 transition-transform">
                                Ouvrir le calculateur <ArrowRight className="h-4 w-4" />
                            </div>
                        </Card>
                    </motion.div>

                    {/* Card 2: Guest Book */}
                    <motion.div
                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        className="flex"
                    >
                        <Card 
                            onClick={() => router.push('/welcome-villa')}
                            className="w-full flex flex-col justify-between hover:shadow-xl hover:shadow-stone-900/5 transition-all duration-300 border-stone-100 hover:border-[#E1567A]/30 cursor-pointer bg-white rounded-[2rem] p-6 relative overflow-hidden group select-none"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F2C94C]/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-[#F2C94C]/15 transition-colors" />
                            <div className="space-y-4 relative z-10">
                                <div className="h-12 w-12 rounded-2xl bg-[#F2C94C]/20 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-300">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-stone-900">Fiches Guest Book (Airbnb)</h3>
                                    <p className="text-xs text-stone-500 leading-relaxed font-medium">
                                        Personnalisez et imprimez des fiches d'accueil A4 élégantes pour vos hébergements partenaires à Annecy.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 pt-6 mt-auto relative z-10 group-hover:translate-x-1 transition-transform">
                                Générer les fiches <ArrowRight className="h-4 w-4" />
                            </div>
                        </Card>
                    </motion.div>

                    {/* Card 3: Manual Gift Card */}
                    <motion.div
                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        className="flex"
                    >
                        <Card 
                            onClick={() => router.push('/admin/carte-cadeau-manuel')}
                            className="w-full flex flex-col justify-between hover:shadow-xl hover:shadow-stone-900/5 transition-all duration-300 border-stone-100 hover:border-[#E1567A]/30 cursor-pointer bg-white rounded-[2rem] p-6 relative overflow-hidden group select-none"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E1567A]/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-[#E1567A]/10 transition-colors" />
                            <div className="space-y-4 relative z-10">
                                <div className="h-12 w-12 rounded-2xl bg-[#E1567A]/10 flex items-center justify-center text-[#E1567A] group-hover:scale-110 transition-transform duration-300">
                                    <Gift className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-stone-900">Carte Cadeau Manuelle</h3>
                                    <p className="text-xs text-stone-500 leading-relaxed font-medium">
                                        Générez manuellement des bons cadeaux actifs pour vos clients directs sans passer par le paiement en ligne.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-[#E1567A] pt-6 mt-auto relative z-10 group-hover:translate-x-1 transition-transform">
                                Créer une carte cadeau <ArrowRight className="h-4 w-4" />
                            </div>
                        </Card>
                    </motion.div>
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
