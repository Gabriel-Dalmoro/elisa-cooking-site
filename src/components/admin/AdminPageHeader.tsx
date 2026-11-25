'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminPageHeaderProps {
    title: string;
    /** A short fact under the title (a date, a time). Explanations don't go here. */
    meta?: string;
    backHref?: string;
    backLabel?: string;
    actionElement?: React.ReactNode;
}

/** Every admin page starts with this: title, optional one-line fact, actions, back button. */
export default function AdminPageHeader({
    title,
    meta,
    backHref = '/admin',
    backLabel = 'Accueil',
    actionElement
}: AdminPageHeaderProps) {
    return (
        <div className="pt-8 sm:pt-12 pb-6 max-w-6xl mx-auto px-4 select-none">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="t-page-title">{title}</h1>
                    {meta && <p className="text-sm text-stone-500">{meta}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {actionElement}
                    <Link href={backHref}>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full px-4 border-stone-200 hover:bg-stone-100 text-stone-700 font-semibold text-xs flex items-center gap-1.5 bg-white h-9"
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
