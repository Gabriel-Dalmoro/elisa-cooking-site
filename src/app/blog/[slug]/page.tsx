import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Share2 } from "lucide-react";
import { getPostBySlug } from "@/lib/notion";
import * as motion from "framer-motion/client";

// Basic block renderer component (Server-side compatible)
function NotionBlockRenderer({ blocks }: { blocks: any[] }) {
    if (!blocks) return null;

    return (
        <div className="space-y-6">
            {blocks.map((block: any) => {
                const { type } = block;
                const value = block[type];

                switch (type) {
                    case "paragraph":
                        return (
                            <p key={block.id} className="text-lg text-stone-600 leading-relaxed">
                                {value.rich_text.map((t: any) => t.plain_text)}
                            </p>
                        );
                    case "heading_1":
                        return (
                            <h1 key={block.id} className="text-4xl font-black text-stone-900 mt-12 mb-6">
                                {value.rich_text.map((t: any) => t.plain_text)}
                            </h1>
                        );
                    case "heading_2":
                        return (
                            <h2 key={block.id} className="text-3xl font-black text-stone-900 mt-10 mb-5">
                                {value.rich_text.map((t: any) => t.plain_text)}
                            </h2>
                        );
                    case "heading_3":
                        return (
                            <h3 key={block.id} className="text-2xl font-black text-stone-900 mt-8 mb-4">
                                {value.rich_text.map((t: any) => t.plain_text)}
                            </h3>
                        );
                    case "bulleted_list_item":
                        return (
                            <li key={block.id} className="text-lg text-stone-600 ml-6 list-disc">
                                {value.rich_text.map((t: any) => t.plain_text)}
                            </li>
                        );
                    case "image":
                        const src = value.type === "external" ? value.external.url : value.file.url;
                        return (
                            <figure key={block.id} className="my-10 rounded-[2rem] overflow-hidden shadow-2xl">
                                <img src={src} alt="Article content" className="w-full object-cover" />
                                {value.caption?.[0] && (
                                    <figcaption className="text-center text-sm text-stone-400 mt-4 italic">
                                        {value.caption[0].plain_text}
                                    </figcaption>
                                )}
                            </figure>
                        );
                    default:
                        return null;
                }
            })}
        </div>
    );
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return (
            <div className="min-h-screen bg-stone-50 pt-32 text-center">
                <h1 className="text-2xl font-bold text-stone-900 mb-4">Article introuvable</h1>
                <Link href="/blog" className="text-brand-rose font-bold">Retour au blog</Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-stone-50 pb-20">
            {/* Post Hero */}
            <header className="relative h-[60vh] min-h-[500px] flex items-end overflow-hidden">
                <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />

                <div className="container mx-auto px-4 relative z-10 pb-16 md:pb-24">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 group"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            <span className="text-xs font-black uppercase tracking-widest">Retour au blog</span>
                        </Link>

                        <div className="flex items-center gap-4 mb-6">
                            <span className="px-3 py-1 bg-brand-rose text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-brand-rose/20">
                                Gastronomie
                            </span>
                            <div className="flex items-center gap-2 text-white/60 text-xs font-bold">
                                <Calendar className="h-3 w-3" />
                                {new Date(post.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight max-w-4xl leading-[1.1]">
                            {post.title}
                        </h1>
                    </motion.div>
                </div>
            </header>

            {/* Content Area */}
            <div className="container mx-auto px-4 mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        <motion.article
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl border border-stone-100"
                        >
                            {/* Article Intro / Author Info */}
                            <div className="flex flex-wrap items-center gap-8 mb-12 pb-12 border-b border-stone-50">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-full bg-brand-rose flex items-center justify-center text-white shadow-xl shadow-brand-rose/20 relative overflow-hidden">
                                        <Image
                                            src="/images/logo.jpg"
                                            alt="Chef Elisa"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-stone-400 leading-none mb-1">Écrit par</p>
                                        <p className="text-base font-bold text-stone-900">Chef Elisa</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 text-stone-400 text-xs font-bold uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span>5 min de lecture</span>
                                    </div>
                                    <button className="flex items-center gap-2 hover:text-brand-rose transition-colors">
                                        <Share2 className="h-4 w-4" />
                                        <span>Partager</span>
                                    </button>
                                </div>
                            </div>

                            {/* Render Notion Content */}
                            {post.blocks && post.blocks.length > 0 ? (
                                <NotionBlockRenderer blocks={post.blocks} />
                            ) : (
                                <div className="space-y-6">
                                    {(post as any).excerpt && (
                                        <p className="text-lg text-stone-600 leading-relaxed font-medium italic mb-8">
                                            {(post as any).excerpt}
                                        </p>
                                    )}
                                    <p className="text-lg text-stone-600 leading-relaxed">
                                        {(post as any).content || "Cet article n'a pas encore de contenu."}
                                    </p>
                                </div>
                            )}
                        </motion.article>
                    </div>

                    {/* Sidebar / Newsletter / CTA */}
                    <aside className="lg:col-span-4 space-y-8">
                        <div className="bg-stone-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-rose/20 blur-[60px] rounded-full -mr-16 -mt-16 animate-pulse" />
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black mb-4">Envie de goûter ma cuisine ?</h3>
                                <p className="text-white/60 text-sm mb-8 leading-relaxed">
                                    Simulez votre tarif en 2 minutes et recevez un devis personnalisé pour vos prochains repas.
                                </p>
                                <Link
                                    href="/simulateur"
                                    className="block text-center py-4 bg-brand-rose hover:bg-white hover:text-stone-900 transition-all rounded-full font-black uppercase text-xs tracking-widest shadow-xl shadow-brand-rose/20"
                                >
                                    Faire une simulation
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-10 border border-stone-100 shadow-xl">
                            <h3 className="text-lg font-black text-stone-900 mb-6 flex items-center gap-3">
                                <span className="h-1 w-6 bg-brand-rose rounded-full" />
                                Suivez-moi
                            </h3>
                            <div className="space-y-4">
                                <p className="text-stone-500 text-sm leading-relaxed">
                                    Rejoignez-moi sur Instagram pour voir mes recettes quotidiennes et mes astuces de chef.
                                </p>
                                <a
                                    href="https://instagram.com"
                                    target="_blank"
                                    className="flex items-center gap-3 text-stone-900 font-bold hover:text-brand-rose transition-colors"
                                >
                                    @elisabatchcooking
                                    <ArrowLeft className="h-4 w-4 rotate-180" />
                                </a>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}
