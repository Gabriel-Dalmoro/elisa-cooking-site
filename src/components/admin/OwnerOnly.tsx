import { redirect } from 'next/navigation';
import { getCurrentStaff } from '@/lib/auth';

/**
 * Server-side gate for Elisa-only pages (prices, gift cards, Instagram, Airbnb pages, team, menu editing).
 * A chef who opens the address is sent back to the admin home; their APIs refuse them anyway.
 */
export default async function OwnerOnly({ children }: { children: React.ReactNode }) {
    const staff = await getCurrentStaff();
    if (!staff) redirect('/admin/login');
    if (staff.role !== 'owner') redirect('/admin?acces=refuse');
    return <>{children}</>;
}
