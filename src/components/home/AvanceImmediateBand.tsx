import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Home page announcement: the URSSAF « avance immédiate » is live, clients only pay half.
 * Example = the recommended formula (6 recettes · 4 personnes, 270 €).
 */
export function AvanceImmediateBand() {
    return (
        <section className="bg-stone-50 pb-16 lg:pb-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-[2.5rem] bg-stone-900 text-white px-6 py-10 md:px-12 md:py-14 shadow-2xl">
                    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-rose/25 blur-3xl" />
                    <div className="absolute -left-16 -bottom-24 h-64 w-64 rounded-full bg-brand-gold/15 blur-3xl" />

                    <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-brand-gold px-3 py-1 text-[11px] font-black uppercase tracking-widest text-stone-900">
                                <Sparkles className="h-3.5 w-3.5" />
                                Nouveau · En vigueur
                            </span>
                            <h2 className="mt-5 text-3xl font-extrabold tracking-tight md:text-4xl">
                                L&apos;avance immédiate est active.<br />
                                <span className="text-brand-rose">Vous ne payez plus que 50 %.</span>
                            </h2>
                            <p className="mt-4 max-w-xl text-stone-300 leading-relaxed">
                                Plus besoin d&apos;avancer la totalité ni d&apos;attendre votre déclaration d&apos;impôts :
                                l&apos;URSSAF règle directement la moitié de chaque prestation, dès la facture.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center gap-4">
                                <Button asChild size="lg" className="h-12 px-7 font-bold bg-brand-rose hover:bg-brand-rose/90 text-white rounded-full">
                                    <Link href="/simulateur">
                                        Calculer mon tarif
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                <Link href="/credit-impot" className="text-sm font-semibold text-stone-300 underline-offset-4 hover:text-white hover:underline">
                                    Comment ça marche ?
                                </Link>
                            </div>
                        </div>

                        {/* A real example, the way it shows on the invoice */}
                        <div className="rounded-3xl bg-white p-6 text-stone-900 shadow-xl md:p-8">
                            <p className="text-[11px] font-black uppercase tracking-widest text-stone-400">Exemple · 6 recettes pour 4 personnes</p>
                            <div className="mt-5 space-y-3 text-sm">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-stone-500">Prestation</span>
                                    <span className="font-semibold tabular-nums text-stone-400 line-through decoration-stone-300">270 €</span>
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-emerald-600">Réglé par l&apos;URSSAF</span>
                                    <span className="font-semibold tabular-nums text-emerald-600">−135 €</span>
                                </div>
                                <div className="flex items-baseline justify-between border-t border-dashed border-stone-200 pt-4">
                                    <span className="font-bold">Vous payez</span>
                                    <span className="text-4xl font-black tabular-nums text-brand-rose">135 €</span>
                                </div>
                            </div>
                            <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-stone-500">
                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                                Dispositif officiel URSSAF et DGFiP, gratuit et optionnel. Courses non comprises.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
