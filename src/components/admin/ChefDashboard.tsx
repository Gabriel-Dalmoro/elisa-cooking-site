'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Calendar, LogOut, Navigation, ShoppingCart, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getBuildInfo } from '@/lib/version';

/**
 * A chef's admin home: only their day-to-day tools (their calendar, their clients, their shopping).
 * The business tools (prices, gift cards, Instagram, Airbnb pages, team, menu editing) stay Elisa's.
 */
export default function ChefDashboard({ displayName, refused }: { displayName: string | null; refused?: boolean }) {
    const router = useRouter();
    const build = getBuildInfo();

    const logout = async () => {
        await createSupabaseBrowserClient().auth.signOut();
        router.replace('/admin/login');
        router.refresh();
    };

    const tiles = [
        { href: '/admin/aujourd-hui', icon: Navigation, title: 'Aujourd’hui / En route', text: 'Vos clients du jour, itinéraires et fiches cuisine.', tone: 'bg-stone-900 text-white' },
        { href: '/admin/semaine', icon: Calendar, title: 'Mon planning', text: 'Vos séances de la semaine, les choix de vos clients, ajouter ou déplacer une séance.', tone: 'bg-amber-600 text-white' },
        { href: '/admin/clients', icon: Users, title: 'Mes clients', text: 'Coordonnées, allergies, notes cuisine et liens de choix des plats.', tone: 'bg-[#E1567A] text-white' },
        { href: '/admin/courses', icon: ShoppingCart, title: 'Courses groupées', text: 'Une seule liste pour plusieurs clients, avec la part de chacun.', tone: 'bg-emerald-600 text-white' }
    ];

    return (
        <div className="min-h-screen bg-[#FAFAF9] py-12 md:py-16 text-stone-900 font-sans">
            <div className="container mx-auto px-4 max-w-3xl space-y-8">
                <header className="flex justify-between items-start gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-[#E1567A] font-serif italic text-lg mb-1">
                            <span className="h-2 w-2 rounded-full bg-[#E1567A]" /> Espace chef
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Bonjour{displayName ? ` ${displayName.split(/\s+/)[0]}` : ''} ! 👨‍🍳</h1>
                        <p className="text-stone-500 text-xs md:text-sm font-medium mt-1">Vos clients et vos séances, attribués par Elisa.</p>
                    </div>
                    <Button onClick={logout} variant="outline" className="rounded-full px-4 border-stone-200 text-stone-500 font-bold text-xs gap-2 bg-white shrink-0">
                        <LogOut className="h-3.5 w-3.5" /> Déconnexion
                    </Button>
                </header>

                {refused && (
                    <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-3 text-sm font-medium">
                        Cette page est réservée à Elisa. Voici vos outils.
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tiles.map(t => (
                        <Card
                            key={t.href}
                            onClick={() => router.push(t.href)}
                            className="cursor-pointer rounded-3xl p-5 border-stone-200 bg-white hover:shadow-lg hover:border-[#E1567A]/40 transition-all select-none flex flex-col gap-3"
                        >
                            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${t.tone}`}>
                                <t.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold font-serif">{t.title}</h3>
                                <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{t.text}</p>
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-[#E1567A] mt-auto">Ouvrir <ArrowRight className="h-3.5 w-3.5" /></span>
                        </Card>
                    ))}
                </div>

                <p className="text-center text-[10px] text-stone-400">
                    v{build.version}{build.env ? ` · ${build.env}` : ''}
                </p>
            </div>
        </div>
    );
}
