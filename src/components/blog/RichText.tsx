import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RichTextProps {
    text: any[];
    className?: string;
}

export function RichText({ text, className }: RichTextProps) {
    if (!text) return null;

    return (
        <span className={className}>
            {text.map((value, index) => {
                const {
                    annotations: { bold, code, color, italic, strikethrough, underline },
                    text,
                } = value;

                // Basic styling
                const classes = cn(
                    bold && "font-bold",
                    italic && "italic",
                    strikethrough && "line-through",
                    underline && "underline underline-offset-4 decoration-brand-rose/30",
                    code && "bg-stone-100 text-brand-rose px-1.5 py-0.5 rounded text-sm font-mono font-bold",
                    color === "default" ? "" : `text-${color}-500`
                );

                // Content
                let content = <span className={classes}>{text.content}</span>;

                // Handle Link
                if (text.link) {
                    const href = text.link.url;
                    content = (
                        <Link
                            href={href}
                            target={href.startsWith("http") ? "_blank" : "_self"}
                            className={cn(classes, "text-brand-rose hover:underline decoration-2")}
                        >
                            {text.content}
                        </Link>
                    );
                }

                return <React.Fragment key={index}>{content}</React.Fragment>;
            })}
        </span>
    );
}
