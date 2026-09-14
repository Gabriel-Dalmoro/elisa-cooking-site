'use client';

import React, { useCallback, useState } from 'react';
import { Check, Copy, RefreshCw, X, AlertTriangle } from 'lucide-react';

/**
 * Floating toast used across the admin pages.
 *
 *   const { showToast, toastElement } = useToast();
 *   showToast('Client enregistré', 'check');
 *   ... and render {toastElement} once in the page.
 */
export type ToastIcon = 'check' | 'link' | 'calendar' | 'error';

const ICONS: Record<ToastIcon, { node: React.ReactNode; wrapper: string }> = {
    check: { node: <Check className="w-4 h-4 text-emerald-400" />, wrapper: 'bg-emerald-500/20' },
    link: { node: <Copy className="w-4 h-4 text-[#E1567A]" />, wrapper: 'bg-[#E1567A]/20' },
    calendar: { node: <RefreshCw className="w-4 h-4 text-amber-400" />, wrapper: 'bg-amber-500/20' },
    error: { node: <AlertTriangle className="w-4 h-4 text-red-400" />, wrapper: 'bg-red-500/20' }
};

export function useToast(durationMs = 3500) {
    const [toast, setToast] = useState<{ id: string; message: string; icon: ToastIcon } | null>(null);

    const showToast = useCallback((message: string, icon: ToastIcon = 'check') => {
        const id = `${Date.now()}_${Math.random()}`;
        setToast({ id, message, icon });
        // Errors stay twice as long: they usually need reading
        setTimeout(() => setToast(curr => (curr?.id === id ? null : curr)), icon === 'error' ? durationMs * 2 : durationMs);
    }, [durationMs]);

    const toastElement = toast ? (
        <div className="fixed bottom-6 right-6 left-6 sm:left-auto z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="bg-stone-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-stone-800 flex items-center gap-3 text-xs sm:text-sm font-semibold sm:max-w-md ml-auto">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${ICONS[toast.icon].wrapper}`}>
                    {ICONS[toast.icon].node}
                </div>
                <span className="leading-snug">{toast.message}</span>
                <button
                    onClick={() => setToast(null)}
                    className="ml-auto text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                    aria-label="Fermer"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    ) : null;

    return { showToast, toastElement };
}
