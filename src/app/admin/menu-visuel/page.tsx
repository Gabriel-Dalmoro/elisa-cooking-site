'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
    Download, 
    Sparkles, 
    ArrowLeft, 
    Check, 
    Edit3, 
    Palette, 
    Copy,
    Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { WeeklyDish, WeeklyMenuData } from '@/lib/types/cooking-ops';

export default function InstagramMenuGeneratorPage() {
    const [loading, setLoading] = useState(true);
    const [menu, setMenu] = useState<WeeklyMenuData | null>(null);
    const [weekSubtitle, setWeekSubtitle] = useState('de la semaine');
    const [footerText, setFooterText] = useState('elisabatchcooking.com');
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [copiedSuccess, setCopiedSuccess] = useState(false);
    
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const logoImgRef = useRef<HTMLImageElement | null>(null);

    const loadMenu = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/cooking-ops/admin');
            if (!res.ok) throw new Error('Erreur de chargement');
            const data = await res.json();
            setMenu(data.weekMenu);
        } catch (e) {
            console.error('Error loading menu for flyer:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const img = new Image();
        img.src = '/images/logo.jpg';
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            logoImgRef.current = img;
            if (menu) renderCanvas();
        };
        loadMenu();
    }, []);

    // Categorize dishes
    const getGroupedDishes = () => {
        if (!menu?.recipes) return { viande: [], Végétarien: [], Poisson: [], Végan: [] };

        const groups: Record<string, WeeklyDish[]> = {
            'viande': [],
            'Végétarien': [],
            'Poisson': [],
            'Végan': []
        };

        menu.recipes.forEach(dish => {
            const cat = dish.category?.toLowerCase() || '';
            if (cat.includes('meat') || cat.includes('viande')) {
                groups['viande'].push(dish);
            } else if (cat.includes('fish') || cat.includes('poisson')) {
                groups['Poisson'].push(dish);
            } else if (cat.includes('vegan') || cat.includes('végan')) {
                groups['Végan'].push(dish);
            } else {
                groups['Végétarien'].push(dish);
            }
        });

        return groups;
    };

    const grouped = getGroupedDishes();

    // High-Res Canvas 1080x1920 (With Instagram Stories Safe Zone Padding)
    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !menu) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 1080;
        const H = 1920;
        canvas.width = W;
        canvas.height = H;

        // 1. Crisp White Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, W, H);

        // --- TOP-LEFT ORGANIC RETRO WAVES ---
        ctx.save();
        // Ribbon 1: Brand Rose (#E1567A)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(440, 0);
        ctx.bezierCurveTo(360, 110, 200, 160, 100, 270);
        ctx.bezierCurveTo(40, 340, 15, 430, 0, 520);
        ctx.closePath();
        ctx.fillStyle = '#E1567A';
        ctx.fill();

        // Ribbon 2: Warm Coral/Salmon (#F88D73)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(330, 0);
        ctx.bezierCurveTo(270, 85, 155, 125, 75, 215);
        ctx.bezierCurveTo(30, 280, 5, 350, 0, 410);
        ctx.closePath();
        ctx.fillStyle = '#F88D73';
        ctx.fill();

        // Ribbon 3: Brand Gold (#F2C94C)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(230, 0);
        ctx.bezierCurveTo(185, 55, 105, 95, 50, 165);
        ctx.bezierCurveTo(18, 220, 0, 260, 0, 310);
        ctx.closePath();
        ctx.fillStyle = '#F2C94C';
        ctx.fill();
        ctx.restore();

        // --- BOTTOM-RIGHT ORGANIC RETRO WAVES ---
        ctx.save();
        // Ribbon 1: Brand Gold (#F2C94C)
        ctx.beginPath();
        ctx.moveTo(W, H);
        ctx.lineTo(W - 440, H);
        ctx.bezierCurveTo(W - 340, H - 110, W - 200, H - 160, W - 110, H - 280);
        ctx.bezierCurveTo(W - 50, H - 360, W - 15, H - 450, W, H - 540);
        ctx.closePath();
        ctx.fillStyle = '#F2C94C';
        ctx.fill();

        // Ribbon 2: Coral/Salmon (#F88D73)
        ctx.beginPath();
        ctx.moveTo(W, H);
        ctx.lineTo(W - 340, H);
        ctx.bezierCurveTo(W - 260, H - 90, W - 150, H - 120, W - 80, H - 220);
        ctx.bezierCurveTo(W - 38, H - 280, W - 6, H - 360, W, H - 430);
        ctx.closePath();
        ctx.fillStyle = '#F88D73';
        ctx.fill();

        // Ribbon 3: Soft Sage (#D2E8E0)
        ctx.beginPath();
        ctx.moveTo(W, H);
        ctx.lineTo(W - 230, H);
        ctx.bezierCurveTo(W - 180, H - 60, W - 110, H - 90, W - 55, H - 160);
        ctx.bezierCurveTo(W - 22, H - 200, W, H - 260, W, H - 300);
        ctx.closePath();
        ctx.fillStyle = '#D2E8E0';
        ctx.fill();
        ctx.restore();

        // --- HEADER SECTION (With Safe Zone Top Padding = 280px) ---
        // Title: MENU
        ctx.fillStyle = '#E1567A';
        ctx.font = '900 134px -apple-system, BlinkMacSystemFont, "Montserrat", "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('M E N U', W / 2, 280);

        // Subtitle: . de la semaine .
        ctx.fillStyle = '#E1567A';
        ctx.font = '600 44px -apple-system, BlinkMacSystemFont, "Playfair Display", "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`. ${weekSubtitle} .`, W / 2, 350);

        // --- TOP-RIGHT: REAL LOGO EMBED (Safe padding from top) ---
        const logoSize = 135;
        const logoX = W - 200;
        const logoY = 170; // Pushed down for story safe zone

        if (logoImgRef.current) {
            ctx.save();
            ctx.shadowColor = 'rgba(225, 86, 122, 0.25)';
            ctx.shadowBlur = 18;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 6;

            ctx.beginPath();
            ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();

            ctx.lineWidth = 5;
            ctx.strokeStyle = '#F2C94C';
            ctx.stroke();

            ctx.clip();
            ctx.drawImage(logoImgRef.current, logoX, logoY, logoSize, logoSize);
            ctx.restore();
        }

        // --- DISHES LIST RENDERER ---
        let currentY = 475; // Starts with generous breathing room
        const leftMargin = 105;
        const maxTextWidth = W - (leftMargin * 2);

        const categories = [
            { key: 'viande', label: 'viande' },
            { key: 'Végétarien', label: 'Végétarien' },
            { key: 'Poisson', label: 'Poisson' },
            { key: 'Végan', label: 'Végan' },
        ];

        categories.forEach(({ key, label }) => {
            const dishes = grouped[key];
            if (!dishes || dishes.length === 0) return;

            // Category Title (Underlined Gold)
            ctx.fillStyle = '#E5B124';
            ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, W / 2, currentY);

            // Underline
            const titleWidth = ctx.measureText(label).width;
            ctx.strokeStyle = '#E5B124';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo((W / 2) - (titleWidth / 2) - 12, currentY + 14);
            ctx.lineTo((W / 2) + (titleWidth / 2) + 12, currentY + 14);
            ctx.stroke();

            currentY += 76;

            // Render Dish Bullets
            dishes.forEach(dish => {
                // Bullet point
                ctx.fillStyle = '#1C1917';
                ctx.beginPath();
                ctx.arc(leftMargin + 10, currentY - 12, 6, 0, Math.PI * 2);
                ctx.fill();

                // Multi-line wrap
                ctx.font = '500 35px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.textAlign = 'left';

                const words = dish.name.split(' ');
                let line = '';
                const dishLeft = leftMargin + 36;

                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = ctx.measureText(testLine);
                    const testWidth = metrics.width;

                    if (testWidth > maxTextWidth && n > 0) {
                        ctx.fillText(line, dishLeft, currentY);
                        line = words[n] + ' ';
                        currentY += 48;
                    } else {
                        line = testLine;
                    }
                }
                ctx.fillText(line, dishLeft, currentY);
                currentY += 66; // Spacing between dishes
            });

            currentY += 24; // Spacing after category
        });

        // --- FOOTER BRANDING (Above bottom safe zone) ---
        ctx.save();
        ctx.fillStyle = '#E1567A';
        ctx.font = '600 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`✨ ${footerText}`, W / 2, H - 110);
        ctx.restore();
    };

    useEffect(() => {
        if (menu) {
            renderCanvas();
        }
    }, [menu, weekSubtitle, footerText]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsGenerating(true);
        try {
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            const link = document.createElement('a');
            link.download = `menu-elisa-story-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 3000);
        } catch (err) {
            console.error('Download error:', err);
            alert('Erreur lors du téléchargement');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyImage = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (navigator.clipboard && (window as any).ClipboardItem) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await navigator.clipboard.write([new (window as any).ClipboardItem({ 'image/png': blob })]);
                    setCopiedSuccess(true);
                    setTimeout(() => setCopiedSuccess(false), 2500);
                } else {
                    handleDownload();
                }
            });
        } catch (err) {
            console.warn('Clipboard copy fallback to download:', err);
            handleDownload();
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-stone-800 pb-28 font-sans">
            {/* Standardized Header */}
            <AdminPageHeader
                badgeText="ESPACE ADMIN • STUDIO INSTAGRAM"
                title="Flyer Instagram Stories"
                subtitle="Générez et téléchargez votre flyer hebdomadaire au format Story 9:16 pour Instagram et WhatsApp avec marges de sécurité."
                backHref="/admin/recettes"
                backLabel="Retour au Menu & Recettes"
                actionElement={
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCopyImage}
                            className="text-xs h-9 px-3.5 gap-1.5 border-stone-300 rounded-full bg-white font-semibold"
                        >
                            {copiedSuccess ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Copié !</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5 text-stone-600" />
                                    <span>Copier l&apos;image</span>
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={handleDownload}
                            disabled={isGenerating || !menu}
                            className="bg-[#E1567A] hover:bg-[#c94567] text-white text-xs h-9 px-4 gap-2 shadow-xs font-semibold rounded-full"
                        >
                            {downloadSuccess ? (
                                <>
                                    <Check className="w-4 h-4 text-white" />
                                    <span>Téléchargé !</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    <span>Télécharger Story PNG</span>
                                </>
                            )}
                        </Button>
                    </div>
                }
            />

            {/* Main Content Layout */}
            <main className="max-w-6xl mx-auto px-4 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Phone Mockup with Live Canvas */}
                    <div className="lg:col-span-7 flex flex-col items-center">
                        <div className="relative rounded-[2.8rem] p-3.5 bg-stone-950 shadow-2xl ring-1 ring-stone-800 max-w-[340px] sm:max-w-[390px] w-full">
                            {/* iPhone Dynamic Island */}
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-20" />

                            {/* Canvas Render Element */}
                            <div className="rounded-[2.2rem] overflow-hidden bg-white aspect-[9/16] w-full relative shadow-inner">
                                <canvas 
                                    ref={canvasRef} 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>

                        <div className="mt-4 text-center space-y-1">
                            <p className="text-xs text-stone-700 font-semibold flex items-center justify-center gap-1.5">
                                <Palette className="w-3.5 h-3.5 text-[#E1567A]" />
                                Format Instagram Stories (1080 × 1920 px HD)
                            </p>
                            <p className="text-[11px] text-stone-500">
                                Marges hautes et basses optimisées pour les Stories Instagram
                            </p>
                        </div>
                    </div>

                    {/* Right: Customizer & Dish Inspector */}
                    <div className="lg:col-span-5 space-y-5">
                        
                        {/* Customization Card */}
                        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                                <Palette className="w-4 h-4 text-[#E1567A]" />
                                Personnalisation du flyer
                            </h2>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <label className="font-semibold text-stone-700 block mb-1">
                                        Sous-titre sous MENU :
                                    </label>
                                    <input
                                        type="text"
                                        value={weekSubtitle}
                                        onChange={e => setWeekSubtitle(e.target.value)}
                                        placeholder="de la semaine"
                                        className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none text-stone-800"
                                    />
                                </div>

                                <div>
                                    <label className="font-semibold text-stone-700 block mb-1">
                                        Signature / Site en bas :
                                    </label>
                                    <input
                                        type="text"
                                        value={footerText}
                                        onChange={e => setFooterText(e.target.value)}
                                        placeholder="elisabatchcooking.com"
                                        className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none text-stone-800"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dish List Breakdown */}
                        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                                <Eye className="w-4 h-4 text-[#E1567A]" />
                                Plats affichés sur le flyer ({menu?.recipes.length || 0})
                            </h2>

                            {loading ? (
                                <p className="text-xs text-stone-500">Chargement...</p>
                            ) : (
                                <div className="space-y-3.5 text-xs">
                                    {Object.entries(grouped).map(([category, dishes]) => {
                                        if (dishes.length === 0) return null;
                                        return (
                                            <div key={category} className="space-y-1">
                                                <span className="font-bold text-[#E5B124] uppercase tracking-wide block pb-0.5 border-b border-stone-100">
                                                    {category} ({dishes.length})
                                                </span>
                                                <ul className="space-y-1 pl-1">
                                                    {dishes.map((d, i) => (
                                                        <li key={i} className="text-stone-700 flex items-start gap-1.5">
                                                            <span className="text-stone-400">•</span>
                                                            <span className="font-medium">{d.name}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="pt-3 border-t border-stone-200">
                                <Button
                                    onClick={handleDownload}
                                    className="w-full bg-[#E1567A] hover:bg-[#c94567] text-white font-semibold text-xs h-10 gap-2 shadow-sm rounded-full"
                                >
                                    <Download className="w-4 h-4" />
                                    Télécharger le visuel HD
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>

            </main>
        </div>
    );
}
