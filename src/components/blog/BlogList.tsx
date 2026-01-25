"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, ArrowRight } from "lucide-react";
import { Post } from "@/lib/notion";

interface BlogListProps {
    posts: Post[];
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export function BlogList({ posts }: BlogListProps) {
    if (posts.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-stone-200">
                <p className="text-stone-400 font-medium">Aucun article pour le moment. Revenez bientôt !</p>
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
            {posts.map((post) => (
                <motion.article
                    key={post.id}
                    variants={item}
                    className="group bg-white rounded-[2.5rem] overflow-hidden border border-stone-100 shadow-xl shadow-stone-200/50 hover:shadow-2xl hover:shadow-brand-rose/10 transition-all duration-500 hover:-translate-y-2 flex flex-col"
                >
                    <Link href={`/blog/${post.slug}`} className="relative h-64 overflow-hidden">
                        <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-stone-900 shadow-lg">
                            {new Date(post.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </div>
                    </Link>

                    <div className="p-8 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-1 w-8 bg-brand-rose rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                                Chef Elisa
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-stone-900 mb-3 group-hover:text-brand-rose transition-colors leading-tight">
                            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                        </h2>
                        <p className="text-stone-500 text-sm mb-6 line-clamp-3 leading-relaxed">
                            {post.excerpt}
                        </p>

                        <div className="mt-auto pt-6 border-t border-stone-50 flex items-center justify-between">
                            <Link
                                href={`/blog/${post.slug}`}
                                className="group/btn flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-rose"
                            >
                                Lire l'article
                                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                            </Link>
                            <ChevronRight className="h-4 w-4 text-stone-200 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </motion.article>
            ))}
        </motion.div>
    );
}
