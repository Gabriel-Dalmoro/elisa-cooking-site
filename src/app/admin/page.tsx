import AdminDashboard from '@/components/admin/AdminDashboard';
import { getCurrentStaff } from '@/lib/auth';

// Rendered per request: the greeting depends on who is logged in
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ acces?: string }> }) {
    const staff = await getCurrentStaff();
    // Same home for everyone: a chef just gets fewer tiles
    const isChef = staff?.role === 'chef';
    return (
        <AdminDashboard
            displayName={staff?.displayName || null}
            isOwner={!isChef}
            refused={isChef && (await searchParams).acces === 'refuse'}
        />
    );
}
