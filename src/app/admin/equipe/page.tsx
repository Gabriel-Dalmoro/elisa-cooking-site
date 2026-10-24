'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Check, Copy, KeyRound, MapPin, Phone, Mail, Plus, Power, UserPlus, Users } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/admin/useToast';
import { useConfirm } from '@/components/admin/useConfirm';
import { chefColor, ChefSummary } from '@/components/admin/StaffContext';

interface TeamMember {
    userId: string;
    role: 'owner' | 'chef';
    displayName: string;
    email: string;
    phone: string;
    city: string;
    active: boolean;
    clientCount: number;
}

interface Form {
    userId: string | null; // null = new chef
    displayName: string;
    email: string;
    phone: string;
    city: string;
}

const EMPTY: Form = { userId: null, displayName: '', email: '', phone: '', city: '' };

/**
 * Elisa's team: add a chef (their login is created here), see who has which clients,
 * open a chef's planning, reset a password, deactivate a chef (access cut immediately).
 */
export default function TeamPage() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [form, setForm] = useState<Form | null>(null);
    const [saving, setSaving] = useState(false);
    // Shown once after creating a chef or resetting a password
    const [credentials, setCredentials] = useState<{ name: string; email: string; password: string } | null>(null);
    const { showToast, toastElement } = useToast();
    const { confirm, confirmDialog } = useConfirm();

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/cooking-ops/admin/team');
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Chargement impossible');
            setTeam(data.team || []);
            setLoadError(null);
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : 'Chargement impossible');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const chefs = team.filter(m => m.role === 'chef');
    const owner = team.find(m => m.role === 'owner');
    const chefSummaries: ChefSummary[] = chefs.map(c => ({ userId: c.userId, displayName: c.displayName, city: c.city, active: c.active }));

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form) return;
        setSaving(true);
        try {
            const res = await fetch('/api/cooking-ops/admin/team', {
                method: form.userId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form.userId
                    ? { userId: form.userId, displayName: form.displayName, phone: form.phone, city: form.city }
                    : { displayName: form.displayName, email: form.email, phone: form.phone, city: form.city })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Enregistrement impossible');
            if (!form.userId && data.temporaryPassword) {
                setCredentials({ name: form.displayName, email: form.email.trim().toLowerCase(), password: data.temporaryPassword });
            } else {
                showToast(`Fiche de ${form.displayName} mise à jour`, 'check');
            }
            setForm(null);
            load();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Enregistrement impossible', 'error');
        } finally {
            setSaving(false);
        }
    };

    const setActive = async (member: TeamMember, active: boolean) => {
        if (!active && !(await confirm({
            title: `Désactiver l’accès de ${member.displayName} ?`,
            description: 'Il est déconnecté tout de suite et ne peut plus se connecter. Ses clients et ses séances restent à son nom : réattribuez-les si besoin. Vous pourrez le réactiver.',
            confirmLabel: 'Désactiver',
            tone: 'danger'
        }))) return;
        const res = await fetch('/api/cooking-ops/admin/team', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: member.userId, active })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            showToast(data.error || 'Action impossible', 'error');
            return;
        }
        showToast(active ? `${member.displayName} peut de nouveau se connecter` : `Accès de ${member.displayName} désactivé`, 'check');
        load();
    };

    const resetPassword = async (member: TeamMember) => {
        if (!(await confirm({
            title: `Nouveau mot de passe pour ${member.displayName} ?`,
            description: 'L’ancien ne marchera plus. Le nouveau s’affiche une seule fois : transmettez-le-lui.',
            confirmLabel: 'Créer un nouveau mot de passe'
        }))) return;
        const res = await fetch('/api/cooking-ops/admin/team', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: member.userId, resetPassword: true })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.temporaryPassword) {
            showToast(data.error || 'Action impossible', 'error');
            return;
        }
        setCredentials({ name: member.displayName, email: member.email, password: data.temporaryPassword });
    };

    const welcomeMessage = credentials
        ? `Bonjour ${credentials.name.split(/\s+/)[0]} ! Voici ton accès à l’espace chef Elisa Batch Cooking :\n${typeof window !== 'undefined' ? window.location.origin : ''}/admin/login\nEmail : ${credentials.email}\nMot de passe : ${credentials.password}`
        : '';

    const copy = async (value: string, label: string) => {
        try {
            await navigator.clipboard.writeText(value);
            showToast(`${label} copié`, 'check');
        } catch {
            showToast('Copie impossible sur cet appareil', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-stone-800 pb-28 font-sans">
            <AdminPageHeader
                title="Équipe & chefs"
                subtitle="Créez l’accès de vos chefs. Chacun ne voit que les clients et les séances que vous lui attribuez : jamais les prix, les cartes cadeaux, ni vos notes privées."
                actionElement={
                    <Button
                        size="sm"
                        onClick={() => setForm({ ...EMPTY })}
                        className="bg-[#E1567A] hover:bg-[#c94567] text-white gap-1.5 text-xs h-9 px-4 rounded-full font-semibold"
                    >
                        <UserPlus className="w-4 h-4" /> Ajouter un chef
                    </Button>
                }
            />

            <main className="max-w-4xl mx-auto px-4 space-y-4">
                {loadError && <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-3xl text-sm font-semibold">{loadError}</div>}

                {loading ? (
                    <div className="bg-white rounded-3xl p-10 text-center text-stone-500 border border-stone-200">Chargement de l’équipe…</div>
                ) : (
                    <>
                        {owner && (
                            <div className="bg-white rounded-3xl border border-rose-200 p-5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-[#E1567A]" />
                                    <div>
                                        <p className="font-bold text-stone-900">{owner.displayName || 'Elisa'} <span className="text-[10px] font-black uppercase tracking-wider text-[#E1567A] ml-1">Fondatrice</span></p>
                                        <p className="text-xs text-stone-500">Voit tout · {owner.clientCount} client{owner.clientCount > 1 ? 's' : ''} non attribué{owner.clientCount > 1 ? 's' : ''} (les siens)</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {chefs.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-10 text-center space-y-3">
                                <Users className="w-10 h-10 text-stone-300 mx-auto" />
                                <p className="text-sm text-stone-600">Pas encore de chef. Ajoutez Lucas pour lui créer son accès.</p>
                                <Button onClick={() => setForm({ ...EMPTY })} className="bg-[#E1567A] hover:bg-[#c94567] text-white rounded-full text-xs gap-1.5">
                                    <Plus className="w-4 h-4" /> Ajouter un chef
                                </Button>
                            </div>
                        ) : (
                            chefs.map(chef => {
                                const color = chefColor(chefSummaries, chef.userId);
                                return (
                                    <div key={chef.userId} className={`bg-white rounded-3xl border p-5 space-y-3 ${chef.active ? 'border-stone-200' : 'border-stone-200 opacity-70'}`}>
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <span className={`w-3 h-3 rounded-full mt-1.5 ${color.dot}`} />
                                                <div>
                                                    <p className="font-bold text-stone-900 text-lg leading-tight">
                                                        {chef.displayName}
                                                        {!chef.active && <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-stone-500 bg-stone-100 border border-stone-200 rounded-full px-2 py-0.5">Désactivé</span>}
                                                    </p>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600 mt-1">
                                                        {chef.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-stone-400" />{chef.city}</span>}
                                                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-stone-400" />{chef.email}</span>
                                                        {chef.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-stone-400" />{chef.phone}</span>}
                                                    </div>
                                                    <p className="text-xs text-stone-500 mt-1">{chef.clientCount} client{chef.clientCount > 1 ? 's' : ''} attribué{chef.clientCount > 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
                                            <Link href={`/admin/semaine?chef=${chef.userId}`}>
                                                <Button size="sm" variant="outline" className="rounded-full text-xs h-8 gap-1.5 border-stone-300"><Calendar className="w-3.5 h-3.5" /> Son planning</Button>
                                            </Link>
                                            <Link href={`/admin/clients?chef=${chef.userId}`}>
                                                <Button size="sm" variant="outline" className="rounded-full text-xs h-8 gap-1.5 border-stone-300"><Users className="w-3.5 h-3.5" /> Ses clients</Button>
                                            </Link>
                                            <Button size="sm" variant="outline" onClick={() => setForm({ userId: chef.userId, displayName: chef.displayName, email: chef.email, phone: chef.phone, city: chef.city })} className="rounded-full text-xs h-8 border-stone-300">
                                                Modifier
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => resetPassword(chef)} className="rounded-full text-xs h-8 gap-1.5 border-stone-300"><KeyRound className="w-3.5 h-3.5" /> Nouveau mot de passe</Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setActive(chef, !chef.active)}
                                                className={`rounded-full text-xs h-8 gap-1.5 ml-auto ${chef.active ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}
                                            >
                                                <Power className="w-3.5 h-3.5" /> {chef.active ? 'Désactiver' : 'Réactiver'}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        <div className="bg-stone-50 border border-stone-200 rounded-3xl p-4 text-xs text-stone-600 space-y-1">
                            <p className="font-bold text-stone-800">Ce qu’un chef peut faire</p>
                            <p>✓ Voir ses clients (coordonnées, allergies, notes cuisine), ses séances, les fiches cuisine et les listes de courses.</p>
                            <p>✓ Ajouter ou déplacer des séances pour ses clients, mettre à jour leurs allergies et notes cuisine.</p>
                            <p>✗ Pas d’accès aux prix, cartes cadeaux, Instagram, fiches Airbnb, menu, équipe, ni à vos notes privées et aux autres clients.</p>
                        </div>
                    </>
                )}
            </main>

            {/* Add / edit a chef */}
            <Dialog open={!!form} onOpenChange={open => !open && setForm(null)}>
                <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold">{form?.userId ? `Modifier : ${form.displayName}` : 'Ajouter un chef'}</DialogTitle>
                    </DialogHeader>
                    {form && (
                        <form onSubmit={save} className="space-y-3 text-xs">
                            <div>
                                <label className="font-semibold block text-stone-700 mb-1">Prénom & nom *</label>
                                <input required value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} placeholder="Lucas Martin" className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none" />
                            </div>
                            <div>
                                <label className="font-semibold block text-stone-700 mb-1">Email (son identifiant, reçoit les choix de ses clients) *</label>
                                <input
                                    required
                                    type="email"
                                    value={form.email}
                                    disabled={Boolean(form.userId)}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    placeholder="lucas@email.com"
                                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none disabled:bg-stone-100 disabled:text-stone-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="font-semibold block text-stone-700 mb-1">Téléphone</label>
                                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+33 6…" className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none" />
                                </div>
                                <div>
                                    <label className="font-semibold block text-stone-700 mb-1">Ville</label>
                                    <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Annecy" className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none" />
                                </div>
                            </div>
                            <Button type="submit" disabled={saving} className="w-full bg-[#E1567A] hover:bg-[#c94567] text-white rounded-xl h-10 font-bold">
                                {saving ? 'Enregistrement…' : form.userId ? 'Enregistrer' : 'Créer son accès'}
                            </Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Login details, shown once */}
            <Dialog open={!!credentials} onOpenChange={open => !open && setCredentials(null)}>
                <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold">Accès de {credentials?.name}</DialogTitle>
                    </DialogHeader>
                    {credentials && (
                        <div className="space-y-3 text-sm">
                            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 font-medium">
                                Ce mot de passe ne s’affiche qu’une fois. Envoyez-le maintenant (en cas d’oubli : « Nouveau mot de passe »).
                            </p>
                            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-1.5">
                                <p><span className="text-stone-500 text-xs">Adresse :</span> <strong>{typeof window !== 'undefined' ? window.location.origin : ''}/admin/login</strong></p>
                                <p><span className="text-stone-500 text-xs">Email :</span> <strong>{credentials.email}</strong></p>
                                <p className="flex items-center gap-2"><span className="text-stone-500 text-xs">Mot de passe :</span> <strong className="font-mono text-base tracking-wider">{credentials.password}</strong></p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={() => copy(welcomeMessage, 'Message')} className="bg-[#E1567A] hover:bg-[#c94567] text-white rounded-full text-xs gap-1.5">
                                    <Copy className="w-3.5 h-3.5" /> Copier le message à envoyer
                                </Button>
                                <Button variant="outline" onClick={() => copy(credentials.password, 'Mot de passe')} className="rounded-full text-xs gap-1.5 border-stone-300">
                                    <KeyRound className="w-3.5 h-3.5" /> Copier le mot de passe
                                </Button>
                                <Button variant="outline" onClick={() => setCredentials(null)} className="rounded-full text-xs gap-1.5 border-stone-300 ml-auto">
                                    <Check className="w-3.5 h-3.5" /> C’est envoyé
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {confirmDialog}
            {toastElement}
        </div>
    );
}
