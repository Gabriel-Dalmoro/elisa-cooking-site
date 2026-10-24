import Image from "next/image";
import Link from "next/link";
import { Lock, User } from "lucide-react";

/**
 * Header of the "app" side: admin pages and the client's personal link.
 * Same pill, logo and title as the public site, plus who this space is for.
 * It scrolls away with the page (not fixed) so it never covers a list while shopping or choosing.
 */
export function AppHeader({ space, label }: { space: "admin" | "client"; label?: string }) {
    const brand = (
        <>
            <div className="relative h-9 w-9 overflow-hidden rounded-full shadow-inner ring-1 ring-stone-200 bg-white flex-shrink-0">
                <Image src="/images/logo.jpg" alt="Elisa Batch Cooking Logo" fill className="object-cover" priority unoptimized />
            </div>
            <span className="text-[15px] sm:text-lg font-black tracking-tight text-stone-900 whitespace-nowrap">
                Elisa <span className="text-brand-rose">Batch Cooking</span>
            </span>
        </>
    );

    return (
        <header className="absolute top-6 z-50 w-full px-4 sm:px-6 lg:px-8 print:hidden">
            <div className="container mx-auto max-w-7xl">
                <nav className="flex h-16 items-center justify-between gap-2 px-3 sm:px-6 rounded-full border border-white/20 bg-white/70 backdrop-blur-xl shadow-lg ring-1 ring-stone-900/5">
                    {/* Admin: the logo goes back to the admin home. Client: no link, they stay on their page */}
                    {space === "admin" ? (
                        <Link href="/admin" className="flex items-center gap-2.5 sm:gap-3 min-w-0 transition-all hover:scale-105">
                            {brand}
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">{brand}</div>
                    )}

                    {space === "admin" ? (
                        <Link
                            href="/admin"
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-stone-900 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider px-3 sm:px-4 h-8 sm:h-9 shadow-md hover:bg-stone-800 transition-colors"
                        >
                            <Lock className="h-3.5 w-3.5 text-brand-rose" /> {label || "Admin"}
                        </Link>
                    ) : (
                        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-brand-rose/10 text-brand-rose border border-brand-rose/20 text-[11px] sm:text-xs font-bold uppercase tracking-wider px-3 sm:px-4 h-8 sm:h-9">
                            <User className="h-3.5 w-3.5" /> Espace client
                        </span>
                    )}
                </nav>
            </div>
        </header>
    );
}
