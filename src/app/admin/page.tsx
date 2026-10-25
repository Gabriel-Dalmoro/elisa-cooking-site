import AdminDashboard from '@/components/admin/AdminDashboard';
import ChefDashboard from '@/components/admin/ChefDashboard';
import { getCurrentStaff } from '@/lib/auth';

// Rendered per request: the greeting depends on who is logged in
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ acces?: string }> }) {
    const staff = await getCurrentStaff();
    // A chef gets their own, simpler home (only their day-to-day tools)
    if (staff?.role === 'chef') {
        return <ChefDashboard displayName={staff.displayName} refused={(await searchParams).acces === 'refuse'} />;
    }
    return <AdminDashboard displayName={staff?.displayName || null} />;
}
