import OwnerOnly from '@/components/admin/OwnerOnly';

// Elisa only: prices and invoices are never shown to a chef (their APIs refuse them too, and the
// billing tables are owner-only in Supabase RLS)
export default function Layout({ children }: { children: React.ReactNode }) {
    return <OwnerOnly>{children}</OwnerOnly>;
}
