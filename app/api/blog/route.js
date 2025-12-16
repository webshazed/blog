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

        const { content, author, category, featured_image, slug } = body;

        // 3. Validation
        if (!content) return NextResponse.json({ error: 'Missing required field: content' }, { status: 400 });
        if (!slug) return NextResponse.json({ error: 'Missing required field: slug' }, { status: 400 });

        // Generate slug early - needed for image filenames
        const finalSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        console.log(`Using slug: ${finalSlug}`);

        // 4. PROCESS IMAGES FIRST (before AI)
        // This uploads all local images to R2 and replaces paths with R2 URLs
        console.log('--- Step 4: Processing images BEFORE AI ---');
        let contentWithR2Images = await processContentImages(content, finalSlug);
        console.log('Images processed, R2 URLs inserted');

        // 5. Call Google Gemini AI with R2-linked content
        console.log('--- Step 5: Sending to Gemini AI ---');
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are an expert blog editor and SEO specialist. Your task is to take raw markdown content and format it into a structured JSON object for a modern, premium blog post.

The output MUST be a valid JSON object with the following fields:
- title: A catchy, SEO-optimized title (max 60 chars).
- excerpt: A compelling, SEO-optimized meta description (150-160 chars).
- schemaType: Detect content type: 'Article', 'TechArticle', 'NewsArticle', 'HowTo', or 'Review'.
- entities: Array of { "name": "...", "url": "..." } for known entities (Wikipedia/Wikidata).
- speakableSummary: A concise 2-3 sentence summary suitable for voice assistants (Alexa/Siri).
- featured_image_seo: { "alt": "...", "title": "..." }
- faq: Array of relevant FAQ objects { "question": "...", "answer": "..." }.
- content: The full blog post valid HTML.

**CRITICAL IMAGE RULES**:
1. PRESERVE all image URLs EXACTLY as they appear in the input. The images have already been processed and have valid URLs.
2. Do NOT modify, rename, or generate new image paths.
3. Keep all src attributes exactly as provided.
4. Add alt and title attributes based on context, but keep src unchanged.

**HEADING STRUCTURE RULES (CRITICAL FOR SEO)**:
1. DO NOT include H1 in the content - it will be added separately from the title field.
2. Start the content with H2 for the first main section.
3. Use H2 for ALL main sections (aim for 4-8 H2 sections per article).
4. Use H3 ONLY as sub-sections within their parent H2 - never standalone.
5. FAQs MUST be their own H2 section called "Frequently Asked Questions", NOT nested under "Conclusion" or "Final Thoughts".
6. Include target keyword naturally in at least 2-3 H2 headings.
7. Avoid generic headings like "Introduction" or "Conclusion" - make them descriptive.
8. Never skip heading levels (no H2 → H4 directly).

**DESIGN INSTRUCTIONS**:
1. **Semantic HTML**: Use \`<figure>\`, \`<figcaption>\`, \`<aside>\`, \`<time>\` tags where appropriate.
2. **Tables**: \`<div class="table-container"><table class="modern-table">...</table></div>\`.
3. **Comparisons**: Grid structure \`<div class="comparison-grid">...</div>\`.
4. **Style**: Concise paragraphs, modern formatting.

Return ONLY the raw JSON string.`,
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        let generatedPost;
        try {
            const result = await model.generateContent(contentWithR2Images);
            const responseText = result.response.text();
            console.log("Gemini Response received");
            generatedPost = JSON.parse(responseText);
        } catch (e) {
            console.error("Gemini Error:", e);
            return NextResponse.json({ error: 'Failed to process AI request', details: e.message }, { status: 500 });
        }

        // 6. The content from AI should already have R2 URLs
        let finalContent = generatedPost.content;

        // Base Schema (Article)
        let primarySchema = {
            "@context": "https://schema.org",
            "@type": generatedPost.schemaType || "Article", // Smart Schema #1
            "headline": generatedPost.title,
            "image": generatedPost.image ? [generatedPost.image] : [],
            "datePublished": new Date().toISOString(),
            "dateModified": new Date().toISOString(),
            "author": [{
                "@type": "Person",
                "name": generatedPost.author || "Evergreen Team"
            }],
            "publisher": {
                "@type": "Organization",
                "name": "Evergreen Blog",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://blog1-roan.vercel.app/logo.png"
                }
            },
            "description": generatedPost.excerpt
        };

        // Entity Linking #2
        if (generatedPost.entities && generatedPost.entities.length > 0) {
            primarySchema.about = generatedPost.entities.map(entity => ({
                "@type": "Thing",
                "name": entity.name,
                "sameAs": entity.url
            }));
        }

        // Speakable Schema #3
        if (generatedPost.speakableSummary) {
            primarySchema.speakable = {
                "@type": "SpeakableSpecification",
                "cssSelector": ["#speakable-summary"] // We will wrap this below
            };
            // Inject speakable summary into content (hidden visually or styled)
            finalContent = `<div id="speakable-summary" style="display:none;" aria-hidden="true">${generatedPost.speakableSummary}</div>` + finalContent;
        }

        // FAQ Schema (if exists)
        let schemaList = [primarySchema];
        if (generatedPost.faq && generatedPost.faq.length > 0) {
            // Generate JSON-LD (always add schema for SEO)
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
            schemaList.push(faqSchema);

            // Only inject visible FAQ HTML if not already in content
            const contentHasFaq = finalContent.toLowerCase().includes('frequently asked questions') ||
                finalContent.includes('faq-section') ||
                finalContent.includes('class="faq"');

            if (!contentHasFaq) {
                let faqHtml = `<section class="faq-section">
                    <h2 class="faq-title">❓ Frequently Asked Questions</h2>
                    <div class="faq-list">`;

                generatedPost.faq.forEach((item, index) => {
                    faqHtml += `
                    <details class="faq-item" ${index === 0 ? 'open' : ''}>
                        <summary class="faq-question">
                            <span class="faq-question-text">${item.question}</span>
                            <span class="faq-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </span>
                        </summary>
                        <div class="faq-answer">
                            <p>${item.answer}</p>
                        </div>
                    </details>`;
                });

                faqHtml += `</div></section>`;
                finalContent += faqHtml;
            }
        }

        // Inject All Schemas
        const schemaScript = `<script type="application/ld+json">${JSON.stringify(schemaList)}</script>`;
        finalContent += schemaScript;

        // Handle Featured Image
        let finalImage = featured_image || generatedPost.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800';
        if (featured_image) {
            finalImage = await downloadImage(featured_image, finalSlug, 'featured');
        }

        const finalPost = {
            ...generatedPost,
            content: finalContent,
            category: category || generatedPost.category || 'General',
            author: author || generatedPost.author || 'Evergreen Team',
            image: finalImage,
            image_alt: generatedPost.featured_image_seo?.alt || generatedPost.title,
            image_title: generatedPost.featured_image_seo?.title || generatedPost.title,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            slug: finalSlug || `post-${Date.now()}`
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
