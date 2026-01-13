"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const GALLERY_IMAGES = [
    { src: "/images/gallery-1.png", alt: "Gourmet Dessert", span: "md:col-span-1 md:row-span-1" },
    { src: "/images/gallery-2.png", alt: "Fresh Salad", span: "md:col-span-2 md:row-span-2" },
    { src: "/images/gallery-3.png", alt: "Homemade Pasta", span: "md:col-span-1 md:row-span-1" },
    { src: "/images/gallery-4.png", alt: "Artisan Breads", span: "md:col-span-1 md:row-span-1" },
    { src: "/images/gallery-5.png", alt: "Grilled Salmon", span: "md:col-span-1 md:row-span-2" },
    { src: "/images/gallery-6.png", alt: "Colorful Macarons", span: "md:col-span-2 md:row-span-1" },
    { src: "/images/gallery-8.png", alt: "Rustic Fruit Tart", span: "md:col-span-1 md:row-span-1" },
];

export function PhotoGallery() {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center"
                >
                    <h2 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
                        En images
                    </h2>
                    <div className="mt-4 mx-auto h-1.5 w-24 bg-brand-gold rounded-full" />
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] gap-4">
                    {GALLERY_IMAGES.map((image, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative overflow-hidden rounded-3xl group ${image.span}`}
                        >
                            <Image
                                src={image.src}
                                alt={image.alt}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                <span className="text-white font-medium text-sm tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                    {image.alt}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
