import { Client } from "@notionhq/client";

// Initialize Notion Client (we still use the type imports/Client for structure)
const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export interface Author {
    name: string;
    avatar?: string;
}

export interface Post {
    id: string;
    title: string;
    slug: string;
    date: string;
    coverImage: string;
    excerpt: string;
    author: Author;
    readingTime: number;
    blocks?: any[];
}

// Mock data for development fallback
const MOCK_POSTS: Post[] = [
    {
        id: "1",
        title: "Le secret d'un Batch Cooking réussi en 2h",
        slug: "secret-batch-cooking",
        date: "2024-05-20",
        coverImage: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=2071&auto=format&fit=crop",
        excerpt: "Découvrez comment organiser votre cuisine pour préparer tous vos repas de la semaine en un temps record.",
        author: {
            name: "Chef Elisa",
            avatar: "/images/logo.jpg"
        },
        readingTime: 5
    }
];

// Helper for direct API calls since SDK matches were failing at runtime
async function notionFetch(endpoint: string, options: any = {}) {
    if (!process.env.NOTION_API_KEY) {
        throw new Error("NOTION_API_KEY is missing");
    }

    const response = await fetch(`https://api.notion.com/v1/${endpoint}`, {
        ...options,
        headers: {
            "Authorization": `Bearer ${process.env.NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
            ...options.headers,
        },
        next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
        const error = await response.json();
        console.error(`[Notion] API error on ${endpoint}:`, error);
        throw new Error(error.message || `Notion API error: ${response.status}`);
    }

    return response.json();
}

/**
 * Extract author details from page properties, text/select author fields, or Notion users API
 */
async function extractAuthor(page: any): Promise<Author> {
    const props = page.properties || {};

    // 1. Check explicit text, select, or title properties (e.g., "Auteur", "Author", "Writer", "Created By")
    const textAuthorKeys = ["Auteur", "Author", "Writer", "Rédacteur", "Ecrit par", "Author Name", "auteur", "author", "writer", "Created By"];
    for (const key of textAuthorKeys) {
        const prop = props[key];
        if (prop) {
            if (prop.type === 'rich_text' && prop.rich_text?.[0]?.plain_text) {
                return { name: prop.rich_text[0].plain_text.trim(), avatar: "/images/logo.jpg" };
            }
            if (prop.type === 'select' && prop.select?.name) {
                return { name: prop.select.name.trim(), avatar: "/images/logo.jpg" };
            }
            if (prop.type === 'title' && prop.title?.[0]?.plain_text && key !== "Blog post title" && key !== "Title" && key !== "Name") {
                return { name: prop.title[0].plain_text.trim(), avatar: "/images/logo.jpg" };
            }
        }
    }

    // 2. Check people / created_by properties
    let userId: string | null = null;
    const userProp = props["Created by"] || props["Created By"] || Object.values(props).find((p: any) => p.type === 'created_by' || p.type === 'people');

    if (userProp) {
        if (userProp.type === 'created_by' && userProp.created_by) {
            if (userProp.created_by.name) {
                return { name: userProp.created_by.name, avatar: userProp.created_by.avatar_url || "/images/logo.jpg" };
            }
            userId = userProp.created_by.id;
        } else if (userProp.type === 'people' && userProp.people?.[0]) {
            const person = userProp.people[0];
            if (person.name) {
                return { name: person.name, avatar: person.avatar_url || "/images/logo.jpg" };
            }
            userId = person.id;
        }
    }

    if (!userId && page.created_by) {
        if (page.created_by.name) {
            return { name: page.created_by.name, avatar: page.created_by.avatar_url || "/images/logo.jpg" };
        }
        userId = page.created_by.id;
    }

    // 3. If we have a Notion user ID, try fetching user details from Notion API
    if (userId && process.env.NOTION_API_KEY) {
        try {
            const userData = await notionFetch(`users/${userId}`);
            if (userData && userData.name) {
                return {
                    name: userData.name,
                    avatar: userData.avatar_url || "/images/logo.jpg"
                };
            }
        } catch (e) {
            // User API endpoint might be restricted (403), fallback gracefully
        }
    }

    return {
        name: "Chef Elisa",
        avatar: "/images/logo.jpg"
    };
}

/**
 * Calculate reading time in minutes from Notion blocks
 */
export function calculateReadingTime(blocks: any[]): number {
    if (!blocks || blocks.length === 0) return 5;

    let text = "";

    const extractText = (items: any[]) => {
        for (const block of items) {
            const type = block.type;
            if (type && block[type] && block[type].rich_text) {
                const richText = block[type].rich_text;
                for (const t of richText) {
                    if (t.plain_text) text += " " + t.plain_text;
                }
            }
            if (block.children && block.children.length > 0) {
                extractText(block.children);
            }
        }
    };

    extractText(blocks);

    const words = text.trim().split(/\s+/).filter(Boolean).length;
    if (words === 0) return 5;
    const minutes = Math.ceil(words / 200);
    return Math.max(1, minutes);
}

/**
 * Fetch all posts from the Notion database
 */
export async function getPosts(): Promise<Post[]> {
    if (!process.env.NOTION_API_KEY || !DATABASE_ID) {
        return MOCK_POSTS;
    }

    try {
        const response = await notionFetch(`databases/${DATABASE_ID}/query`, {
            method: "POST",
            body: JSON.stringify({
                sorts: [
                    {
                        timestamp: "created_time",
                        direction: "descending",
                    },
                ],
            })
        });

        if (!response.results || response.results.length === 0) {
            return [];
        }

        const posts = await Promise.all(response.results.map(async (page: any) => {
            const props = page.properties;

            // 1. Title finding
            const titleProp = props.Title || props.Name || props.title || props.name || Object.values(props).find((p: any) => p.type === 'title');
            const title = titleProp?.title?.[0]?.plain_text || "Untitled";

            // 2. Slug finding with fallback to generated slug
            const slugProp = props.Slug || props.slug || props.URL || props.url;
            let slug = slugProp?.rich_text?.[0]?.plain_text;
            if (!slug) {
                slug = title.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^\w\s-]/g, '')
                    .replace(/[\s_]+/g, '-')
                    .replace(/^-+|-+$/g, '') || page.id;
            }

            // 3. Date finding
            const dateProp = props.Date || props["Publication Date"] || props.date || Object.values(props).find((p: any) => p.type === 'date');
            const date = dateProp?.date?.start || page.created_time;

            // 4. Excerpt finding
            const excerptProp = props["Short text"] || props["short text"] || props.Excerpt || props.excerpt || props.Summary || props.summary;
            const excerpt = excerptProp?.rich_text?.[0]?.plain_text || "";

            // 5. Author finding
            const author = await extractAuthor(page);

            // 6. Intelligent Cover Image detection
            let coverImage = page.cover?.external?.url || page.cover?.file?.url;

            if (!coverImage) {
                const imgProp = props.Cover || props.Image || props.cover || props.image || Object.values(props).find((p: any) => p.type === 'files');
                coverImage = imgProp?.files?.[0]?.external?.url || imgProp?.files?.[0]?.file?.url;
            }

            let blocks: any[] = [];
            try {
                blocks = await getBlocks(page.id);
            } catch (e) { }

            if (!coverImage) {
                const findFirstImage = (items: any[]): any => {
                    for (const block of items) {
                        if (block.type === 'image') return block;
                        if (block.children && block.children.length > 0) {
                            const found = findFirstImage(block.children);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const firstImage = findFirstImage(blocks);
                if (firstImage) {
                    coverImage = firstImage.image.external?.url || firstImage.image.file?.url;
                }
            }

            const readingTime = calculateReadingTime(blocks);

            return {
                id: page.id,
                title,
                slug,
                date,
                coverImage: coverImage || "/images/hero-bg.jpg",
                excerpt,
                author,
                readingTime,
            };
        }));

        return posts;
    } catch (error: any) {
        console.error("[Notion] Error in getPosts:", error.message || error);
        return MOCK_POSTS;
    }
}

/**
 * Recursively fetch all blocks and their children
 */
async function getBlocks(blockId: string): Promise<any[]> {
    try {
        const response = await notionFetch(`blocks/${blockId}/children?page_size=100`);
        const blocks = response.results;

        // Fetch children recursively for blocks that have them
        const childBlocks = await Promise.all(blocks.map(async (block: any) => {
            if (block.has_children) {
                const children = await getBlocks(block.id);
                return { ...block, children };
            }
            return block;
        }));

        return childBlocks;
    } catch (error: any) {
        console.error(`[Notion] Error fetching blocks for ${blockId}:`, error.message);
        return [];
    }
}

/**
 * Fetch a single post by its slug or ID
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
    if (!process.env.NOTION_API_KEY || !DATABASE_ID) {
        const mock = MOCK_POSTS.find(p => p.slug === slug);
        if (!mock) return null;
        return {
            ...mock,
            blocks: []
        };
    }

    try {
        let page: any = null;

        // Try direct ID first if it looks like one
        if (slug.length > 30 && !slug.includes("-")) {
            try {
                page = await notionFetch(`pages/${slug}`);
            } catch (e) { }
        }

        if (!page) {
            // Query all pages and find matching slug (handles generated slugs)
            const response = await notionFetch(`databases/${DATABASE_ID}/query`, {
                method: "POST"
            });

            page = response.results.find((p: any) => {
                const props = p.properties;
                const titleProp = props.Title || props.Name || props.title || props.name || Object.values(props).find((v: any) => v.type === 'title');
                const title = titleProp?.title?.[0]?.plain_text || "";

                const slugProp = props.Slug || props.slug || props.URL || props.url;
                const explicitSlug = slugProp?.rich_text?.[0]?.plain_text;

                if (explicitSlug === slug) return true;

                const generated = title.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^\w\s-]/g, '')
                    .replace(/[\s_]+/g, '-')
                    .replace(/^-+|-+$/g, '');

                return generated === slug || p.id === slug;
            });
        }

        if (!page) return null;

        const props = page.properties;
        const titleProp = props.Title || props.Name || props.title || props.name || Object.values(props).find((p: any) => p.type === 'title');
        const dateProp = props.Date || props["Publication Date"] || props.date || Object.values(props).find((p: any) => p.type === 'date');
        const excerptProp = props["Short text"] || props["short text"] || props.Excerpt || props.excerpt || props.Summary || props.summary;

        // Fetch blocks recursively
        const blocks = await getBlocks(page.id);
        const author = await extractAuthor(page);

        // Intelligent Cover Image detection
        let coverImage = page.cover?.external?.url || page.cover?.file?.url;

        if (!coverImage) {
            const imgProp = props.Cover || props.Image || props.cover || props.image || Object.values(props).find((p: any) => p.type === 'files');
            coverImage = imgProp?.files?.[0]?.external?.url || imgProp?.files?.[0]?.file?.url;
        }

        if (!coverImage) {
            const findFirstImage = (items: any[]): any => {
                for (const block of items) {
                    if (block.type === 'image') return block;
                    if (block.children && block.children.length > 0) {
                        const found = findFirstImage(block.children);
                        if (found) return found;
                    }
                }
                return null;
            };

            const firstImage = findFirstImage(blocks);
            if (firstImage) {
                coverImage = firstImage.image.external?.url || firstImage.image.file?.url;
            }
        }

        const readingTime = calculateReadingTime(blocks);

        return {
            id: page.id,
            title: titleProp?.title?.[0]?.plain_text || "Untitled",
            slug: slug,
            date: dateProp?.date?.start || page.created_time,
            coverImage: coverImage || "/images/hero-bg.jpg",
            excerpt: excerptProp?.rich_text?.[0]?.plain_text || "",
            author,
            readingTime,
            blocks: blocks,
        };
    } catch (error: any) {
        console.error(`[Notion] Error in getPostBySlug (${slug}):`, error.message || error);
        return null;
    }
}

