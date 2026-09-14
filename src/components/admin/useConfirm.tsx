'use client';

import React, { useCallback, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

/**
 * In-site replacement for window.confirm / window.alert, styled like the rest of the admin.
 *
 *   const { confirm, alert, confirmDialog } = useConfirm();
 *   if (!(await confirm({ title: '...', tone: 'danger' }))) return;
 *   ... and render {confirmDialog} once in the page.
 */
export interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'default' | 'danger';
}

type PendingState = {
    options: ConfirmOptions;
    isAlert: boolean;
    resolve: (value: boolean) => void;
};

export function useConfirm() {
    const [pending, setPending] = useState<PendingState | null>(null);

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>(resolve => setPending({ options, isAlert: false, resolve }));
    }, []);

    // Same look, single button — for messages that need acknowledging
    const alert = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>(resolve => setPending({ options, isAlert: true, resolve }));
    }, []);

    const close = (value: boolean) => {
        pending?.resolve(value);
        setPending(null);
    };

    const isDanger = pending?.options.tone === 'danger';

    const confirmDialog = (
        <Dialog open={!!pending} onOpenChange={open => { if (!open) close(false); }}>
            <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
                <DialogHeader>
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-1 ${
                        isDanger ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-rose-50 text-[#E1567A] border border-rose-200'
                    }`}>
                        {isDanger ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    </div>
                    <DialogTitle className="font-serif text-lg font-bold text-stone-900 text-left">
                        {pending?.options.title}
                    </DialogTitle>
                </DialogHeader>

                {pending?.options.description && (
                    <p className="text-xs text-stone-600 leading-relaxed">
                        {pending.options.description}
                    </p>
                )}

                <DialogFooter className="gap-2 sm:gap-2">
                    {!pending?.isAlert && (
                        <Button
                            variant="outline"
                            onClick={() => close(false)}
                            className="rounded-full text-xs h-9 px-4 border-stone-300 font-semibold cursor-pointer"
                        >
                            {pending?.options.cancelLabel || 'Annuler'}
                        </Button>
                    )}
                    <Button
                        onClick={() => close(true)}
                        className={`rounded-full text-xs h-9 px-5 font-bold cursor-pointer text-white ${
                            isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#E1567A] hover:bg-[#c94567]'
                        }`}
                    >
                        {pending?.options.confirmLabel || (pending?.isAlert ? 'J’ai compris' : 'Confirmer')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    return { confirm, alert, confirmDialog };
}
