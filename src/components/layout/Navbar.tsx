"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Home, Calculator, Wallet, User, MessageSquare, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
    { name: "Accueil", href: "/", icon: Home },
    { name: "Tarifs", href: "/simulateur", icon: Calculator },
    { name: "Crédit d'impôt", href: "/credit-impot", icon: Wallet },
    { name: "À propos", href: "/a-propos", icon: User },
    { name: "Contact", href: "/contact", icon: MessageSquare },
];

export function Navbar() {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <header className="fixed top-0 z-50 w-full border-b border-stone-200/50 bg-white/70 backdrop-blur-md">
            <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo and Brand */}
                <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full shadow-md border border-stone-200 bg-white">
                        <Image
                            src="/images/logo.jpg"
                            alt="Elisa Batch Cooking Logo"
                            fill
                            className="object-cover"
                            priority
                            unoptimized
                        />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-stone-900 hidden sm:inline">
                        Elisa Batch Cooking
                    </span>
                    <span className="text-lg font-bold tracking-tight text-stone-900 sm:hidden">
                        Elisa
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-8 md:flex">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-sm font-medium text-stone-600 transition-colors hover:text-brand-rose"
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                {/* Desktop CTA */}
                <div className="hidden items-center md:flex">
                    <Button
                        asChild
                        className="bg-brand-rose hover:bg-brand-rose/90 text-white shadow-md transition-all hover:scale-105"
                    >
                        <Link href="/simulateur">Simuler mon tarif</Link>
                    </Button>
                </div>

                {/* Mobile Navigation */}
                <div className="flex items-center md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-stone-700">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="flex flex-col w-full border-none bg-stone-50 p-0 sm:max-w-sm">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-rose/5 rounded-full blur-[80px] -mr-32 -mt-32 -z-10" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-[80px] -ml-32 -mb-32 -z-10" />

                            <div className="p-8 flex flex-col items-center border-b border-stone-200/50 bg-white/50 backdrop-blur-sm">
                                <Link href="/" onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-3">
                                    <div className="relative h-20 w-20 overflow-hidden rounded-full shadow-xl border-4 border-white bg-white">
                                        <Image
                                            src="/images/logo.jpg"
                                            alt="Elisa Batch Cooking Logo"
                                            fill
                                            className="object-cover"
                                            priority
                                            unoptimized
                                        />
                                    </div>
                                    <span className="font-black text-stone-900 tracking-tight text-2xl">Elisa Batch Cooking</span>
                                </Link>
                            </div>

                            <div className="flex-1 overflow-y-auto py-8">
                                <div className="px-5 flex flex-col items-center space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-6">Navigation</p>
                                    {NAV_LINKS.map((link) => {
                                        const Icon = link.icon;
                                        return (
                                            <Link
                                                key={link.name}
                                                href={link.href}
                                                onClick={() => setIsOpen(false)}
                                                className="w-full flex flex-col items-center gap-2 p-6 rounded-3xl text-stone-600 font-bold hover:bg-white hover:text-brand-rose hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-300 group"
                                            >
                                                <div className="h-14 w-14 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-center justify-center text-stone-400 group-hover:text-brand-rose group-hover:scale-110 transition-all duration-300">
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <span className="text-xl">{link.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-8 bg-white/50 backdrop-blur-md border-t border-stone-200/50">
                                <Button
                                    asChild
                                    className="w-full rounded-3xl py-8 h-auto bg-brand-rose hover:bg-brand-rose/90 text-white shadow-xl shadow-brand-rose/20 text-lg font-bold group border-none"
                                >
                                    <Link href="/simulateur" onClick={() => setIsOpen(false)}>
                                        Simuler mon tarif
                                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
