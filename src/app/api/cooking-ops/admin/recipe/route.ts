import { NextRequest, NextResponse } from 'next/server';
import { updateWeeklyDishRecipe, updateWeeklyMenuDishes, saveVaultRecipe } from '@/lib/cookingOpsStore';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Bulk update of all 8 dishes for the week (replacing Google Sheets)
        if (Array.isArray(body.dishes)) {
            const updatedMenu = updateWeeklyMenuDishes(body.dishes);
            return NextResponse.json({ success: true, menu: updatedMenu });
        }

        // 2. Add a new recipe to the vault
        if (body.action === 'save_vault') {
            const vaultItem = saveVaultRecipe({
                name: body.name,
                category: body.category,
                instructions: body.instructions || [],
                chefNotes: body.chefNotes || ''
            });
            return NextResponse.json({ success: true, vaultItem });
        }

        // 3. Update single recipe instructions & chef notes
        const { dishId, instructions, chefNotes, name, category } = body;
        if (!dishId && !name) {
            return NextResponse.json({ error: 'ID ou nom du plat requis' }, { status: 400 });
        }

        const updated = updateWeeklyDishRecipe(dishId, {
            instructions,
            chefNotes,
            name,
            category
        });

        return NextResponse.json({
            success: true,
            dish: updated
        });
    } catch (error) {
        console.error('Error updating recipe:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
