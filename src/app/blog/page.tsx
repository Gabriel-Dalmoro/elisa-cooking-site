import React from "react";
import Image from "next/image";
import { BlogList } from "@/components/blog/BlogList";
import { getPosts } from "@/lib/notion";
import * as motion from "framer-motion/client";

export default async function BlogPage() {
    const posts = await getPosts();

    return (
        <main className="min-h-screen bg-stone-50 pb-20">
            {/* Hero Header */}
            <div className="relative h-[60vh] min-h-[450px] flex items-center justify-center overflow-hidden -mt-24 md:mt-0">
                <img
                    src="/images/blog-hero.jpg"
                    alt="Le Carnet d'Elisa"
                    className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105"
                />

                {/* Subtle dark overlay for contrast */}
                <div className="absolute inset-0 bg-black/10" />

                <div className="relative z-10 text-center px-4 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-3 py-1 bg-brand-rose text-white text-[9px] font-black uppercase tracking-[0.4em] rounded-full mb-6 shadow-lg"
                    >
                        Inspiration & Saveurs
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-4 drop-shadow-xl"
                    >
                        Le Carnet d'Elisa
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-stone-500 text-xl md:text-3xl font-handwriting tracking-tighter leading-tight drop-shadow-sm"
                    >
                        Hâte de cuisiner pour vous et de vous faire gagner ce temps précieux...
                    </motion.p>
                </div>
            </div>

            {/* Posts Grid - Now delegating to Client Component */}
            <div className="container mx-auto px-4 -mt-16 relative z-20">
                <BlogList posts={posts} />
            </div>
        </main>
    );
}
