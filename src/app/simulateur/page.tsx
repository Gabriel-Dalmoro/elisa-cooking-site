import { Suspense } from 'react';
import { SimulatorForm } from '@/components/simulator/SimulatorForm';
import { getSiteConfig } from '@/lib/googleSheets';
import { getLeadMenuFields } from '@/lib/leadMenu';

export const revalidate = 600; // Revalidate every 10 minutes

export default async function SimulatorPage() {
    const [promoConfig, leadMenu] = await Promise.all([getSiteConfig(), getLeadMenuFields()]);

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="animate-pulse text-stone-400 font-medium">Chargement du simulateur...</div>
            </div>
        }>
            <SimulatorForm promoConfig={promoConfig} leadMenu={leadMenu} />
        </Suspense>
    );
}
