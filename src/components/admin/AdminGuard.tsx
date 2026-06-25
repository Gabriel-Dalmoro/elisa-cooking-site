"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminGuardProps {
    children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const isAuth = sessionStorage.getItem('admin_auth') === 'true';
        if (!isAuth) {
            const redirectUrl = encodeURIComponent(pathname);
            router.replace(`/admin?redirect=${redirectUrl}`);
        } else {
            setAuthorized(true);
        }
    }, [router, pathname]);

    if (!authorized) {
        return (
            <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E1567A]"></div>
                    <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider animate-pulse">
                        Vérification des accès...
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
