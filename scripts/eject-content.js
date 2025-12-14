const { PrismaClient } = require('@prisma/client');
const fs = require('fs/promises');
const path = require('path');

const prisma = new PrismaClient();
const CONTENT_DIR = path.join(process.cwd(), 'data/content');

async function ejectContent() {
    try {
        await fs.mkdir(CONTENT_DIR, { recursive: true });

        const posts = await prisma.post.findMany();
        console.log(`Found ${posts.length} posts. Ejecting content...`);

        for (const post of posts) {
            if (post.content && post.slug) {
                const filePath = path.join(CONTENT_DIR, `${post.slug}.html`);
                await fs.writeFile(filePath, post.content);
                console.log(`Saved: ${post.slug}.html`);
            }
        }
        console.log("Ejection complete.");
    } catch (e) {
        console.error("Error ejecting content:", e);
    } finally {
        await prisma.$disconnect();
    }
}

ejectContent();
