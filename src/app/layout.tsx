import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

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

export const metadata: Metadata = {
  title: {
    default: "Elisa Batch Cooking | Votre Cheffe à Domicile à Annecy",
    template: "%s | Elisa Batch Cooking"
  },
  description: "Simplifiez votre quotidien avec Elisa Batch Cooking. Des plats sains, savoureux et faits maison, préparés directement chez vous à Annecy. 50% de crédit d'impôt immédiat.",
  keywords: ["batch cooking", "chef à domicile", "Annecy", "cuisine saine", "repas préparés", "aide à domicile", "crédit d'impôt service à la personne"],
  authors: [{ name: "Elisa Batch Cooking" }],
  creator: "Elisa Batch Cooking",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://elisabatchcooking.com",
    title: "Elisa Batch Cooking | Votre Cheffe à Domicile à Annecy",
    description: "Des repas sains et faits maison pour toute la semaine, préparés chez vous. Gagnez du temps et mangez mieux.",
    siteName: "Elisa Batch Cooking",
    images: [
      {
        url: "/images/hero-food.png",
        width: 1200,
        height: 630,
        alt: "Elisa Batch Cooking - Cuisine Saine à Domicile",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elisa Batch Cooking | Votre Cheffe à Domicile à Annecy",
    description: "Des repas sains et faits maison pour toute la semaine, préparés chez vous.",
    images: ["/images/hero-food.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
              "serviceType": "Batch Cooking & Chef à domicile",
              "provider": {
                "@type": "LocalBusiness",
                "name": "Elisa Batch Cooking",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Annecy",
                  "addressRegion": "Haute-Savoie",
                  "addressCountry": "FR"
                }
              },
              "areaServed": {
                "@type": "City",
                "name": "Annecy"
              },
              "description": "Service de Batch Cooking et Chef à domicile à Annecy. Repas sains et faits maison préparés chez vous."
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fontHandwriting.variable} antialiased selection:bg-brand-rose/20`}
      >
        <Navbar />
        <div className="pt-20">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
