import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Elisa Batch Cooking',
        short_name: 'Elisa Cooking',
        description: 'Votre cheffe à domicile à Annecy.',
        start_url: '/',
        display: 'standalone',
        background_color: '#fff1f2',
        theme_color: '#e11d48',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
            {
                src: '/icon.png',
                sizes: '192x192',
                type: 'image/png',
            },
        ],
    }
}
