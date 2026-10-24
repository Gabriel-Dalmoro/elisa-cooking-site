import { getCurrentStaff } from '@/lib/auth';
import { listStaff } from '@/lib/db/staff';
import { AppHeader } from '@/components/layout/AppHeader';
import { StaffProvider, ChefSummary } from '@/components/admin/StaffContext';
import PreviewViewAs from '@/components/admin/PreviewViewAs';

// Who is signed in changes per request
export const dynamic = 'force-dynamic';

/**
 * Every admin page: the brand header (« Admin » for Elisa, « Chef · Lucas » for a chef)
 * and who is signed in, so pages can hide what a chef can't use (the server enforces it anyway).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const staff = await getCurrentStaff();

    // The team's chefs, for assignment pickers and colours (owner, or preview to switch views)
    let chefs: ChefSummary[] = [];
    if (staff && (staff.role === 'owner' || staff.isPreview)) {
        try {
            chefs = (await listStaff())
                .filter(s => s.role === 'chef')
                .map(s => ({ userId: s.userId, displayName: s.displayName || s.email, city: s.city, active: s.active }));
        } catch (e) {
            console.error('[admin layout] team lookup failed:', e);
        }
    }

    const label = staff?.role === 'chef' ? `Chef · ${(staff.displayName || '').split(/\s+/)[0] || 'Chef'}` : 'Admin';

    return (
        <StaffProvider
            value={{
                role: staff?.role || null,
                userId: staff?.userId || null,
                displayName: staff?.displayName || null,
                isPreview: Boolean(staff?.isPreview),
                chefs
            }}
        >
            <AppHeader space="admin" label={label} />
            {children}
            <PreviewViewAs />
        </StaffProvider>
    );
}
