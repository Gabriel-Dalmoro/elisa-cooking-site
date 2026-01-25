import { Client } from "@notionhq/client";

// Initialize Notion Client (we still use the type imports/Client for structure)
const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export interface Post {
    id: string;
    title: string;
    slug: string;
    date: string;
    coverImage: string;
    excerpt: string;
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
        excerpt: "Découvrez comment organiser votre cuisine pour préparer tous vos repas de la semaine en un temps record."
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

            // 5. Intelligent Cover Image detection
            let coverImage = page.cover?.external?.url || page.cover?.file?.url;

            if (!coverImage) {
                const imgProp = props.Cover || props.Image || props.cover || props.image || Object.values(props).find((p: any) => p.type === 'files');
                coverImage = imgProp?.files?.[0]?.external?.url || imgProp?.files?.[0]?.file?.url;
            }

            if (!coverImage) {
                try {
                    const blocks = await notionFetch(`blocks/${page.id}/children?page_size=20`);
                    const firstImage = blocks.results.find((b: any) => b.type === 'image');
                    if (firstImage) {
                        coverImage = firstImage.image.external?.url || firstImage.image.file?.url;
                    }
                } catch (e) { }
            }

            return {
                id: page.id,
                title,
                slug,
                date,
                coverImage: coverImage || "/images/hero-bg.jpg",
                excerpt,
            };
        }));

        return posts;
    } catch (error: any) {
        console.error("[Notion] Error in getPosts:", error.message || error);
        return MOCK_POSTS;
    }
}

/**
 * Fetch a single post by its slug or ID
 */
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
                // Recursion
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
export async function getPostBySlug(slug: string) {
    if (!process.env.NOTION_API_KEY || !DATABASE_ID) {
        const mock = MOCK_POSTS.find(p => p.slug === slug);
        if (!mock) return null;
        return {
            ...mock,
            content: `Contenu de démo.`,
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

        // Fetch blocks recursively
        const blocks = await getBlocks(page.id);

        // Intelligent Cover Image detection
        let coverImage = page.cover?.external?.url || page.cover?.file?.url;

        if (!coverImage) {
            const imgProp = props.Cover || props.Image || props.cover || props.image || Object.values(props).find((p: any) => p.type === 'files');
            coverImage = imgProp?.files?.[0]?.external?.url || imgProp?.files?.[0]?.file?.url;
        }

        if (!coverImage) {
            // Helper to find first image recursively
            const findFirstImage = (blocks: any[]): any => {
                for (const block of blocks) {
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

        return {
            id: page.id,
            title: titleProp?.title?.[0]?.plain_text || "Untitled",
            date: dateProp?.date?.start || page.created_time,
            coverImage: coverImage || "/images/hero-bg.jpg",
            blocks: blocks,
        };
    } catch (error: any) {
        console.error(`[Notion] Error in getPostBySlug (${slug}):`, error.message || error);
        return null;
    }
}
