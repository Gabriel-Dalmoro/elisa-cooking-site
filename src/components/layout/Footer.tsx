import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, Instagram, Facebook } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-stone-100 py-16 text-stone-600">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
                    {/* Column 1: Contact Info */}
                    <div className="flex flex-col gap-6">
                        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90 grayscale opacity-80">
                            <div className="relative h-8 w-8 overflow-hidden rounded-full">
                                <Image
                                    src="/images/logo.jpg"
                                    alt="Elisa Batch Cooking Logo"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-stone-900">
                                Elisa Batch Cooking
                            </span>
                        </Link>
                        <div className="flex flex-col gap-4">
                            <a href="tel:+33652077203" className="flex items-center gap-3 hover:text-brand-rose transition-colors">
                                <Phone className="h-5 w-5 text-brand-gold" />
                                <span>06 52 07 72 03</span>
                            </a>
                            <a href="mailto:contactchefelisa@gmail.com" className="flex items-center gap-3 hover:text-brand-rose transition-colors">
                                <Mail className="h-5 w-5 text-brand-gold" />
                                <span>contactchefelisa@gmail.com</span>
                            </a>
                        </div>
                        <div className="flex gap-4">
                            <Link href="https://www.instagram.com/elisabatchcooking/" target="_blank" className="h-10 w-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:text-brand-rose transition-all">
                                <Instagram className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div className="flex flex-col gap-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                            Navigation
                        </h3>
                        <nav className="flex flex-col gap-3">
                            <Link href="/" className="hover:text-brand-rose transition-colors">Accueil</Link>
                            <Link href="/menu" className="hover:text-brand-rose transition-colors">Le Menu</Link>
                            <Link href="/simulateur" className="hover:text-brand-rose transition-colors">Tarifs</Link>
                            <Link href="/credit-impot" className="hover:text-brand-rose transition-colors">Crédit d'impôt</Link>
                            <Link href="/a-propos" className="hover:text-brand-rose transition-colors">À propos</Link>
                            <Link href="/contact" className="hover:text-brand-rose transition-colors">Contact</Link>
                        </nav>
                    </div>

                    {/* Column 3: Legal */}
                    <div className="flex flex-col gap-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                            Informations Légales
                        </h3>
                        <nav className="flex flex-col gap-3">
                            <Link href="/mentions-legales" className="hover:text-brand-rose transition-colors">Mentions Légales</Link>
                            <Link href="/cgv" className="hover:text-brand-rose transition-colors">CGV</Link>
                            <Link href="/politique-de-confidentialite" className="hover:text-brand-rose transition-colors">Politique de Confidentialité</Link>
                        </nav>
                        <p className="mt-4 text-xs leading-relaxed opacity-70">
                            © {new Date().getFullYear()} Elisa Batch Cooking. Tous droits réservés. <br />
                            Service à la personne - Agrément SAP.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
