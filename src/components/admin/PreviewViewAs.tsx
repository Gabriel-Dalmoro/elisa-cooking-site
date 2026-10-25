'use client';

import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import { useStaff } from './StaffContext';

/**
 * Preview deployments only: see the admin exactly as a chef sees it, without their password.
 * The server ignores this switch outside previews.
 */
export default function PreviewViewAs() {
    const { isPreview, chefs, role, userId } = useStaff();
    const [busy, setBusy] = useState(false);
    if (!isPreview) return null;

    const current = role === 'chef' ? userId || '' : '';
    const change = async (value: string) => {
        setBusy(true);
        await fetch('/api/admin/preview-as', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: value || null })
        }).catch(() => undefined);
        window.location.href = '/admin';
    };

    return (
        <div className="fixed bottom-24 left-3 z-50 print:hidden">
            <label className="flex items-center gap-2 bg-stone-900 text-white rounded-full pl-3 pr-1.5 py-1.5 shadow-xl text-[11px] font-semibold">
                <Eye className="w-3.5 h-3.5 text-amber-300" />
                Aperçu · voir comme
                <select
                    value={current}
                    disabled={busy}
                    onChange={e => change(e.target.value)}
                    className="bg-white text-stone-900 rounded-full px-2 py-1 text-[11px] font-bold"
                >
                    <option value="">Elisa</option>
                    {chefs.filter(c => c.active).map(c => (
                        <option key={c.userId} value={c.userId}>{c.displayName}</option>
                    ))}
                </select>
            </label>
        </div>
    );
}
