"use client";

import { motion } from "framer-motion";
import {
    CheckCircle2,
    Clock,
    Euro,
    FileText,
    HelpCircle,
    ShieldCheck,
    TrendingDown,
    ArrowRight
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function CreditImpotPage() {
    return (
        <main className="min-h-screen bg-stone-50 pb-20">
            {/* 1. Hero Section */}
            <section className="relative overflow-hidden pt-16 pb-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Badge className="mb-4 bg-brand-gold text-stone-900 border-none px-4 py-1 text-sm font-semibold shadow-sm">
                                Service à la Personne (SAP)
                            </Badge>
                            <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl mb-6">
                                Offrez-vous un Chef à domicile. <br />
                                <span className="text-brand-rose">L'État finance la moitié.</span>
                            </h1>
                            <p className="text-xl text-stone-600 mb-8 leading-relaxed">
                                Mes prestations de cuisine à domicile sont éligibles au crédit d'impôt de 50%.
                                Une solution premium devenue accessible à tous.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
                                <div className="bg-brand-rose h-3 w-full" />
                                <CardContent className="p-8 md:p-12">
                                    <div className="space-y-8">
                                        <div className="flex justify-between items-center text-stone-500">
                                            <span className="text-lg">Valeur de la prestation</span>
                                            <span className="text-2xl font-medium line-through decoration-stone-300">200 €</span>
                                        </div>
                                        <div className="flex justify-between items-end border-t border-stone-100 pt-8">
                                            <div>
                                                <span className="block text-sm font-bold uppercase tracking-wider text-brand-gold mb-1">Après Crédit d'Impôt</span>
                                                <span className="text-lg font-medium text-stone-900">Votre coût réel final</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-5xl font-black text-brand-rose tracking-tight">100 €</span>
                                            </div>
                                        </div>
                                        <div className="bg-stone-50 rounded-2xl p-4 flex items-center gap-3 text-stone-600 text-sm">
                                            <ShieldCheck className="h-5 w-5 text-brand-gold shrink-0" />
                                            <p>Dispositif officiel encadré par la Direction Générale des Entreprises.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 2. Process Section */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-16">
                        <h2 className="text-3xl font-extrabold text-stone-900 mb-4">Comment ça marche aujourd'hui ?</h2>
                        <p className="text-stone-600 max-w-2xl">
                            En attendant l'activation de l'avance immédiate, vous bénéficiez du dispositif classique,
                            garantissant votre remboursement annuel.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Steps */}
                        {[
                            {
                                icon: Euro,
                                title: "Réservation & Règlement",
                                desc: "Vous réservez votre créneau et réglez la totalité de la prestation après mon passage.",
                                badge: "Actif dès maintenant"
                            },
                            {
                                icon: FileText,
                                title: "Attestation Fiscale",
                                desc: "En début d'année, je vous transmets une attestation récapitulant toutes les prestations de l'année précédente.",
                                badge: null
                            },
                            {
                                icon: TrendingDown,
                                title: "Remboursement de 50%",
                                desc: "Le Trésor Public vous rembourse ou déduit 50% des sommes engagées lors de votre déclaration de revenus.",
                                badge: null
                            }
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className="relative bg-stone-50 rounded-3xl p-8 border border-stone-100 group hover:border-brand-gold/30 transition-colors"
                            >
                                {step.badge && (
                                    <Badge className="absolute -top-3 left-8 bg-emerald-500 hover:bg-emerald-600 text-white border-none">
                                        {step.badge}
                                    </Badge>
                                )}
                                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all duration-300">
                                    <step.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-stone-900 mb-4">{step.title}</h3>
                                <p className="text-stone-600 text-sm leading-relaxed">{step.desc}</p>
                                <div className="absolute top-1/2 -translate-y-1/2 -right-4 hidden lg:block text-stone-300">
                                    {i < 2 && <ArrowRight className="h-8 w-8" />}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Future Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <Card className="border-none shadow-xl bg-gradient-to-br from-stone-900 to-stone-800 text-white overflow-hidden rounded-[2.5rem]">
                            <CardContent className="p-8 md:p-16 relative">
                                <div className="absolute top-8 right-8">
                                    <Badge variant="outline" className="text-brand-gold border-brand-gold animate-pulse">
                                        En cours d'activation
                                    </Badge>
                                </div>
                                <div className="flex flex-col md:flex-row gap-12 items-center">
                                    <div className="flex-1">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-gold text-xs font-bold uppercase tracking-wider mb-6">
                                            <Clock className="h-3.5 w-3.5" />
                                            Prochainement
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-bold mb-6 italic">
                                            L'Avance Immédiate : Ne payez que 50% dès le départ.
                                        </h2>
                                        <p className="text-stone-300 text-lg leading-relaxed mb-8">
                                            Je suis actuellement en cours d'habilitation pour l'API 'Avance Immédiate' de l'URSSAF.
                                            D'ici quelques semaines, vous ne paierez que le reste à charge, sans attendre le remboursement !
                                        </p>
                                    </div>
                                    <div className="w-full md:w-1/3 opacity-40 blur-[2px] pointer-events-none scale-95 transition-all">
                                        {/* Visual representation of future UI */}
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                            <div className="h-4 w-2/3 bg-white/20 rounded mb-4" />
                                            <div className="h-8 w-full bg-brand-rose/40 rounded mb-4" />
                                            <div className="flex justify-between">
                                                <div className="h-4 w-1/4 bg-white/10 rounded" />
                                                <div className="h-4 w-1/4 bg-white/10 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* 4. Financial Simulator (Static) */}
            <section className="py-24 bg-stone-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold text-stone-900 mb-4">Un exemple concret pour le Pack Famille</h2>
                        <div className="mt-4 mx-auto h-1 w-20 bg-brand-gold rounded-full" />
                    </div>

                    <div className="max-w-2xl mx-auto bg-white rounded-[2rem] p-8 md:p-12 shadow-lg border border-stone-100">
                        <div className="space-y-6">
                            <div className="flex justify-between text-stone-700">
                                <span>Service Cuisine (Main d'œuvre)</span>
                                <span className="font-bold">250 €</span>
                            </div>
                            <div className="flex justify-between text-stone-700">
                                <span>Courses alimentaires</span>
                                <span className="font-bold">75 €</span>
                            </div>
                            <div className="flex justify-between text-stone-900 font-bold pt-4 border-t border-stone-100">
                                <span>Total réglé au Chef</span>
                                <span>325 €</span>
                            </div>
                            <div className="flex justify-between text-emerald-600 bg-emerald-50 p-4 rounded-xl font-medium">
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Crédit d'Impôt (50% de la main d'œuvre)
                                </span>
                                <span>-125 €</span>
                            </div>
                            <div className="flex justify-between items-center bg-brand-rose text-white p-6 rounded-2xl">
                                <span className="text-lg font-bold">Coût réel pour vous :</span>
                                <span className="text-3xl font-black">200 €</span>
                            </div>
                            <p className="text-center text-stone-400 text-xs mt-6 italic">
                                *Seule la partie main-d'œuvre (service) est éligible au crédit d'impôt. Les courses restent à votre charge.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. FAQ Section */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="p-3 bg-brand-gold/10 rounded-2xl">
                            <HelpCircle className="h-6 w-6 text-brand-gold" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-stone-900">Des questions ?</h2>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1" className="border-stone-100">
                            <AccordionTrigger className="text-left font-bold text-stone-900 hover:text-brand-rose">
                                Que se passe-t-il si je ne paie pas d'impôts ?
                            </AccordionTrigger>
                            <AccordionContent className="text-stone-600 leading-relaxed">
                                C'est tout l'intérêt d'un crédit d'impôt par rapport à une réduction d'impôt !
                                Si vous ne payez pas d'impôts, ou si le montant de votre réduction dépasse vos impôts,
                                le Trésor Public vous envoie un virement de la différence.
                                Tout le monde peut donc en bénéficier.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2" className="border-stone-100">
                            <AccordionTrigger className="text-left font-bold text-stone-900 hover:text-brand-rose">
                                Quand l'Avance Immédiate sera-t-elle prête ?
                            </AccordionTrigger>
                            <AccordionContent className="text-stone-600 leading-relaxed">
                                Je suis actuellement en phase d'habilitation administrative auprès de l'URSSAF.
                                C'est une étape obligatoire pour garantir la sécurité de vos données et paiements.
                                Le dossier est en cours de traitement, et je vous informerai dès son activation (prévue d'ici quelques semaines).
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3" className="border-stone-100">
                            <AccordionTrigger className="text-left font-bold text-stone-900 hover:text-brand-rose">
                                Y a-t-il un plafond annuel ?
                            </AccordionTrigger>
                            <AccordionContent className="text-stone-600 leading-relaxed">
                                Oui, les services à la personne sont plafonnés à 12 000 € de dépenses par an (soit 6 000 € de crédit d'impôt).
                                Ce plafond peut être majoré selon votre situation familiale ou si vous avez des personnes à charge.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>

            {/* 6. CTA Section */}
            <section className="py-24 container mx-auto px-4">
                <div className="bg-brand-rose rounded-[3rem] p-12 text-center text-white shadow-2xl shadow-brand-rose/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <h2 className="text-3xl md:text-5xl font-handwriting mb-8">
                        Hâte de cuisiner pour vous et de vous faire gagner ce temps précieux...
                    </h2>
                    <Button
                        asChild
                        size="lg"
                        className="bg-white text-brand-rose hover:bg-stone-50 px-10 py-8 rounded-full text-xl font-bold shadow-xl transition-transform hover:scale-105"
                    >
                        <Link href="/simulateur">
                            Calculer mon tarif réel
                            <ArrowRight className="ml-2 h-6 w-6" />
                        </Link>
                    </Button>
                </div>
            </section>
        </main>
    );
}
