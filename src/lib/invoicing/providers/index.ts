import { manualProvider } from './manual';
import type { InvoicingProvider, InvoicingProviderId } from './types';

/**
 * The invoicing provider in use: « manual » unless INVOICING_PROVIDER=abby.
 * With manual, the Abby module is never even imported: no code path can reach the Abby API.
 */
export function invoicingProviderId(env: Record<string, string | undefined> = process.env): InvoicingProviderId {
    return (env.INVOICING_PROVIDER || '').trim().toLowerCase() === 'abby' ? 'abby' : 'manual';
}

export async function getInvoicingProvider(): Promise<InvoicingProvider> {
    if (invoicingProviderId() !== 'abby') return manualProvider;
    const { createAbbyProvider } = await import('./abby');
    return createAbbyProvider();
}

export type { InvoicingProvider, InvoicingProviderId, ProviderContext, ProviderResult } from './types';
