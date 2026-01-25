"use client";

import { useEffect } from "react";
import { clarity } from "react-microsoft-clarity";

export function MicrosoftClarity() {
    useEffect(() => {
        // Only initialize if ID is present
        // You can find your Project ID at https://clarity.microsoft.com/projects/view/settings/overview
        if (process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID) {
            clarity.init(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID);
        }
    }, []);

    return null;
}
