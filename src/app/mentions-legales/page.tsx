import React from "react";
import { MoveLeft, Scale, MapPin, Mail, Phone, Globe } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Mentions Légales | Elisa Batch Cooking",
    description: "Mentions légales du site internet Elisa Batch Cooking, Service à la Personne.",
};

export default function MentionsLegalesPage() {
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
                            <Scale className="h-8 w-8" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight mb-4">
                            Mentions Légales
                        </h1>
                        <p className="text-stone-500 text-lg">
                            Conformément aux dispositions des articles 6-III et 19 de la Loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l'économie numérique, dite L.C.E.N., il est porté à la connaissance des utilisateurs du site <em>elisabatchcooking.com</em> les présentes mentions légales.
                        </p>
                    </header>

                    <div className="space-y-12 text-stone-600 leading-relaxed">

                        {/* 1. Editeur du site */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-black text-stone-900 m-0 border-l-4 border-brand-rose pl-4">1. Éditeur du site</h2>
                            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                <ul className="space-y-4">
                                    <li className="flex gap-3">
                                        <Globe className="h-6 w-6 text-stone-400 flex-shrink-0" />
                                        <div>
                                            <strong className="block text-stone-900">Éditeur & Propriétaire</strong>
                                            Madame Elisa Curtelin, exerçant sous le nom commercial <strong>Elisa Batch Cooking</strong>.
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <MapPin className="h-6 w-6 text-stone-400 flex-shrink-0" />
                                        <div>
                                            <strong className="block text-stone-900">Siège social</strong>
                                            245 CHE DU CHAMP PEQUYAN 74000 ANNECY France
                                        </div>
                                    </li>
                                    <li>
                                        <strong className="block text-stone-900 mb-1">SIRET</strong>
                                        95318342300011
                                    </li>
                                    <li>
                                        <strong className="block text-stone-900 mb-1">Agrément SAP</strong>
                                        Déclaration Service à la Personne (SAP) n° [Numéro SAP - À compléter]
                                    </li>
                                    <li className="flex gap-3 mt-4 pt-4 border-t border-stone-200">
                                        <Mail className="h-6 w-6 text-stone-400 flex-shrink-0" />
                                        <span className="self-center">contactchefelisa@gmail.com</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <Phone className="h-6 w-6 text-stone-400 flex-shrink-0" />
                                        <span className="self-center">+33 6 52 07 72 03</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* 2. Responsable de publication */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-black text-stone-900 m-0 border-l-4 border-brand-gold pl-4">2. Responsable de la publication</h2>
                            <p className="text-lg">
                                La directrice de la publication est <strong>Madame Elisa Curtelin</strong>.<br />
                                Le site internet a été développé et conçu par <strong>Gabriel Dalmoro</strong>.
                            </p>
                        </section>

                        {/* 3. Hébergement */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-black text-stone-900 m-0 border-l-4 border-emerald-400 pl-4">3. Hébergement</h2>
                            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                                <p className="text-lg mb-4">Le site est hébergé par <strong>Vercel Inc.</strong></p>
                                <ul className="space-y-2">
                                    <li><strong className="text-stone-900">Adresse :</strong> 340 S Lemon Ave #4133 Walnut, CA 91789, USA.</li>
                                    <li><strong className="text-stone-900">Site internet :</strong> <a href="https://vercel.com" className="text-emerald-700 hover:underline" target="_blank" rel="noopener noreferrer">https://vercel.com</a></li>
                                </ul>
                            </div>
                        </section>

                        {/* 4. Propriété intellectuelle */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-black text-stone-900 m-0 border-l-4 border-stone-300 pl-4">4. Propriété intellectuelle</h2>
                            <p className="text-lg">
                                La structure générale, ainsi que les textes, images animées ou non, sons, savoir-faire et tous les autres éléments composant le site sont la propriété exclusive de l'éditeur ou de ses partenaires. Toute représentation totale ou partielle de ce site, par quelque procédé que ce soit, sans l'autorisation expresse de l'exploitant du site Internet est interdite et constituerait une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
                            </p>
                        </section>

                    </div>
                </div>
            </div>
        </main>
    );
}
