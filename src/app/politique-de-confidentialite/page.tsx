import React from "react";
import { MoveLeft, ShieldAlert, Database, Cookie, UserCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Politique de Confidentialité | Elisa Batch Cooking",
    description: "Politique de confidentialité et protection des données personnelles (RGPD).",
};

export default function PolitiqueConfidentialitePage() {
    return (
        <main className="min-h-screen bg-stone-50 py-16 md:py-24 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand-rose/5 blur-[120px] rounded-full -mr-20 -mt-20 -z-10" />
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-brand-gold/5 blur-[100px] rounded-full -ml-20 -mb-20 -z-10" />

            <div className="container mx-auto px-4 max-w-4xl relative z-10">
                <Link href="/" className="inline-flex items-center text-sm font-bold text-stone-400 hover:text-brand-rose transition-colors mb-8 bg-white px-4 py-2 rounded-full shadow-sm border border-stone-100">
                    <MoveLeft className="mr-2 h-4 w-4" /> Retour à l'accueil
                </Link>

                <div className="bg-white p-8 md:p-14 rounded-[3rem] shadow-2xl shadow-stone-200/50 border border-stone-100">
                    <header className="mb-12 border-b border-stone-100 pb-8">
                        <div className="mx-auto h-16 w-16 bg-stone-100 text-stone-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-stone-200">
                            <ShieldAlert className="h-8 w-8 text-brand-rose" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight mb-4">
                            Politique de Confidentialité (RGPD)
                        </h1>
                        <p className="text-stone-500 text-lg">
                            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                        </p>
                    </header>

                    <div className="space-y-12 text-stone-600 leading-relaxed">

                        {/* 1. Introduction */}
                        <section className="space-y-4">
                            <p className="text-lg">
                                Chez <strong>Elisa Batch Cooking</strong>, la protection de vos données personnelles est une priorité. La présente politique explique comment et pourquoi nous recueillons, utilisons et protégeons vos informations lorsque vous visitez notre site web <em>elisabatchcooking.com</em> et utilisez nos services.
                            </p>
                        </section>

                        {/* 2. Données collectées */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-stone-50 text-stone-600 p-2.5 rounded-xl border border-stone-200">
                                    <Database className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-black text-stone-900 m-0">1. Données Personnelles Collectées</h2>
                            </div>
                            <p className="text-lg">Nous pouvons collecter les données suivantes :</p>
                            <ul className="list-disc pl-6 space-y-2 text-lg">
                                <li><strong>Via les formulaires de contact et d'abonnement :</strong> Nom, prénom, adresse e-mail, numéro de téléphone, adresse postale (pour les interventions à domicile).</li>
                                <li><strong>Lors de l'utilisation du simulateur :</strong> Préférences alimentaires, nombre de personnes au foyer, nombre de repas souhaités.</li>
                            </ul>
                        </section>

                        {/* 3. Utilisation des données */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-emerald-100">
                                    <UserCheck className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-black text-stone-900 m-0">2. Utilisation de vos données</h2>
                            </div>
                            <p className="text-lg mb-4">Les données recueillies sont strictement utilisées pour :</p>
                            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                                <ul className="list-disc pl-6 space-y-2 text-lg">
                                    <li>Traiter vos demandes de contact et établir des devis.</li>
                                    <li>Gérer vos abonnements et la facturation (via notre partenaire Abby).</li>
                                    <li>Organiser les prestations de batch cooking à votre domicile.</li>
                                    <li>Éditer les attestations fiscales (Service à la Personne).</li>
                                </ul>
                            </div>
                            <p className="text-lg italic mt-4">Nous ne revendons jamais vos données à des tiers à des fins commerciales.</p>
                        </section>

                        {/* 4. Durée de conservation */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-black text-stone-900 m-0 border-l-4 border-brand-rose pl-4">3. Durée de conservation</h2>
                            <p className="text-lg">
                                Vos données personnelles sont conservées le temps nécessaire à la gestion de la relation commerciale et à la facturation. En matière de Service à la Personne, certaines données fiscales et factures doivent être conservées pendant une durée légale de 10 ans.
                            </p>
                        </section>

                        {/* 5. Sécurité et Sous-traitants */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-black text-stone-900 m-0 border-l-4 border-brand-gold pl-4">4. Destinataires et Sous-traitants</h2>
                            <p className="text-lg">
                                Nous utilisons des outils tiers sécurisés pour gérer notre activité. Ces sous-traitants sont conformes au RGPD :
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-lg">
                                <li><strong>n8n :</strong> Outil d'automatisation des formulaires et emails.</li>
                                <li><strong>Abby / Stripe :</strong> Plateforme de facturation et de paiement sécurisé en ligne.</li>
                            </ul>
                        </section>

                        {/* 6. Cookies */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-stone-100 text-stone-600 p-2.5 rounded-xl">
                                    <Cookie className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-black text-stone-900 m-0">5. Gestion des Cookies</h2>
                            </div>
                            <p className="text-lg">
                                Notre site utilise des cookies techniques strictement nécessaires au bon fonctionnement de l'application web (ex: Vercel Analytics pour mesurer l'audience de manière anonyme). Nous n'utilisons pas de cookies de ciblage publicitaire nécessitant votre consentement préalable (pas de cookies de tiers).
                            </p>
                        </section>

                        {/* 7. Droits */}
                        <section className="space-y-4 pt-8 border-t border-stone-100">
                            <h2 className="text-2xl font-black text-stone-900 m-0">6. Vos droits (Accès, Rectification, Suppression)</h2>
                            <p className="text-lg">
                                Conformément à la loi "Informatique et Libertés" et au RGPD européen, vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression des données vous concernant.
                            </p>
                            <p className="text-lg font-medium p-4 bg-stone-50 rounded-xl">
                                Vous pouvez exercer ce droit en nous contactant directement par e-mail à l'adresse : <strong className="text-brand-rose">contactchefelisa@gmail.com</strong>
                            </p>
                        </section>

                    </div>
                </div>
            </div>
        </main>
    );
}
