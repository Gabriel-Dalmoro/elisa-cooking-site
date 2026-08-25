'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminPageHeaderProps {
    badgeText: string;
    title: string;
    subtitle: string;
    backHref?: string;
    backLabel?: string;
    actionElement?: React.ReactNode;
}

export default function AdminPageHeader({
    badgeText,
    title,
    subtitle,
    backHref = '/admin',
    backLabel = "Retour à l'admin",
    actionElement
}: AdminPageHeaderProps) {
    return (
        <div className="pt-10 sm:pt-14 pb-8 max-w-6xl mx-auto px-4 select-none">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                    {/* Category Tag Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-[11px] font-black uppercase tracking-wider text-[#E1567A]">
                        {badgeText}
                    </div>

                    {/* Page Title */}
                    <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight font-sans">
                        {title}
                    </h1>

                    {/* Page Subtitle */}
                    <p className="text-stone-500 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
                        {subtitle}
                    </p>
                </div>

                {/* Right Action & Back Button */}
                <div className="flex flex-wrap items-center gap-3 shrink-0 pt-1 sm:pt-0">
                    {actionElement}

                    <Link href={backHref}>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full px-4 py-2 border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-colors bg-white h-9"
                        >
                            <ArrowLeft className="h-3.5 w-3.5 text-stone-500" />
                            {backLabel}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
