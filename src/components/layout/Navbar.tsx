"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Home, Calculator, Wallet, User, MessageSquare, ArrowRight, Utensils } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
    { name: "Accueil", href: "/", icon: Home },
    { name: "Le Menu", href: "/menu", icon: Utensils },
    { name: "Tarifs", href: "/simulateur", icon: Calculator },
    { name: "Crédit d'impôt", href: "/credit-impot", icon: Wallet },
    { name: "À propos", href: "/a-propos", icon: User },
    { name: "Contact", href: "/contact", icon: MessageSquare },
];

export function Navbar() {
    const [isOpen, setIsOpen] = React.useState(false);
    const pathname = usePathname();

    return (
        <header className="fixed top-6 z-50 w-full px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-7xl">
                <nav className="flex h-16 items-center justify-between px-6 rounded-full border border-white/20 bg-white/70 backdrop-blur-xl shadow-lg ring-1 ring-stone-900/5">
                    {/* Logo and Brand */}
                    <Link href="/" className="flex items-center gap-3 transition-all hover:scale-105">
                        <div className="relative h-9 w-9 overflow-hidden rounded-full shadow-inner ring-1 ring-stone-200 bg-white flex-shrink-0">
                            <Image
                                src="/images/logo.jpg"
                                alt="Elisa Batch Cooking Logo"
                                fill
                                className="object-cover"
                                priority
                                unoptimized
                            />
                        </div>
                        <span className="text-lg font-black tracking-tight text-stone-900 hidden sm:inline-block">
                            Elisa <span className="text-brand-rose">Batch Cooking</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1">
                        {NAV_LINKS.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={cn(
                                        "relative px-4 py-2 text-sm font-bold transition-all duration-300 rounded-full",
                                        isActive
                                            ? "text-brand-rose bg-brand-rose/5"
                                            : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                                    )}
                                >
                                    {link.name}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-brand-rose rounded-full"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex">
                            <Button
                                asChild
                                className="rounded-full bg-brand-rose hover:bg-brand-rose/90 text-white text-xs font-bold px-6 h-10 shadow-md group transition-all"
                            >
                                <Link href="/simulateur">
                                    Estimation
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>

                        {/* Mobile Navigation Toggle */}
                        <div className="lg:hidden">
                            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-stone-100">
                                        <Menu className="h-5 w-5 text-stone-900" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="flex flex-col w-full border-none bg-stone-50 p-0 sm:max-w-sm">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-rose/5 rounded-full blur-[80px] -mr-32 -mt-32 -z-10" />

                                    <div className="p-4 flex flex-col items-center border-b border-stone-200/50 bg-white/50 backdrop-blur-sm">
                                        <Link href="/" onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-2">
                                            <div className="relative h-16 w-16 overflow-hidden rounded-full shadow-2xl border-4 border-white bg-white">
                                                <Image
                                                    src="/images/logo.jpg"
                                                    alt="Elisa Batch Cooking Logo"
                                                    fill
                                                    className="object-cover"
                                                    priority
                                                    unoptimized
                                                />
                                            </div>
                                            <span className="font-black text-stone-900 tracking-tight text-lg mt-1">Elisa Batch Cooking</span>
                                        </Link>
                                    </div>

                                    <div className="flex-1 overflow-y-auto py-6">
                                        <div className="px-6 flex flex-col space-y-2">
                                            {NAV_LINKS.map((link) => {
                                                const Icon = link.icon;
                                                const isActive = pathname === link.href;
                                                return (
                                                    <Link
                                                        key={link.name}
                                                        href={link.href}
                                                        onClick={() => setIsOpen(false)}
                                                        className={cn(
                                                            "w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 font-bold",
                                                            isActive
                                                                ? "bg-white text-brand-rose shadow-xl shadow-brand-rose/5"
                                                                : "text-stone-500 hover:bg-white hover:text-stone-900"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "h-9 w-9 rounded-xl flex items-center justify-center transition-colors",
                                                            isActive ? "bg-brand-rose/10 text-brand-rose" : "bg-white border border-stone-100 text-stone-400"
                                                        )}>
                                                            <Icon className="h-5 w-5" />
                                                        </div>
                                                        <span className="text-base">{link.name}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/80 backdrop-blur-md border-t border-stone-200/50">
                                        <Button
                                            asChild
                                            className="w-full rounded-2xl py-4 h-auto bg-brand-rose hover:bg-brand-rose/90 text-white shadow-xl shadow-brand-rose/20 text-base font-bold group border-none"
                                        >
                                            <Link href="/simulateur" onClick={() => setIsOpen(false)}>
                                                Simulation gratuite
                                                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                            </Link>
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </nav>
            </div>
        </header>
    );
}
