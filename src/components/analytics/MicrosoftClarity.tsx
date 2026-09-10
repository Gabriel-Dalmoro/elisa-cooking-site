"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { clarity } from "react-microsoft-clarity";

// Pages showing client personal data (addresses, access codes, allergies) must never be recorded
const PRIVATE_PREFIXES = ["/admin", "/choisir", "/welcome-villa"];

export function MicrosoftClarity() {
    const pathname = usePathname();
    const isPrivate = PRIVATE_PREFIXES.some(p => pathname?.startsWith(p));

    useEffect(() => {
        // You can find your Project ID at https://clarity.microsoft.com/projects/view/settings/overview
        const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
        if (!projectId) return;

        if (isPrivate) {
            // Stop recording if the visitor navigated here from a public page
            if (clarity.hasStarted()) clarity.stop();
        } else if (!clarity.hasStarted()) {
            clarity.init(projectId);
        } else {
            clarity.start();
        }
    }, [isPrivate]);

    return null;
}
