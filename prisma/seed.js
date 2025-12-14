const { PrismaClient } = require('@prisma/client');
const fs = require('fs/promises');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    const dataFilePath = path.join(process.cwd(), 'data/posts.json');
    let posts = [];

    try {
        const data = await fs.readFile(dataFilePath, 'utf8');
        posts = JSON.parse(data);
    } catch (e) {
        console.warn("No posts.json found, skipping seed.");
        return;
    }

    console.log(`Seeding ${posts.length} posts...`);

    for (const post of posts) {
        // 1. Upsert Category
        const category = await prisma.category.upsert({
            where: { name: post.category },
            update: {},
            create: {
                name: post.category,
                slug: post.category.toLowerCase().replace(/ /g, '-'),
            },
        });

        // 2. Upsert Author
        const author = await prisma.author.upsert({
            where: { email: `${post.author.replace(/ /g, '.').toLowerCase()}@example.com` }, // Mock email
            update: {},
            create: {
                name: post.author,
                email: `${post.author.replace(/ /g, '.').toLowerCase()}@example.com`,
                bio: "Expert writer at Evergreen.",
                image: null,
            },
        });

        // 3. Upsert Post
        await prisma.post.upsert({
            where: { slug: post.slug },
            update: {
                title: post.title,
                content: post.content,
                image: post.image,
                views: 0,
            },
            create: {
                slug: post.slug,
                title: post.title,
                content: post.content,
                image: post.image,
                date: post.date,
                published: true,
                views: 0,
                authorId: author.id,
                categoryId: category.id,
            },
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
