'use client';

import React, { useEffect, useState } from 'react';
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
    Receipt,
    ShoppingCart,
    UserPlus,
    Users,
    Utensils,
    type LucideIcon
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getBuildInfo } from '@/lib/version';

interface Tile {
    href: string;
    icon: LucideIcon;
    title: string;
    text: string;
    tint: string; // icon colours: soft background + coloured line icon
}

/**
 * The admin home, the same for Elisa and her chefs: a chef just gets fewer tiles
 * (no menu editing, prices, invoices, gift cards, Instagram, team or guest books).
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
    // Today's date, written in the browser (avoids a server/browser mismatch)
    const [today, setToday] = useState('');
    useEffect(() => {
        const text = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }).format(new Date());
        setToday(text.charAt(0).toUpperCase() + text.slice(1));
    }, []);

    // Access is enforced server-side (middleware + API checks); this only ends the session
    const handleLogout = async () => {
        await createSupabaseBrowserClient().auth.signOut();
        router.replace('/admin/login');
        router.refresh();
    };

    const daily: Tile[] = isOwner ? [
        { href: '/admin/semaine', icon: Calendar, title: 'Planning', text: 'Les séances de la semaine, les choix des clients et les liens à envoyer.', tint: 'bg-amber-50 text-amber-700' },
        { href: '/admin/recettes', icon: Utensils, title: 'Menu & recettes', text: 'Les plats de la semaine, les recettes et la banque de recettes.', tint: 'bg-rose-50 text-[#E1567A]' },
        { href: '/admin/clients', icon: Users, title: 'Clients', text: 'Coordonnées, allergies, préférences et liens de choix.', tint: 'bg-sky-50 text-sky-700' },
        { href: '/admin/facturation', icon: Receipt, title: 'Facturation', text: 'Les séances à facturer, les factures en cours et l’export.', tint: 'bg-emerald-50 text-emerald-700' }
    ] : [
        { href: '/admin/semaine', icon: Calendar, title: 'Mon planning', text: 'Vos séances de la semaine et les choix de vos clients.', tint: 'bg-amber-50 text-amber-700' },
        { href: '/admin/clients', icon: Users, title: 'Mes clients', text: 'Coordonnées, allergies et notes cuisine de vos clients.', tint: 'bg-sky-50 text-sky-700' }
    ];
    const organise: Tile[] = [
        { href: '/admin/courses', icon: ShoppingCart, title: 'Courses groupées', text: 'Une seule liste pour plusieurs clients, avec la part de chacun.', tint: 'bg-emerald-50 text-emerald-700' },
        ...(isOwner ? [
            { href: '/admin/menu-visuel?offset=1', icon: ImageIcon, title: 'Flyer Instagram', text: 'Le visuel du menu de la semaine, prêt à publier.', tint: 'bg-rose-50 text-[#E1567A]' },
            { href: '/admin/equipe', icon: UserPlus, title: 'Équipe', text: 'Les accès de vos chefs et les clients de chacun.', tint: 'bg-stone-100 text-stone-700' }
        ] : [])
    ];
    const tools: Tile[] = isOwner ? [
        { href: '/admin/calculateur', icon: Calculator, title: 'Calculateur', text: 'Le prix d’une prestation et ce qu’elle rapporte.', tint: 'bg-stone-100 text-stone-600' },
        { href: '/admin/carte-cadeau-manuel', icon: Gift, title: 'Carte cadeau', text: 'Créer une carte cadeau à la main.', tint: 'bg-stone-100 text-stone-600' },
        { href: '/welcome-villa', icon: BookHeart, title: 'Fiches guest book', text: 'Les fiches d’accueil pour les locations.', tint: 'bg-stone-100 text-stone-600' }
    ] : [];

    const row = (t: Tile) => (
        <Link key={t.href} href={t.href} className="group flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.tint}`}>
                <t.icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-stone-900">{t.title}</span>
                <span className="block t-meta text-[13px] leading-snug">{t.text}</span>
            </span>
            <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-[#E1567A] group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
    );

    return (
        <div className="min-h-screen bg-[#FAFAF9] py-10 md:py-14 text-stone-900 font-sans">
            <div className="mx-auto px-4 max-w-5xl space-y-10">
                <header className="flex justify-between items-end gap-3 border-b border-stone-200 pb-6">
                    <div className="space-y-1.5">
                        <p className="t-label text-[#E1567A]">{isOwner ? 'Administration' : 'Espace chef'}{today && <span className="text-stone-400"> · {today}</span>}</p>
                        <h1 className="t-page-title">Bonjour{firstName ? ` ${firstName}` : ''}</h1>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-rose-600 transition-colors shrink-0 pb-1.5">
                        <LogOut className="h-3.5 w-3.5" /> Déconnexion
                    </button>
                </header>

                {refused && (
                    <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-3 text-sm">
                        Cette page est réservée à Elisa.
                    </div>
                )}

                {/* The day: clients, route, dish sheets */}
                <Link
                    href="/admin/aujourd-hui"
                    className="group relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-3xl bg-stone-900 text-white p-6 sm:p-8"
                >
                    <span aria-hidden className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-[#E1567A]/25 blur-3xl" />
                    <span className="relative flex items-center gap-5">
                        <span className="w-12 h-12 rounded-2xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center shrink-0">
                            <Navigation className="w-5 h-5 text-[#F4A0B5]" strokeWidth={1.75} />
                        </span>
                        <span className="space-y-1">
                            <span className="block font-serif font-semibold text-2xl sm:text-[28px] leading-tight">Aujourd&apos;hui</span>
                            <span className="block text-sm text-stone-300">Vos séances du jour, l&apos;itinéraire et les fiches cuisine.</span>
                        </span>
                    </span>
                    <span className="relative self-start sm:self-auto flex items-center gap-2 rounded-full bg-white text-stone-900 text-sm font-semibold h-10 px-5 group-hover:gap-3 transition-all">
                        Ouvrir <ArrowRight className="w-4 h-4 text-[#E1567A]" />
                    </span>
                </Link>

                <section className="space-y-3">
                    <h2 className="t-label px-1">Au quotidien</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {daily.map(t => (
                            <Link key={t.href} href={t.href} className="group rounded-3xl border border-stone-200 bg-white p-6 hover:border-stone-300 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] transition-all flex gap-5">
                                <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${t.tint}`}>
                                    <t.icon className="w-5 h-5" strokeWidth={1.75} />
                                </span>
                                <span className="min-w-0 flex-1 space-y-1">
                                    <span className="flex items-center justify-between gap-2">
                                        <span className="font-serif font-semibold text-xl text-stone-900">{t.title}</span>
                                        <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-[#E1567A] group-hover:translate-x-0.5 transition-all" />
                                    </span>
                                    <span className="block text-sm text-stone-500 leading-relaxed">{t.text}</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                <div className={`grid grid-cols-1 gap-6 ${tools.length > 0 ? 'lg:grid-cols-2' : ''}`}>
                    <section className="space-y-3">
                        <h2 className="t-label px-1">Organisation</h2>
                        <div className="rounded-3xl border border-stone-200 bg-white divide-y divide-stone-100 overflow-hidden">
                            {organise.map(row)}
                        </div>
                    </section>
                    {tools.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="t-label px-1">Outils</h2>
                            <div className="rounded-3xl border border-stone-200 bg-white divide-y divide-stone-100 overflow-hidden">
                                {tools.map(row)}
                            </div>
                        </section>
                    )}
                </div>

                <p className="text-center text-[11px] text-stone-400">
                    v{build.version}{build.env ? ` · ${build.env}` : ''}
                </p>
            </div>
        </div>
    );
}
