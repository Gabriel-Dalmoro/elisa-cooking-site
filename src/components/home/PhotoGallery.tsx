"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const GALLERY_IMAGES = [
    { src: "/images/gallery/img1.jpeg", alt: "Plats gourmands", width: 1274, height: 1600 },
    { src: "/images/gallery/img2.jpeg", alt: "Ingrédients frais", width: 1200, height: 1600 },
    { src: "/images/gallery/img3.jpeg", alt: "Cuisine saine", width: 1200, height: 1600 },
    { src: "/images/gallery/img4.jpeg", alt: "Préparations maison", width: 1200, height: 1600 },
    { src: "/images/gallery/img5.jpeg", alt: "Batch cooking", width: 1600, height: 1200 },
    { src: "/images/gallery/img6.jpeg", alt: "Organisation de la semaine", width: 1200, height: 1600 },
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

                <div className="columns-2 md:columns-3 gap-4">
                    {GALLERY_IMAGES.map((image, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="relative overflow-hidden rounded-3xl group break-inside-avoid mb-4"
                        >
                            <Image
                                src={image.src}
                                alt={image.alt}
                                width={image.width}
                                height={image.height}
                                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
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
