'use client';

import React, { createContext, useContext } from 'react';

export interface ChefSummary {
    userId: string;
    displayName: string;
    city: string;
    active: boolean;
}

export interface StaffContextValue {
    role: 'owner' | 'chef' | null; // null = not signed in (login page)
    userId: string | null;
    displayName: string | null;
    isPreview: boolean;
    chefs: ChefSummary[]; // the team's chefs (owner and preview only; empty for a chef)
}

const StaffContext = createContext<StaffContextValue>({ role: null, userId: null, displayName: null, isPreview: false, chefs: [] });

export function StaffProvider({ value, children }: { value: StaffContextValue; children: React.ReactNode }) {
    return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

/** Who is using the admin. Only for showing or hiding things: the server enforces access. */
export function useStaff() {
    const ctx = useContext(StaffContext);
    return { ...ctx, isOwner: ctx.role === 'owner', isChef: ctx.role === 'chef' };
}

// One colour per chef everywhere (planning, clients); Elisa is always rose
const CHEF_COLORS = [
    { dot: 'bg-sky-500', pill: 'bg-sky-50 text-sky-800 border-sky-200', ring: 'ring-sky-300', border: 'border-sky-300' },
    { dot: 'bg-violet-500', pill: 'bg-violet-50 text-violet-800 border-violet-200', ring: 'ring-violet-300', border: 'border-violet-300' },
    { dot: 'bg-teal-500', pill: 'bg-teal-50 text-teal-800 border-teal-200', ring: 'ring-teal-300', border: 'border-teal-300' },
    { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800 border-amber-200', ring: 'ring-amber-300', border: 'border-amber-300' },
    { dot: 'bg-lime-600', pill: 'bg-lime-50 text-lime-800 border-lime-200', ring: 'ring-lime-300', border: 'border-lime-300' }
];
export const ELISA_COLOR = { dot: 'bg-[#E1567A]', pill: 'bg-rose-50 text-[#E1567A] border-rose-200', ring: 'ring-rose-300', border: 'border-rose-200' };

export function chefColor(chefs: ChefSummary[], chefId: string | null | undefined) {
    if (!chefId) return ELISA_COLOR;
    const i = chefs.findIndex(c => c.userId === chefId);
    return i < 0 ? CHEF_COLORS[CHEF_COLORS.length - 1] : CHEF_COLORS[i % CHEF_COLORS.length];
}

export function chefName(chefs: ChefSummary[], chefId: string | null | undefined): string {
    if (!chefId) return 'Elisa';
    return chefs.find(c => c.userId === chefId)?.displayName || 'Chef';
}
