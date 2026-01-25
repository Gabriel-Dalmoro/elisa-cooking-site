import React, { Fragment } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { RichText } from "./RichText";
import { Quote, CheckCircle, Info, AlertTriangle } from "lucide-react";

interface BlockRendererProps {
    block: any;
}

export function BlockRenderer({ block }: BlockRendererProps) {
    const { type, id } = block;
    const value = block[type];

    // recursion for children (nested blocks / indentation)
    const children = block.has_children && block.children ? (
        <div className="pl-6 md:pl-8 mt-2 border-l-2 border-stone-100/50">
            {block.children.map((child: any) => (
                <BlockRenderer key={child.id} block={child} />
            ))}
        </div>
    ) : null;

    switch (type) {
        case "paragraph":
            return (
                <div className="mb-6">
                    <p className="text-lg text-stone-600 leading-relaxed text-pretty">
                        <RichText text={value.rich_text} />
                    </p>
                    {children}
                </div>
            );

        case "heading_1":
            return (
                <div className="mt-16 mb-8 first:mt-0">
                    <h1 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight leading-tight">
                        <RichText text={value.rich_text} />
                    </h1>
                    {children}
                </div>
            );

        case "heading_2":
            return (
                <div className="mt-12 mb-6">
                    <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-3">
                        <span className="h-8 w-1.5 bg-brand-rose rounded-full" />
                        <RichText text={value.rich_text} />
                    </h2>
                    {children}
                </div>
            );

        case "heading_3":
            return (
                <div className="mt-8 mb-4">
                    <h3 className="text-xl font-black text-stone-800 tracking-tight">
                        <RichText text={value.rich_text} />
                    </h3>
                    {children}
                </div>
            );

        case "bulleted_list_item":
        case "numbered_list_item":
            return (
                <div className="mb-3 ml-2 flex gap-3">
                    <span className="text-brand-rose font-bold mt-1.5">•</span>
                    <div className="flex-1">
                        <p className="text-lg text-stone-600 leading-relaxed">
                            <RichText text={value.rich_text} />
                        </p>
                        {children}
                    </div>
                </div>
            );

        case "quote":
            return (
                <blockquote className="my-10 pl-8 border-l-4 border-brand-rose bg-brand-rose/5 py-6 pr-6 rounded-r-2xl italic">
                    <Quote className="h-8 w-8 text-brand-rose/20 mb-2 -ml-2" />
                    <p className="text-xl font-serif text-stone-700 leading-relaxed">
                        <RichText text={value.rich_text} />
                    </p>
                    {children}
                </blockquote>
            );

        case "callout":
            const icons: Record<string, any> = {
                "ℹ️": Info,
                "⚠️": AlertTriangle,
                "✅": CheckCircle,
            };
            const Icon = value.icon?.emoji ? icons[value.icon.emoji] || Info : Info;

            return (
                <div className="my-8 flex gap-4 bg-stone-100 p-6 rounded-2xl border border-stone-200">
                    <div className="text-2xl">{value.icon?.emoji || "💡"}</div>
                    <div className="flex-1">
                        <div className="text-lg text-stone-700 font-medium">
                            <RichText text={value.rich_text} />
                        </div>
                        {children}
                    </div>
                </div>
            );

        case "image":
            const src = value.type === "external" ? value.external.url : value.file.url;
            const caption = value.caption?.[0]?.plain_text;
            return (
                <figure className="my-12 rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-black/5 bg-stone-50">
                    <div className="relative aspect-video">
                        <Image
                            src={src}
                            alt={caption || "Blog post image"}
                            fill
                            className="object-cover"
                        />
                    </div>
                    {caption && (
                        <figcaption className="p-4 text-center text-sm font-medium text-stone-500 bg-stone-50 border-t border-stone-100 italic">
                            {caption}
                        </figcaption>
                    )}
                </figure>
            );

        case "divider":
            return <hr className="my-12 border-stone-200" />;

        default:
            return (
                <div className="text-stone-400 text-sm hidden">
                    Unsupported block type: {type}
                </div>
            );
    }
}
