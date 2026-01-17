import { Cookie, Croissant, Wheat } from 'lucide-react';

export function SweetMenu() {
    return (
        <section className="mt-20 mb-10 w-full max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                    <Cookie className="h-3.5 w-3.5" /> Le petit plus
                </div>
                <h2 className="text-3xl font-black text-stone-800 tracking-tight mb-2">
                    La Touche <span className="text-amber-500 font-serif italic">Douceur</span>
                </h2>
                <p className="text-stone-500 text-sm md:text-base max-w-lg mx-auto">
                    En partenariat avec <strong className="text-stone-700">Butter Mood</strong>.
                    Ajoutez ces douceurs artisanales à votre commande pour le petit-déjeuner ou le goûter.
                </p>
            </div>

            <div className="bg-[#FAF7F5] border border-stone-100 rounded-[2rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
                {/* Decorative background logo/text match */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">

                    {/* Cookies Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                                <Cookie className="h-4 w-4" />
                            </span>
                            <h3 className="text-xl font-bold text-stone-800">Les Cookies</h3>
                        </div>

                        <div className="space-y-6">
                            <MenuItem
                                name="Classique"
                                price="2,50 €"
                                description="Pâte à cookie aux pépites de chocolat"
                            />
                            <MenuItem
                                name="Beurre de cacahuète"
                                price="3 €"
                                description="Pépites chocolat & cacahuètes, cœur fondant beurre de cacahuète maison, fleur de sel"
                            />
                            <MenuItem
                                name="Tout Chocolat"
                                price="4 €"
                                description="Cacao, pépites & grué, cœur fondant ganache chocolat noir"
                            />
                            <MenuItem
                                name="Pâte à Tartiner"
                                price="4 €"
                                description="Pépites & noisettes torréfiées, cœur fondant pâte à tartiner maison"
                            />
                            <MenuItem
                                name="Sans Gluten"
                                price="3 €"
                                description="Base flocons d'avoine, mélange farine sans gluten et pépites de chocolat"
                            />
                        </div>
                    </div>

                    {/* Right Column: Other Sweets & Bakery */}
                    <div className="space-y-10">
                        {/* Gourmandises */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                                    <Croissant className="h-4 w-4" />
                                </span>
                                <h3 className="text-xl font-bold text-stone-800">Gourmandises</h3>
                            </div>

                            <div className="space-y-6">
                                <MenuItem
                                    name="Tigré au Chocolat"
                                    price="3 €"
                                    description="Financier, pépites & grué, ganache chocolat noir"
                                />
                                <MenuItem
                                    name="Brownie Choco-Noisette"
                                    price="3 €"
                                    description="Chocolat noir, éclats de noisettes, praliné maison"
                                />
                                <MenuItem
                                    name="Brookie"
                                    price="3 €"
                                    description="Mi-brownie fondant chocolat noir, mi-cookie pépites"
                                />
                            </div>
                        </div>

                        {/* Boulangerie */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                                    <Wheat className="h-4 w-4" />
                                </span>
                                <h3 className="text-xl font-bold text-stone-800">Boulangerie <span className="text-xs font-normal text-stone-400 ml-2">(Taille unique 30 cm)</span></h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-baseline border-b border-stone-200 border-dashed pb-2">
                                    <span className="font-bold text-stone-700">Pain de Mie</span>
                                    <span className="font-bold text-amber-600">6,50 €</span>
                                </div>
                                <div className="flex justify-between items-baseline border-b border-stone-200 border-dashed pb-2">
                                    <span className="font-bold text-stone-700">Grande Brioche</span>
                                    <span className="font-bold text-amber-600">15 €</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

function MenuItem({ name, price, description }: { name: string, price: string, description: string }) {
    return (
        <div className="group">
            <div className="flex justify-between items-baseline mb-1">
                <h4 className="font-bold text-stone-700 group-hover:text-amber-600 transition-colors">{name}</h4>
                <span className="font-bold text-amber-600 shrink-0 ml-4">{price}</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-[90%]">
                {description}
            </p>
        </div>
    );
}
