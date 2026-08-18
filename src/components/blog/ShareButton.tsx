"use client";

import React, { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
    title: string;
    url?: string;
    className?: string;
}

export function ShareButton({ title, url, className = "" }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: title,
                    url: shareUrl,
                });
                return;
            } catch (err) {
                // User cancelled or share failed, fallback to copy
                if ((err as Error).name === "AbortError") return;
            }
        }

        // Clipboard fallback
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            console.error("Failed to copy link:", err);
        }
    };

    return (
        <button
            onClick={handleShare}
            type="button"
            className={`relative flex items-center gap-2 transition-colors ${
                copied ? "text-emerald-600 font-bold" : "hover:text-brand-rose"
            } ${className}`}
            title="Partager cet article"
            aria-label="Partager cet article"
        >
            {copied ? (
                <>
                    <Check className="h-4 w-4 text-emerald-600 animate-in zoom-in duration-200" />
                    <span className="text-emerald-600 font-black">Lien copié !</span>
                </>
            ) : (
                <>
                    <Share2 className="h-4 w-4" />
                    <span>Partager</span>
                </>
            )}
        </button>
    );
}
