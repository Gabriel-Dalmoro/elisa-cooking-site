import OwnerOnly from '@/components/admin/OwnerOnly';

// Elisa only: chefs are sent back to the admin home
export default function Layout({ children }: { children: React.ReactNode }) {
    return <OwnerOnly>{children}</OwnerOnly>;
}
