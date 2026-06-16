import React from "react";
import { MoveLeft, AlertCircle, ShieldCheck, Scale, CreditCard, CalendarClock, Euro, RefreshCcw, Gift } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Conditions Générales de Vente | Elisa Batch Cooking",
    description: "Conditions Générales de Vente et d'Utilisation des services Elisa Batch Cooking.",
};

export default function CGVPage() {
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
                        <h1 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight mb-4">
                            Conditions Générales de Vente
                        </h1>
                        <div className="flex items-center gap-2 text-stone-400 font-medium text-sm">
                            <ClockIcon className="h-4 w-4" />
                            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                        </div>
                    </header>

                    <div className="space-y-12 text-stone-600 leading-relaxed">

                        {/* Section 1 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-stone-100 text-stone-600 p-2.5 rounded-xl">
                                    <Scale className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-black text-stone-900 m-0">1. Objet</h2>
                            </div>
                            <p className="text-lg">
                                Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre <strong className="text-stone-900">Elisa Batch Cooking</strong> (ci-après "le Prestataire") et toute personne physique (ci-après "le Client") souhaitant bénéficier des prestations de chef à domicile et batch cooking.
                            </p>
                        </section>

                        {/* Section 2 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-stone-100 text-stone-600 p-2.5 rounded-xl">
                                    <CalendarClock className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-black text-stone-900 m-0">2. Prestations et Réservations</h2>
                            </div>
                            <p className="text-lg">
                                Le Prestataire propose des services de préparation de repas à domicile. Toute réservation n'est définitive qu'après validation par le Prestataire et, le cas échéant, réception du paiement de la première prestation ou de la session d'essai.
                            </p>
                        </section>

                        {/* Section 3 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-stone-100 text-stone-600 p-2.5 rounded-xl">
                                    <CreditCard className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-black text-stone-900 m-0">3. Tarifs, Facturation et Paiement</h2>
                            </div>
                            <p className="text-lg">
                                Les tarifs sont indiqués en euros. La facturation est gérée via la plateforme sécurisée Abby (partenaire Stripe). Pour les prestations ponctuelles, le paiement est dû à l'issue ou avant la prestation, selon l'accord mutuel.
                            </p>
                        </section>

                        {/* Highlighted Section 4 - Subscription */}
                        <section className="bg-brand-gold/5 border-2 border-brand-gold/20 rounded-[2rem] p-8 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full -mr-16 -mt-16 blur-2xl" />

                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="bg-brand-gold text-stone-900 p-2.5 rounded-xl shadow-md shadow-brand-gold/20">
                                    <RefreshCcw className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-black text-stone-900 m-0">4. L'Option "Sérénité" (Abonnement)</h2>
                            </div>

                            <p className="text-lg text-stone-700 font-medium relative z-10">
                                L'Abonnement Sérénité permet au Client de bénéficier d'un tarif préférentiel (-15% sur la prestation) en contrepartie d'une régularité de service.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mt-6">
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                                    <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> Engagement
                                    </h4>
                                    <p className="text-sm">La souscription à l'Option Sérénité implique un engagement minimum de trois (3) mois.</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                                    <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-2">
                                        <Euro className="h-4 w-4 text-emerald-500" /> Facturation
                                    </h4>
                                    <p className="text-sm">La facturation est mensualisée et automatisée en fin ou début de mois pour simplifier vos démarches.</p>
                                </div>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-brand-gold/30 mt-4 relative z-10">
                                <h4 className="font-bold text-stone-900 mb-3 flex items-center gap-2 text-lg">
                                    <AlertCircle className="h-5 w-5 text-brand-rose" /> Mécanisme de Pause (Absences, Vacances)
                                </h4>
                                <p className="text-stone-700">
                                    En cas d'impossibilité (déplacement, vacances, etc.), l'abonnement peut être mis en pause. Le Client s'engage à prévenir le Prestataire <strong className="text-stone-900 bg-brand-rose/10 px-1.5 py-0.5 rounded">au moins 7 jours à l'avance</strong>. Dans ce cas, la facturation du mois concerné sera ajustée (réduite au prorata des sessions annulées) ou la session sera décalée à une date ultérieure, d'un commun accord.
                                </p>
                            </div>
                        </section>

                        {/* Section 5 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-black text-stone-900 m-0">5. Avantage Fiscal (Service à la Personne)</h2>
                            </div>
                            <p className="text-lg">
                                Le Prestataire dispose de l'agrément "Service à la Personne" (SAP). Ce dispositif permet au Client de bénéficier d'un crédit d'impôt égal à 50% des dépenses engagées pour les prestations de chef à domicile.
                            </p>
                            <p className="text-sm bg-stone-50 p-4 rounded-xl border border-stone-100 italic text-stone-500">
                                Note : La matière première (le coût des courses) n'est pas éligible à l'avantage fiscal. Le Prestataire fournit annuellement l'attestation fiscale nécessaire à votre déclaration.
                            </p>
                        </section>

                        {/* Section 6 */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-black text-stone-900 m-0">6. Achats et Remboursement des Ingrédients</h2>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-stone-900 mb-2">6.1 Nature de la Prestation</h3>
                                    <p className="text-lg mb-2">
                                        Le tarif payé lors de la réservation en ligne correspond aux honoraires de service du Chef. Cela inclut :
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2 text-lg">
                                        <li>La planification personnalisée des menus.</li>
                                        <li>Le temps passé à la sélection et à l'achat des produits (courses).</li>
                                        <li>La préparation des repas à domicile.</li>
                                        <li>Les frais de déplacement dans une limite de 15 km autour d'Annecy (ou du lieu de résidence du Chef). Au-delà de ce rayon de 15 km, des frais kilométriques supplémentaires de 0,60 € par kilomètre seront appliqués et facturés en sus.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-stone-900 mb-2">6.2 Processus d'Achat</h3>
                                    <p className="text-lg">
                                        Le Chef se charge de l'achat des ingrédients nécessaires pour garantir la qualité et la fraîcheur des produits.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-stone-900 mb-2">6.3 Remboursement des Courses</h3>
                                    <p className="text-lg mb-2">
                                        Le coût total des denrées alimentaires (courses) n'est pas inclus dans le tarif de prestation initial.
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2 text-lg">
                                        <li><strong>Justificatif :</strong> Le Chef présentera au Client le ticket de caisse original à l'issue de la prestation.</li>
                                        <li><strong>Paiement :</strong> Le Client s'engage à rembourser l'intégralité du montant indiqué sur le ticket de caisse dans un délai maximum de 48 heures suivant la prestation, par le moyen de paiement convenu (virement, Lydia/Paylib, etc.).</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Section 7 */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-black text-stone-900 m-0">7. Annulation et Remboursement</h2>
                            <p className="text-lg">
                                Le Client reconnaît que la réservation d'un créneau mobilise l'emploi du temps du Chef de manière exclusive. En conséquence, les conditions d'annulation suivantes s'appliquent :
                            </p>
                            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                <ul className="space-y-4 text-lg">
                                    <li><strong className="text-stone-900">Délai de Rétractation Express (moins de 2 heures après réservation) :</strong> Toute annulation effectuée dans les 2 heures suivant la confirmation de la commande donne lieu à un remboursement intégral (100%).</li>
                                    <li><strong className="text-stone-900">Annulation Standard (plus de 48 heures avant la prestation) :</strong> Pour toute annulation intervenant après le délai de 2 heures et jusqu'à 48 heures avant la date prévue, le Client sera remboursé de la somme versée, déduction faite de 50 € de frais administratifs et de dossier.</li>
                                    <li><strong className="text-stone-900">Annulation Tardive (moins de 48 heures avant la prestation) :</strong> Toute annulation intervenant moins de 48 heures avant le début de la prestation ne donnera lieu à aucun remboursement. La prestation sera facturée et due dans son intégralité.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 8 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-stone-100 text-stone-600 p-2.5 rounded-xl">
                                    <Gift className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-black text-stone-900 m-0">8. Bons Cadeaux</h2>
                            </div>
                            <p className="text-lg">
                                Le Prestataire propose l'achat de bons cadeaux sous forme de forfaits de services (Packs Découverte, Spécial, Famille ou Confort) pour des séances de batch cooking à domicile. Les dispositions suivantes régissent l'achat et l'utilisation de ces bons cadeaux :
                            </p>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-stone-900 mb-2">8.1 Processus d'Achat et Livraison</h3>
                                    <p className="text-lg">
                                        Les bons cadeaux sont achetés en ligne et payés intégralement au moment de la commande via la plateforme sécurisée de paiement. Une fois le paiement validé, un bon cadeau au format numérique (PDF) est envoyé par courrier électronique à l'adresse indiquée par le Client.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-stone-900 mb-2">8.2 Durée de Validité</h3>
                                    <p className="text-lg">
                                        Chaque bon cadeau est valable pour une durée de <strong>six (6) mois</strong> à compter de sa date d'achat. La séance de batch cooking correspondante doit être planifiée et réalisée avant la date d'expiration du bon. Passé ce délai de six mois, le bon cadeau devient caduc et ne peut plus être utilisé ni donner lieu à un quelconque remboursement ou dédommagement.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-stone-900 mb-2">8.3 Exclusion du Coût des Ingrédients</h3>
                                    <p className="text-lg">
                                        Le prix d'achat du bon cadeau couvre exclusivement les honoraires de service du Chef (temps de préparation, planification du menu, courses et déplacement selon les conditions de l'Article 6). Il <strong>n'inclut pas</strong> le coût des ingrédients et denrées alimentaires nécessaires à la réalisation des recettes. Le remboursement des courses reste à la charge exclusive du bénéficiaire du bon cadeau et s'effectue conformément à l'Article 6.3.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-stone-900 mb-2">8.4 Réglementation Fiscale (Exclusion du Crédit d'Impôt)</h3>
                                    <p className="text-lg">
                                        Conformément à la réglementation des Services à la Personne (SAP) :
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2 text-lg">
                                        <li>L'achat d'un bon cadeau <strong>n'ouvre pas droit au crédit d'impôt</strong> de 50% pour le Client acquéreur.</li>
                                        <li>La prestation étant offerte à titre gratuit au bénéficiaire, ce dernier ne peut prétendre à aucun avantage fiscal ni crédit d'impôt au titre de la session réalisée.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-stone-900 mb-2">8.5 Non-Remboursable et Non-Échangeable</h3>
                                    <p className="text-lg">
                                        Les bons cadeaux sont nominatifs et fermes. Ils ne sont ni remboursables (sauf exercice du droit de rétractation légal par l'acheteur dans les conditions de l'Article 7), ni échangeables contre des espèces ou d'autres prestations non prévues par le pack acheté.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-stone-900 mb-2">8.6 Réservation de la Session</h3>
                                    <p className="text-lg">
                                        Le bénéficiaire du bon cadeau doit contacter le Prestataire pour convenir d'une date de prestation. La planification de la séance s'effectue selon les disponibilités du Prestataire. Il est recommandé de réserver le créneau au moins plusieurs semaines à l'avance.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 9 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-stone-100 text-stone-600 p-2.5 rounded-xl">
                                    <Scale className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-black text-stone-900 m-0">9. Litiges</h2>
                            </div>
                            <p className="text-lg">
                                En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux français seront seuls compétents pour régler le différend.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
