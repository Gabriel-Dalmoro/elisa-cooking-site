import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PromoBanner } from "@/components/layout/PromoBanner";
import { Suspense } from "react";
import { getSiteConfig } from "@/lib/googleSheets";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import { MicrosoftClarity } from "@/components/analytics/MicrosoftClarity";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fontHandwriting = Caveat({
  variable: "--font-handwriting",
  subsets: ["latin"],
});

const fontSerif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Elisa Batch Cooking | Cheffe à Domicile & Traiteur à Annecy",
    template: "%s | Elisa Batch Cooking"
  },
  description: "Simplifiez votre quotidien avec Elisa, votre cheffe à domicile à Annecy. Batch Cooking : des plats sains, frais et faits maison pour toute la semaine. 50% de crédit d'impôt immédiat.",
  keywords: ["batch cooking annecy", "chef à domicile annecy", "traiteur annecy", "repas préparés", "cuisine saine", "livraison repas annecy", "service à la personne annecy", "elisa batch cooking"],
  authors: [{ name: "Elisa Batch Cooking" }],
  creator: "Elisa Batch Cooking",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://elisabatchcooking.com",
    title: "Elisa Batch Cooking | Cheffe à Domicile à Annecy - Repas Sains",
    description: "Gagnez du temps : une semaine de repas sains et faits maison, cuisinés directement chez vous à Annecy. Service déclaré SAP (50% crédit d'impôt).",
    siteName: "Elisa Batch Cooking",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Elisa Batch Cooking - Votre Cheffe à Domicile à Annecy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elisa Batch Cooking | Votre Cheffe à Domicile à Annecy",
    description: "Des repas sains et faits maison pour toute la semaine, préparés chez vous par Elisa.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getSiteConfig();
  const hasPromo = config?.promoActive;

  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "name": "Elisa Batch Cooking",
              "image": [
                "https://elisabatchcooking.com/images/hero-food.png",
                "https://elisabatchcooking.com/images/og-image.png"
              ],
              "serviceType": "Batch Cooking & Chef à domicile",
              "provider": {
                "@type": "LocalBusiness",
                "name": "Elisa Batch Cooking",
                "image": "https://elisabatchcooking.com/images/logo.jpg",
                "telephone": "+33652077203",
                "priceRange": "€€",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Annecy",
                  "addressRegion": "Haute-Savoie",
                  "postalCode": "74000",
                  "addressCountry": "FR"
                },
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": 45.8992,
                  "longitude": 6.1294
                },
                "sameAs": [
                  "https://www.instagram.com/elisabatchcooking/",
                  "https://wa.me/33652077203"
                ]
              },
              "areaServed": {
                "@type": "City",
                "name": "Annecy"
              },
              "description": "Service de Batch Cooking et Chef à domicile à Annecy. Repas sains et faits maison préparés chez vous. Agrément Service à la Personne."
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fontHandwriting.variable} ${fontSerif.variable} antialiased selection:bg-brand-rose/20 ${hasPromo ? 'has-promo' : ''}`}
      >
        {hasPromo && (
          <Suspense fallback={null}>
            <PromoBanner config={config!} />
          </Suspense>
        )}
        <Navbar />
        <div className={cn("transition-all duration-300", hasPromo ? "pt-[19rem] lg:pt-40" : "pt-20")}>

          {children}
        </div>
        <Footer />
        <Analytics />
        <MicrosoftClarity />
      </body>
    </html>
  );
}
export const revalidate = 60;

