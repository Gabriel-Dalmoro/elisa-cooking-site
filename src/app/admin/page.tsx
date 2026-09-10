import AdminDashboard from '@/components/admin/AdminDashboard';
import { getCurrentStaff } from '@/lib/auth';

// Rendered per request: the greeting depends on who is logged in
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    const staff = await getCurrentStaff();
    return <AdminDashboard displayName={staff?.displayName || null} />;
}
