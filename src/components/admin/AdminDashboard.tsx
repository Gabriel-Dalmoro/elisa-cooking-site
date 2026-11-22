'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    BookHeart,
    Calculator,
    Calendar,
    Gift,
    Image as ImageIcon,
    LogOut,
    Navigation,
    ShoppingCart,
    UserPlus,
    Users,
    Utensils,
    type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getBuildInfo } from '@/lib/version';

interface Tile { href: string; icon: LucideIcon; title: string; tone: string }

/**
 * The admin home, the same for Elisa and her chefs: a chef just gets fewer tiles
 * (no menu editing, prices, gift cards, Instagram, team or guest books).
 */
export default function AdminDashboard({
    displayName, isOwner, refused
}: {
    displayName: string | null;
    isOwner: boolean;
    refused?: boolean;
}) {
    const build = getBuildInfo();
    const router = useRouter();
    const firstName = displayName?.split(/\s+/)[0];

    // Access is enforced server-side (middleware + API checks); this only ends the session
    const handleLogout = async () => {
        await createSupabaseBrowserClient().auth.signOut();
        router.replace('/admin/login');
        router.refresh();
    };

    const main: Tile[] = [
        { href: '/admin/semaine', icon: Calendar, title: isOwner ? 'Planning' : 'Mon planning', tone: 'bg-amber-500' },
        ...(isOwner ? [{ href: '/admin/recettes', icon: Utensils, title: 'Menu & recettes', tone: 'bg-[#E1567A]' }] : []),
        { href: '/admin/clients', icon: Users, title: isOwner ? 'Clients' : 'Mes clients', tone: 'bg-sky-600' }
    ];
    const more: Tile[] = [
        { href: '/admin/courses', icon: ShoppingCart, title: 'Courses groupées', tone: 'bg-emerald-600' },
        ...(isOwner ? [
            { href: '/admin/menu-visuel?offset=1', icon: ImageIcon, title: 'Flyer Instagram', tone: 'bg-gradient-to-br from-[#E1567A] to-amber-500' },
            { href: '/admin/equipe', icon: UserPlus, title: 'Équipe', tone: 'bg-stone-700' }
        ] : [])
    ];
    const tools: Tile[] = isOwner ? [
        { href: '/admin/calculateur', icon: Calculator, title: 'Calculateur de prestations', tone: 'bg-stone-500' },
        { href: '/admin/carte-cadeau-manuel', icon: Gift, title: 'Carte cadeau', tone: 'bg-stone-500' },
        { href: '/welcome-villa', icon: BookHeart, title: 'Fiches guest book', tone: 'bg-stone-500' }
    ] : [];

    return (
        <div className="min-h-screen bg-[#FAFAF9] py-10 md:py-14 text-stone-900 font-sans">
            <div className="mx-auto px-4 max-w-5xl space-y-8">
                <header className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                        <p className="t-label text-[#E1567A]">{isOwner ? 'Administration' : 'Espace chef'}</p>
                        <h1 className="t-page-title">Bonjour{firstName ? ` ${firstName}` : ''}</h1>
                    </div>
                    <Button onClick={handleLogout} variant="outline" className="rounded-full h-9 px-4 border-stone-200 text-stone-600 font-semibold text-xs gap-1.5 bg-white shrink-0 hover:text-rose-600 hover:border-rose-200">
                        <LogOut className="h-3.5 w-3.5" /> Déconnexion
                    </Button>
                </header>

                {refused && (
                    <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-3 text-sm">
                        Cette page est réservée à Elisa.
                    </div>
                )}

                {/* The day: clients, routes, dish sheets */}
                <Link
                    href="/admin/aujourd-hui"
                    className="group flex items-center justify-between gap-4 rounded-[2rem] bg-stone-900 text-white p-5 sm:p-6 hover:bg-stone-800 transition-colors"
                >
                    <span className="flex items-center gap-4">
                        <span className="w-12 h-12 rounded-2xl bg-[#E1567A] flex items-center justify-center shrink-0">
                            <Navigation className="w-6 h-6" />
                        </span>
                        <span className="font-serif font-semibold text-xl sm:text-2xl">Aujourd&apos;hui</span>
                    </span>
                    <span className="flex items-center gap-1.5 rounded-full bg-white text-stone-900 text-sm font-semibold h-10 px-5 group-hover:translate-x-0.5 transition-transform">
                        Ouvrir <ArrowRight className="w-4 h-4 text-[#E1567A]" />
                    </span>
                </Link>

                <div className={`grid grid-cols-1 gap-4 ${main.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                    {main.map(t => (
                        <Link key={t.href} href={t.href} className="group rounded-3xl border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-md transition-all flex flex-col gap-6">
                            <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white ${t.tone}`}>
                                <t.icon className="w-5 h-5" />
                            </span>
                            <span className="flex items-center justify-between gap-2">
                                <span className="font-serif font-semibold text-xl text-stone-900">{t.title}</span>
                                <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-[#E1567A] transition-colors" />
                            </span>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {more.map(t => (
                        <Link key={t.href} href={t.href} className="group rounded-2xl border border-stone-200 bg-white px-4 py-3 hover:border-stone-300 hover:shadow-sm transition-all flex items-center gap-3">
                            <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${t.tone}`}>
                                <t.icon className="w-4 h-4" />
                            </span>
                            <span className="text-sm font-semibold text-stone-900">{t.title}</span>
                            <ArrowRight className="ml-auto w-4 h-4 text-stone-300 group-hover:text-[#E1567A] transition-colors" />
                        </Link>
                    ))}
                </div>

                {tools.length > 0 && (
                    <div className="space-y-2">
                        <h2 className="t-label px-1">Outils</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {tools.map(t => (
                                <Link key={t.href} href={t.href} className="group rounded-2xl border border-stone-200 bg-white/60 px-4 py-3 hover:bg-white hover:border-stone-300 transition-all flex items-center gap-3">
                                    <t.icon className="w-4 h-4 text-stone-400 group-hover:text-stone-700" />
                                    <span className="text-sm font-medium text-stone-700">{t.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-center text-[11px] text-stone-400">
                    v{build.version}{build.env ? ` · ${build.env}` : ''}
                </p>
            </div>
        </div>
    );
}
