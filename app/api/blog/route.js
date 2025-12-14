import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveArticle } from '@/lib/strapi';
import { processContentImages, downloadImage } from '@/lib/image-processor';
import { revalidatePath } from 'next/cache';

export async function POST(request) {
    console.log('--- API Hit: POST /api/blog ---');

    // 1. Header Authentication
    const apiKey = request.headers.get('api');
    console.log(`Received Key: ${apiKey ? 'Yes (' + apiKey.length + ')' : 'No'} | Expected: ${process.env.BLOG_API_KEY ? 'Yes (' + process.env.BLOG_API_KEY.length + ')' : 'No'}`);

    if (apiKey !== process.env.BLOG_API_KEY) {
        console.warn('Unauthorized Access Attempt');
        return NextResponse.json({ error: 'Unauthorized', message: 'Invalid API Key' }, { status: 401 });
    }

    try {
        // 2. Body Parsing
        let body;
        try {
            body = await request.json();
            console.log('Body parsed successfully');
        } catch (e) {
            console.error('Error parsing request body:', e);
            return NextResponse.json({ error: 'Invalid JSON body', details: e.message }, { status: 400 });
        }

        const { content, author, category, featured_image } = body;

        // 3. Validation
        if (!content) return NextResponse.json({ error: 'Missing required field: content' }, { status: 400 });

        // 4. Call Google Gemini AI
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "You are an expert blog editor and SEO specialist. Your task is to take raw markdown content and format it into a structured JSON object for a modern, premium blog post. \n\nThe output MUST be a valid JSON object with the following fields:\n- title: A catchy, SEO-optimized title (max 60 chars).\n- slug: A URL-friendly slug (kebab-case).\n- excerpt: A compelling, SEO-optimized meta description (150-160 chars) analyzing the full content.\n- featured_image_seo: An object containing { \"alt\": \"...\", \"title\": \"...\" } for the main article image.\n- faq: An array of 3-5 relevant FAQ objects { \"question\": \"...\", \"answer\": \"...\" } derived from the content. \n- content: The full blog post valid HTML. \n\n**CRITICAL DESIGN INSTRUCTIONS**:\n1. **Tables**: You MUST use `<div class=\"table-container\"><table class=\"modern-table\">...</table></div>`.  The table should have a <thead> and <tbody>.\n2. **Comparisons**: If the content compares items (e.g. Pros/Cons, This vs That), use a grid structure: `<div class=\"comparison-grid\"><div class=\"card\"><h3>Item A</h3>...</div><div class=\"card\"><h3>Item B</h3>...</div></div>`.\n3. **Highlights**: For key takeaways or important notes, use `<div class=\"highlight-box\">...</div>`.\n4. **SEO Images**: For any images, you MUST generate both `alt` text (descriptive) AND `title` text (hover tooltip). Example: `<img src=\"...\" alt=\"Detailed description\" title=\"Keyword rich title\">`.\n5. **Style**: Check for readability. Keep paragraphs concise.\n\nDo not include any markdown formatting (like ```json) in the response, just the raw JSON string.",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        let generatedPost;
        try {
            const result = await model.generateContent(content);
            const responseText = result.response.text();
            console.log("Gemini Response:", responseText);
            generatedPost = JSON.parse(responseText);
        } catch (e) {
            console.error("Gemini Error:", e);
            return NextResponse.json({ error: 'Failed to process AI request', details: e.message }, { status: 500 });
        }

        // 5. Merge Data & Process Images
        // Localize images in content
        let processedContent = await processContentImages(generatedPost.content, generatedPost.slug);

        // 5.5 Inject FAQ Schema & HTML
        if (generatedPost.faq && generatedPost.faq.length > 0) {
            // Generate JSON-LD
            const faqSchema = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": generatedPost.faq.map(item => ({
                    "@type": "Question",
                    "name": item.question,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": item.answer
                    }
                }))
            };

            const schemaScript = `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`;

            // Generate Visible HTML
            let faqHtml = `<div class="faq-section mt-8 mb-8 p-6 bg-gray-50 rounded-xl">
                <h3 class="text-2xl font-bold mb-4">Frequently Asked Questions</h3>
                <div class="space-y-4">`;

            generatedPost.faq.forEach(item => {
                faqHtml += `
            <details class="group bg-white rounded-lg border border-gray-200 shadow-sm open:shadow-md transition-all">
                <summary class="flex justify-between items-center cursor-pointer p-4 font-medium text-gray-800 list-none">
                    <span>${item.question}</span>
                    <span class="transition group-open:rotate-180">
                        <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                </summary>
                <div class="text-gray-600 mt-0 px-4 pb-4">
                    ${item.answer}
                </div>
            </details>`;
            });

            faqHtml += `</div></div>`;

            // Append to content
            processedContent += faqHtml + schemaScript;
        }

        // Handle Featured Image
        let finalImage = featured_image || generatedPost.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800';
        if (featured_image) {
            finalImage = await downloadImage(featured_image, generatedPost.slug, 'featured');
        }

        const finalPost = {
            ...generatedPost,
            content: processedContent,
            category: category || generatedPost.category || 'General',
            author: author || generatedPost.author || 'Evergreen Team',
            image: finalImage,
            image_alt: generatedPost.featured_image_seo?.alt || generatedPost.title,
            image_title: generatedPost.featured_image_seo?.title || generatedPost.title,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            slug: (generatedPost.slug || generatedPost.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `post-${Date.now()}`
        };

        // 6. Save to Strapi CMS
        const savedPost = await saveArticle(finalPost);

        revalidatePath('/');
        revalidatePath('/blog');

        return NextResponse.json({ success: true, post: savedPost }, { status: 201 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
