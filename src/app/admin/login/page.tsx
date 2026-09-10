"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

// Only allow redirects to our own admin pages
function safeNextPath(next: string | null): string {
    if (next && next.startsWith('/') && !next.startsWith('//')) return next;
    return '/admin';
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isConfigError = searchParams.get('error') === 'config';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const supabase = createSupabaseBrowserClient();
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password
            });

            if (signInError) {
                setError('Email ou mot de passe incorrect');
                setIsSubmitting(false);
                return;
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Connexion impossible pour le moment. Réessayez dans quelques minutes.');
            setIsSubmitting(false);
            return;
        }

        router.replace(safeNextPath(searchParams.get('next')));
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4 selection:bg-[#E1567A]/20">
            <div className="max-w-md w-full">
                <Card className="p-8 border-stone-200 shadow-xl rounded-3xl bg-white space-y-6">
                    <div className="text-center space-y-2">
                        <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-[#E1567A]">
                            <Lock className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-bold font-serif text-stone-900">Espace Administration</h1>
                        <p className="text-xs text-stone-500">Connectez-vous pour accéder à vos outils.</p>
                    </div>

                    {isConfigError && (
                        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-2xl p-3 font-medium">
                            L&apos;espace admin est momentanément indisponible (problème de configuration du serveur). Prévenez Gabriel.
                        </p>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="rounded-2xl border-stone-200"
                        />
                        <div className="space-y-1">
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
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
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {error && <p className="text-xs text-red-500 font-medium pl-1">{error}</p>}
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#E1567A] hover:bg-[#c94567] text-white rounded-2xl font-bold text-xs h-11 shadow-sm transition-all"
                        >
                            {isSubmitting ? 'Connexion...' : 'Se connecter'}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FAFAF9]" />}>
            <LoginForm />
        </Suspense>
    );
}
