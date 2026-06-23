"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Printer, ChevronRight, Check } from "lucide-react";

// Translations dictionary for dynamic language switching
const TRANSLATIONS = {
    fr: {
        partnerTagline: "Partenaire Gastronomique • Service Exclusif",
        meetChef: "La Cheffe Elisa",
        chefSchool: "Ferrandi Paris",
        chefBio: "Diplômée de la célèbre école Ferrandi Paris, Elisa s'est formée au sein de tables gastronomiques étoilées en France et en Australie. À Annecy, elle réunit la rigueur technique et ses inspirations de voyage pour concocter des plats sains, savoureux et sur-mesure chez vous.",
        servicesTitle: "Vos prestations de conciergerie culinaire",
        service1Tag: "01. Les Dîners",
        service1Title: "Les Dîners Faciles",
        service1Bullet1: "Plats chauds réconfortants prêts au frais",
        service1Bullet2: "Cuisinés en une seule fois chez vous",
        service1Bullet3: "À réchauffer en 10 min au retour du lac",
        service2Tag: "02. Les Déjeuners",
        service2Title: "Les Retours de Plage",
        service2Bullet1: "Salades fraîches, quiches et tartes salées",
        service2Bullet2: "Prêts à déguster sur la terrasse",
        service2Bullet3: "Formules déjeuners légères et gourmandes",
        service3Tag: "03. Les Douceurs",
        service3Title: "Petits-Déj & Goûters",
        service3Bullet1: "Granola maison, cookies et cakes sucrés",
        service3Bullet2: "Fruits frais découpés prêts au frigo",
        service3Bullet3: "Autonomie complète pour vos matins",
        offerTag: "★ Offre Partenaire Exclusive",
        offerTitle: "Profitez de 5% de réduction sur votre séjour",
        noteIngredients: "* Le coût des ingrédients n'est pas inclus dans nos tarifs de prestation (facturation au réel).",
        noteReserve: "* Il est conseillé de réserver vos dates au moins 48 heures à l'avance.",
        scanToReserve: "Scannez pour réserver",
        footerInfo: "Elisa Batch Cooking • Cheffe à Domicile Annecy & Alentours",
        footerContact: "Contact Direct : 06 52 07 72 03 • elisabatchcooking.com",
        
        // Dynamic fields
        welcomePitch: "« Pour sublimer votre séjour au lac d'Annecy, nous vous proposons une expérience culinaire d'exception directement dans votre hébergement. Libérez-vous des repas, savourez pleinement vos vacances. »",
        getTitle: (villa: string, loc: string) => {
            if (villa && loc) return `Votre Cheffe Privée à ${villa} (${loc})`;
            if (villa) return `Votre Cheffe Privée à ${villa}`;
            if (loc) return `Votre Cheffe Privée à ${loc}`;
            return "Votre Cheffe Privée à Domicile";
        },
        getOfferDesc: (villa: string, loc: string) => {
            const place = villa ? (loc ? `${villa} (${loc})` : villa) : (loc ? loc : "");
            if (place) {
                return `En tant qu'invité de ${place}, vous bénéficiez de -5% de réduction exclusive sur toutes nos prestations culinaires. Scannez le QR code ci-contre pour nous contacter directement par WhatsApp et planifier votre expérience culinaire.`;
            }
            return "En tant que voyageur privilégié de cet hébergement partenaire, vous bénéficiez de -5% de réduction exclusive sur toutes nos prestations culinaires. Scannez le QR code ci-contre pour nous contacter directement par WhatsApp.";
        }
    },
    en: {
        partnerTagline: "Gastronomic Partner • Exclusive Service",
        meetChef: "Meet Chef Elisa",
        chefSchool: "Ferrandi Paris",
        chefBio: "A graduate of the renowned Ferrandi Paris culinary school, Elisa trained in Michelin-starred gastronomic restaurants in France and Australia. In Annecy, she combines French culinary technique with travel inspirations to create healthy, flavorful, and tailor-made dishes in your kitchen.",
        servicesTitle: "Your custom culinary concierge services",
        service1Tag: "01. Dinners",
        service1Title: "Effortless Dinners",
        service1Bullet1: "Comforting meals ready in the fridge",
        service1Bullet2: "Prepared on-site in a single session",
        service1Bullet3: "Easy to reheat in 10 min after hikes",
        service2Tag: "02. Lunches",
        service2Title: "Lunches & Terraces",
        service2Bullet1: "Fresh salads, savory quiches and cakes",
        service2Bullet2: "Ready to eat on the terrace",
        service2Bullet3: "Light and flavorful holiday options",
        service3Tag: "03. Breakfasts & Snacks",
        service3Title: "Breakfasts & Snacks",
        service3Bullet1: "Homemade granola, cookies and cakes",
        service3Bullet2: "Fresh cut seasonal fruits in the fridge",
        service3Bullet3: "Complete morning autonomy",
        offerTag: "★ Exclusive Partner Offer",
        offerTitle: "Enjoy 5% discount during your stay",
        noteIngredients: "* The cost of ingredients is not included in our service fees (billed at cost).",
        noteReserve: "* Booking at least 48 hours in advance is highly recommended.",
        scanToReserve: "Scan to book",
        footerInfo: "Elisa Batch Cooking • Private Chef in Annecy & Surrounding Area",
        footerContact: "Direct Contact: +33 6 52 07 72 03 • elisabatchcooking.com",
        
        // Dynamic fields
        welcomePitch: "« To elevate your stay by Lake Annecy, we offer an exceptional culinary experience directly at your accommodation. Free yourself from cooking and fully savor your holidays. »",
        getTitle: (villa: string, loc: string) => {
            if (villa && loc) return `Your Private Chef at ${villa} (${loc})`;
            if (villa) return `Your Private Chef at ${villa}`;
            if (loc) return `Your Private Chef at ${loc}`;
            return "Your Private Chef during your stay";
        },
        getOfferDesc: (villa: string, loc: string) => {
            const place = villa ? (loc ? `${villa} (${loc})` : villa) : (loc ? loc : "");
            if (place) {
                return `As a guest of ${place}, you benefit from an exclusive 5% discount on all culinary services. Scan the QR code to contact us directly via WhatsApp and plan your dining experiences.`;
            }
            return "As a privileged traveler of this partner accommodation, you benefit from an exclusive 5% discount on all culinary services. Scan the QR code below to contact us directly via WhatsApp.";
        }
    }
};

function WelcomeVillaContent() {
    const searchParams = useSearchParams();
    const [villaName, setVillaName] = useState("");
    const [location, setLocation] = useState("");
    const [lang, setLang] = useState<"fr" | "en">("fr");
    const [showInstructions, setShowInstructions] = useState(true);

    // Sync state with URL params on initial load
    useEffect(() => {
        const villaParam = searchParams.get("villa");
        if (villaParam) setVillaName(villaParam);
        
        const locParam = searchParams.get("location");
        if (locParam) setLocation(locParam);
        
        const langParam = searchParams.get("lang");
        if (langParam === "en" || langParam === "fr") {
            setLang(langParam);
        }
        
        // Add layout-hiding class to body
        document.body.classList.add("hide-layout");
        return () => {
            document.body.classList.remove("hide-layout");
        };
    }, [searchParams]);

    // Construct a shortened redirect URL on the same origin (reduces QR code complexity/density for instant scanning)
    const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/wa`
        : 'https://elisabatchcooking.com/wa';

    const handlePrint = () => {
        window.print();
    };

    const text = TRANSLATIONS[lang];

    return (
        <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col lg:flex-row items-center lg:items-stretch justify-start p-4 lg:p-0 no-print-layout">
            
            {/* 1. Left Sidebar / Customizer Panel (Hidden during Print) */}
            <div className="no-print w-full lg:w-[400px] bg-stone-950 p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-stone-850 shrink-0">
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2 text-brand-rose font-serif italic text-lg mb-2">
                            <span className="h-2 w-2 rounded-full bg-brand-rose"></span>
                            Conciergerie Partenaire
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            Générateur de Fiche Guest Book
                        </h2>
                        <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                            Personnalisez les détails et la langue de la fiche A4 pour le livret d'accueil.
                        </p>
                    </div>

                    <hr className="border-stone-800" />

                    {/* Inputs */}
                    <div className="space-y-4">
                        {/* Language Selector */}
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider font-bold text-stone-300">
                                Langue de la Fiche
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLang("fr")}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                                        lang === "fr"
                                            ? "bg-brand-rose text-white border-brand-rose"
                                            : "bg-stone-900 text-stone-400 border-stone-800 hover:text-white"
                                    }`}
                                >
                                    Français
                                </button>
                                <button
                                    onClick={() => setLang("en")}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                                        lang === "en"
                                            ? "bg-brand-rose text-white border-brand-rose"
                                            : "bg-stone-900 text-stone-400 border-stone-800 hover:text-white"
                                    }`}
                                >
                                    English (EN)
                                </button>
                            </div>
                        </div>

                        {/* Accommodation Name Input */}
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider font-bold text-stone-300">
                                Nom de l'Hébergement
                            </label>
                            <input
                                type="text"
                                value={villaName}
                                onChange={(e) => setVillaName(e.target.value)}
                                className="w-full bg-stone-900 border border-stone-750 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-rose"
                                placeholder="Ex: Chalet du Lac (laisser vide pour générique)"
                            />
                        </div>

                        {/* Location Input */}
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider font-bold text-stone-300">
                                Localisation / Ville
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full bg-stone-900 border border-stone-750 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-rose"
                                placeholder="Ex: Sevrier (laisser vide pour générique)"
                            />
                        </div>
                    </div>

                    {showInstructions && (
                        <div className="bg-brand-rose/10 border border-brand-rose/20 rounded-xl p-4 space-y-2 text-xs text-stone-300 leading-relaxed relative">
                            <button 
                                onClick={() => setShowInstructions(false)}
                                className="absolute top-2 right-2 text-stone-400 hover:text-white"
                            >
                                ✕
                            </button>
                            <h4 className="font-bold text-brand-rose">Conseils d'impression :</h4>
                            <ul className="list-disc list-inside space-y-1.5 pl-1">
                                <li>Format : <strong>A4 Portrait</strong>.</li>
                                <li>Activez <strong>« Graphismes d'arrière-plan »</strong> (Background graphics) dans les options d'impression pour conserver les cadres dorés et les images.</li>
                                <li>Réglez les marges sur <strong>Aucune</strong> (ou par défaut).</li>
                            </ul>
                        </div>
                    )}
                </div>

                <div className="mt-8 lg:mt-0 space-y-4">
                    <button
                        onClick={handlePrint}
                        className="w-full bg-brand-rose hover:bg-brand-rose/90 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-rose/20 transition-all cursor-pointer text-sm"
                    >
                        <Printer className="h-4 w-4" />
                        Imprimer la fiche (A4)
                    </button>
                    <p className="text-[10px] text-stone-500 text-center leading-relaxed">
                        Lien de partage pré-configuré :<br />
                        <span className="font-mono text-stone-400 block mt-1 break-all select-all">
                            {typeof window !== 'undefined' ? `${window.location.origin}/welcome-villa?villa=${encodeURIComponent(villaName)}&location=${encodeURIComponent(location)}&lang=${lang}` : ''}
                        </span>
                    </p>
                </div>
            </div>

            {/* 2. Right Canvas Area (Holds the A4 Page Preview) */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 lg:p-8 bg-stone-900/60 w-full">
                
                {/* A4 Container */}
                <div 
                    id="a4-page"
                    className="w-[210mm] h-[297mm] bg-[#fafaf9] text-stone-900 relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden shrink-0 flex flex-col justify-between print:w-[210mm] print:h-[297mm] print:shadow-none print:bg-white print:border-none print:rounded-none select-none"
                    style={{
                        boxSizing: "border-box",
                    }}
                >
                    {/* Double Thin Luxury Frame */}
                    <div className="absolute inset-[8mm] border border-brand-gold/30 rounded-[4px] pointer-events-none" />
                    <div className="absolute inset-[9.5mm] border border-brand-gold/15 rounded-[3px] pointer-events-none" />

                    {/* Inner Content Area */}
                    <div className="relative h-full w-full p-[14mm] flex flex-col justify-between z-10">
                        
                        {/* --- TOP: BRAND HEADER --- */}
                        <div className="text-center space-y-2">
                            {/* Brand Logo */}
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-brand-gold/50 mx-auto shadow-sm bg-white">
                                <img
                                    src="/images/logo.jpg"
                                    alt="Elisa Cooking Logo"
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            
                            {/* Partner Tagline */}
                            <div className="flex items-center justify-center gap-1.5 text-[8.5px] uppercase tracking-[0.25em] font-medium text-stone-500">
                                <span>{text.partnerTagline}</span>
                            </div>

                            {/* Main Welcome Headline */}
                            <h1 className="font-serif text-[24px] text-stone-900 tracking-tight leading-tight mt-1">
                                {text.getTitle(villaName, location)}
                            </h1>

                            <div className="w-10 h-[1px] bg-brand-gold/50 mx-auto" />

                            {/* Welcome Pitch */}
                            <p className="text-[11px] text-stone-600 max-w-[460px] mx-auto leading-relaxed italic font-light">
                                {text.welcomePitch}
                            </p>
                        </div>

                        {/* --- NEW SECTION: IMAGE COLLAGE (2 columns of beautiful food photos) --- */}
                        <div className="grid grid-cols-2 gap-3 my-1">
                            <div className="aspect-[16/9] w-full relative rounded-xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100">
                                <img
                                    src="/images/proposals/WhatsApp Image 2026-05-29 at 17.06.51 (4).jpeg"
                                    alt="Expérience culinaire"
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <div className="aspect-[16/9] w-full relative rounded-xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100">
                                <img
                                    src="/images/proposals/WhatsApp Image 2026-05-29 at 17.06.51 (2).jpeg"
                                    alt="Table de fête"
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        </div>

                        {/* --- MIDDLE 1: CHEF PROFILE (Highly Condensed) --- */}
                        <div className="grid grid-cols-[70px_1fr] gap-4 items-center bg-stone-50 border border-stone-100 rounded-xl p-3.5 my-1">
                            <div className="w-[70px] h-[70px] relative rounded-lg overflow-hidden border border-brand-gold/20 shadow-sm bg-stone-100">
                                <img
                                    src="/images/chef-elisa.jpg"
                                    alt="Cheffe Elisa"
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-serif text-[13px] font-semibold text-stone-900 flex items-center gap-1.5">
                                    {text.meetChef}
                                    <span className="text-[9px] font-sans font-normal text-brand-rose px-1.5 py-0.5 rounded bg-brand-rose/5 border border-brand-rose/10 uppercase tracking-wider">
                                        {text.chefSchool}
                                    </span>
                                </h3>
                                <p className="text-[10px] text-stone-600 leading-relaxed font-light font-sans">
                                    {text.chefBio}
                                </p>
                            </div>
                        </div>

                        {/* --- MIDDLE 2: CONDENSED SERVICES OFFERED (3 Skimmable Columns) --- */}
                        <div className="space-y-1.5">
                            <h3 className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-400 text-center">
                                {text.servicesTitle}
                            </h3>
                            
                            <div className="grid grid-cols-3 gap-3">
                                {/* Service 1 */}
                                <div className="border border-stone-150 rounded-xl p-3 bg-white shadow-[0_1px_5px_rgba(0,0,0,0.01)] flex flex-col justify-between">
                                    <div className="space-y-1.5">
                                        <div className="text-brand-rose text-[10px] font-bold uppercase tracking-wider font-serif italic">
                                            {text.service1Tag}
                                        </div>
                                        <h4 className="font-bold text-[11px] text-stone-850 leading-tight">
                                            {text.service1Title}
                                        </h4>
                                        <ul className="text-[9.5px] text-stone-650 space-y-1 font-light font-sans">
                                            <li className="flex items-start gap-1">
                                                <Check className="h-2.5 w-2.5 text-brand-rose mt-0.5 shrink-0" />
                                                {text.service1Bullet1}
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <Check className="h-2.5 w-2.5 text-brand-rose mt-0.5 shrink-0" />
                                                {text.service1Bullet2}
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <Check className="h-2.5 w-2.5 text-brand-rose mt-0.5 shrink-0" />
                                                {text.service1Bullet3}
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Service 2 */}
                                <div className="border border-stone-150 rounded-xl p-3 bg-white shadow-[0_1px_5px_rgba(0,0,0,0.01)] flex flex-col justify-between">
                                    <div className="space-y-1.5">
                                        <div className="text-brand-rose text-[10px] font-bold uppercase tracking-wider font-serif italic">
                                            {text.service2Tag}
                                        </div>
                                        <h4 className="font-bold text-[11px] text-stone-850 leading-tight">
                                            {text.service2Title}
                                        </h4>
                                        <ul className="text-[9.5px] text-stone-650 space-y-1 font-light font-sans">
                                            <li className="flex items-start gap-1">
                                                <Check className="h-2.5 w-2.5 text-brand-rose mt-0.5 shrink-0" />
                                                {text.service2Bullet1}
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <Check className="h-2.5 w-2.5 text-brand-rose mt-0.5 shrink-0" />
                                                {text.service2Bullet2}
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <Check className="h-2.5 w-2.5 text-brand-rose mt-0.5 shrink-0" />
                                                {text.service2Bullet3}
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Service 3 */}
                                <div className="border border-stone-150 rounded-xl p-3 bg-white shadow-[0_1px_5px_rgba(0,0,0,0.01)] flex flex-col justify-between">
                                    <div className="space-y-1.5">
                                        <div className="text-brand-rose text-[10px] font-bold uppercase tracking-wider font-serif italic">
                                            {text.service3Tag}
                                        </div>
                                        <h4 className="font-bold text-[11px] text-stone-850 leading-tight">
                                            {text.service3Title}
                                        </h4>
                                        <ul className="text-[9.5px] text-stone-650 space-y-1 font-light font-sans">
                                            <li className="flex items-start gap-1">
                                                <Check className="h-2.5 w-2.5 text-brand-rose mt-0.5 shrink-0" />
                                                {text.service3Bullet1}
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <Check className="h-2.5 w-2.5 text-brand-rose mt-0.5 shrink-0" />
                                                {text.service3Bullet2}
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <Check className="h-2.5 w-2.5 text-brand-rose mt-0.5 shrink-0" />
                                                {text.service3Bullet3}
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- BOTTOM: TRAVELER PRIVILEGE & CALL TO ACTION --- */}
                        <div className="grid grid-cols-[1fr_110px] gap-5 items-center bg-gradient-to-br from-brand-gold/15 to-white border border-brand-gold/45 rounded-xl p-3.5">
                            
                            <div className="space-y-1.5">
                                <div className="inline-flex items-center gap-1 bg-brand-rose text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                    {text.offerTag}
                                </div>
                                <h3 className="font-serif text-[15px] font-bold text-stone-900 leading-tight">
                                    {text.offerTitle}
                                </h3>
                                <p className="text-[9.5px] text-stone-605 leading-relaxed font-light font-sans">
                                    {text.getOfferDesc(villaName, location)}
                                </p>
                                <div className="text-[8px] text-stone-450 italic mt-0.5 space-y-0.5 font-sans">
                                    <div>{text.noteIngredients}</div>
                                    <div>{text.noteReserve}</div>
                                </div>
                            </div>

                            {/* QR Code Column */}
                            <div className="text-center flex flex-col items-center justify-center space-y-1">
                                <a href={redirectUrl} target="_blank" rel="noopener noreferrer" className="block relative bg-white p-1.5 rounded-lg border border-stone-200 shadow-sm transition-transform hover:scale-105">
                                    <img
                                        src="/qr-code-wa.svg"
                                        alt="Scan QR Code"
                                        className="w-[80px] h-[80px]"
                                    />
                                </a>
                                <span className="text-[7.5px] font-bold uppercase tracking-wider text-stone-500 flex items-center justify-center gap-0.5">
                                    {text.scanToReserve}
                                    <ChevronRight className="h-2 w-2 text-brand-rose" />
                                </span>
                            </div>

                        </div>

                        {/* --- FOOTER LICENSE & WEBSITE --- */}
                        <div className="text-center flex justify-between items-center text-[8px] text-stone-400 mt-0.5 font-sans">
                            <span>{text.footerInfo}</span>
                            <span>{text.footerContact}</span>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default function WelcomeVillaPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-stone-900 flex items-center justify-center text-white font-serif italic text-xl">
                Chargement du configurateur...
            </div>
        }>
            <WelcomeVillaContent />
        </Suspense>
    );
}
