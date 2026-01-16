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
                            <Link href="https://wa.me/33652077203" target="_blank" className="h-10 w-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:text-[#25D366] transition-all">
                                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
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
