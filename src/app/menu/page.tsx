import { getPublicWeekMenu } from '@/lib/db/menus';
import { WeeklyDish, WeeklyMenuData } from '@/lib/types/cooking-ops';
import { ChefHat, Calendar, Utensils, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { RecipeCard } from '@/components/menu/RecipeCard';
import { SweetMenu } from '@/components/menu/SweetMenu';

// Refreshed every 5 minutes: a menu Elisa publishes in the admin shows up here on its own
export const revalidate = 300;

async function loadMenu(): Promise<WeeklyMenuData | null> {
    try {
        return await getPublicWeekMenu();
    } catch (error) {
        console.error('Error loading public menu:', error);
        return null;
    }
}

// Dishes grouped by category, in the order Elisa placed them on the menu
function groupByCategory(dishes: WeeklyDish[]): { category: string; dishes: WeeklyDish[] }[] {
    const groups: { category: string; dishes: WeeklyDish[] }[] = [];
    for (const dish of dishes) {
        const category = dish.category || 'Autres';
        const group = groups.find(g => g.category.toLowerCase() === category.toLowerCase());
        if (group) group.dishes.push(dish);
        else groups.push({ category, dishes: [dish] });
    }
    return groups;
}

export default async function MenuPage() {
    const menu = await loadMenu();

    if (!menu) {
        return (
            <main className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="h-16 w-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-400">
                        <Utensils className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-900 mb-2">Menu en préparation</h1>
                    <p className="text-stone-500 mb-8">Nous mettons à jour les recettes de la semaine. Revenez d'ici quelques instants !</p>
                    <Link href="/">
                        <button className="px-6 py-3 bg-brand-rose text-white rounded-full font-bold shadow-lg shadow-brand-rose/20 hover:scale-105 transition-all">
                            Retour à l'accueil
                        </button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-stone-50 py-16 md:py-24 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand-rose/5 blur-[120px] rounded-full -mr-20 -mt-20 -z-10" />
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-brand-gold/5 blur-[100px] rounded-full -ml-20 -mb-20 -z-10" />

            <div className="container mx-auto px-4 max-w-5xl">
                {/* Header */}
                <header className="text-center mb-16 md:mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-rose/10 text-brand-rose rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                        <Calendar className="h-3.5 w-3.5" /> {menu.weekLabel}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-tight mb-4">
                        La Carte de la <span className="text-brand-rose underline decoration-brand-rose/20 underline-offset-8">Semaine</span>
                    </h1>
                    <p className="text-stone-500 text-base md:text-lg max-w-xl mx-auto">
                        Cuisine 100% maison avec des produits frais, locaux et de saison.
                    </p>
                </header>

                {/* Recipes, grouped by category */}
                <div className="space-y-12">
                    {groupByCategory(menu.recipes).map(group => (
                        <section key={group.category}>
                            <div className="flex items-center gap-4 mb-6">
                                <h2 className="text-xs font-black uppercase tracking-[0.25em] text-stone-500 shrink-0">
                                    {group.category}
                                </h2>
                                <div className="h-px bg-stone-200 flex-1" />
                                <span className="text-[10px] font-bold text-stone-400 shrink-0">
                                    {group.dishes.length} plat{group.dishes.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {group.dishes.map((dish, index) => (
                                    <RecipeCard
                                        key={dish.id}
                                        recipe={{ name: dish.name, type: dish.category, description: dish.description }}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Sweet Menu Add-on */}
                <SweetMenu />

                {/* Final CTA */}
                <div className="mt-20 text-center bg-stone-900 rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('/images/hero-food.png')] bg-cover bg-center mix-blend-overlay" />

                    <div className="relative z-10 flex flex-col items-center">
                        <h2 className="text-2xl md:text-4xl font-black text-white mb-4 tracking-tight">
                            Libérez vos <span className="text-brand-rose">soirées.</span>
                        </h2>
                        <p className="text-stone-400 text-base md:text-lg max-w-lg mx-auto mb-8">
                            Repartez avec 6 plats prêts à être réchauffés.
                            Finie la corvée des courses et de la cuisine !
                        </p>
                        <Link href="/simulateur">
                            <button className="group inline-flex items-center gap-3 px-8 py-4 bg-brand-rose text-white rounded-full text-lg font-bold shadow-xl shadow-brand-rose/20 hover:scale-105 transition-all">
                                Commencer ma simulation
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
