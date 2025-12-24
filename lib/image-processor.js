import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Site Configuration
const SITE_NAME = process.env.SITE_NAME || 'Kitchen Algo';

// Initialize S3 Client for Cloudflare R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;

// Check if R2 is properly configured
const hasR2Credentials = R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY &&
    !R2_ACCESS_KEY_ID.includes('placeholder');

let s3Client = null;
if (hasR2Credentials) {
    s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    });
    console.log('[ImageProcessor] ✅ R2 Client Ready');
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Read image from local file (Windows path or relative path)
 */
async function readLocalImage(imagePath) {
    // Clean the path (remove quotes if any)
    let cleanPath = imagePath.replace(/['"]/g, '').trim();

    console.log(`[ReadLocal] Trying: ${cleanPath}`);

    // Check if file exists at the exact path
    if (await fileExists(cleanPath)) {
        try {
            const buffer = await fs.readFile(cleanPath);
            console.log(`[ReadLocal] ✅ Read ${(buffer.length / 1024).toFixed(1)}KB from: ${cleanPath}`);
            return buffer;
        } catch (e) {
            console.error(`[ReadLocal] ❌ Failed to read: ${e.message}`);
        }
    }

    // Try public folder variations
    const publicDir = path.join(process.cwd(), 'public');
    const variations = [
        cleanPath,
        path.join(publicDir, cleanPath),
        path.join(publicDir, cleanPath.replace(/^\//, '')),
        path.join(process.cwd(), cleanPath),
    ];

    for (const tryPath of variations) {
        if (await fileExists(tryPath)) {
            try {
                const buffer = await fs.readFile(tryPath);
                console.log(`[ReadLocal] ✅ Read ${(buffer.length / 1024).toFixed(1)}KB from: ${tryPath}`);
                return buffer;
            } catch (e) {
                console.error(`[ReadLocal] ❌ Failed: ${e.message}`);
            }
        }
    }

    console.error(`[ReadLocal] ❌ File not found: ${cleanPath}`);
    return null;
}

/**
 * Fetch image from HTTP URL
 */
async function fetchHttpImage(url, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[FetchHTTP] Attempt ${attempt}/${maxRetries}: ${url.substring(0, 60)}...`);

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            clearTimeout(timeout);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const buffer = Buffer.from(await response.arrayBuffer());
            console.log(`[FetchHTTP] ✅ Downloaded ${(buffer.length / 1024).toFixed(1)}KB`);
            return buffer;

        } catch (error) {
            console.warn(`[FetchHTTP] ❌ Attempt ${attempt} failed: ${error.message}`);
            if (attempt < maxRetries) await sleep(2000 * attempt);
        }
    }
    return null;
}

/**
 * Compress image to WebP
 */
async function compressToWebp(buffer, slug, index) {
    try {
        const currentYear = new Date().getFullYear();

        const webp = await sharp(buffer)
            .withMetadata({
                exif: {
                    IFD0: {
                        Copyright: `© ${currentYear} ${SITE_NAME}`,
                        Artist: SITE_NAME
                    }
                }
            })
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer();

        console.log(`[Compress] ${(buffer.length / 1024).toFixed(1)}KB → ${(webp.length / 1024).toFixed(1)}KB (WebP)`);
        return webp;

    } catch (error) {
        console.error(`[Compress] ❌ Failed: ${error.message}`);
        return null;
    }
}

/**
 * Upload to Cloudflare R2
 */
async function uploadToR2(buffer, filename, maxRetries = 3) {
    if (!hasR2Credentials || !s3Client) {
        console.warn('[UploadR2] ⚠️ R2 not configured');
        return null;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[UploadR2] Attempt ${attempt}/${maxRetries}: ${filename}`);

            await s3Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: filename,
                Body: buffer,
                ContentType: 'image/webp',
            }));

            const publicUrl = R2_PUBLIC_DOMAIN
                ? `${R2_PUBLIC_DOMAIN.replace(/\/$/, '')}/${filename}`
                : `https://kitchenalgo.com/${filename}`;

            console.log(`[UploadR2] ✅ Success: ${publicUrl}`);
            return publicUrl;

        } catch (error) {
            console.warn(`[UploadR2] ❌ Attempt ${attempt} failed: ${error.message}`);
            if (attempt < maxRetries) await sleep(2000 * attempt);
        }
    }
    return null;
}

/**
 * Process single image: Read → Compress → Upload → Return R2 URL
 */
async function processSingleImage(originalPath, slug, index) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`[Image ${index}] START: ${originalPath}`);
    console.log(`${'─'.repeat(60)}`);

    let buffer = null;

    // Determine source type and get buffer
    if (originalPath.startsWith('http://') || originalPath.startsWith('https://')) {
        buffer = await fetchHttpImage(originalPath);
    } else {
        // Local file (Windows path or relative)
        buffer = await readLocalImage(originalPath);
    }

    if (!buffer) {
        console.error(`[Image ${index}] ❌ FAILED: Could not read image`);
        return null;
    }

    // Compress to WebP
    const webpBuffer = await compressToWebp(buffer, slug, index);
    if (!webpBuffer) {
        console.error(`[Image ${index}] ❌ FAILED: Compression error`);
        return null;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    const safeSlug = slug.substring(0, 30).replace(/[^a-z0-9-]/gi, '-');
    const filename = `${safeSlug}-${timestamp}-${index}-${random}.webp`;

    // Upload to R2
    const r2Url = await uploadToR2(webpBuffer, filename);

    if (r2Url) {
        console.log(`[Image ${index}] ✅ COMPLETE: ${r2Url}`);
        return r2Url;
    }

    console.error(`[Image ${index}] ❌ FAILED: R2 upload failed`);
    return null;
}

/**
 * Check if URL/path should be processed
 */
function shouldProcess(urlOrPath) {
    if (!urlOrPath) return false;
    if (urlOrPath.startsWith('data:')) return false;
    if (R2_PUBLIC_DOMAIN && urlOrPath.includes(R2_PUBLIC_DOMAIN)) return false;
    if (urlOrPath.includes('r2.cloudflarestorage.com')) return false;
    if (urlOrPath.includes('.r2.dev')) return false;
    if (urlOrPath.includes('kitchenalgo.com')) return false;
    return true;
}

/**
 * Extract all image paths from HTML/Markdown content
 */
function extractImagePaths(content) {
    const images = [];

    // Match: ![...](path) - Markdown
    const mdRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
    let match;
    while ((match = mdRegex.exec(content)) !== null) {
        images.push(match[1].trim());
    }

    // Match: <img src="path"> - HTML
    const htmlRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    while ((match = htmlRegex.exec(content)) !== null) {
        images.push(match[1].trim());
    }

    // Deduplicate
    return [...new Set(images)];
}

/**
 * Process featured image
 */
export async function downloadImage(url, slug, suffix = 'featured') {
    if (!url || !shouldProcess(url)) {
        return url || '';
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`[FEATURED IMAGE] Processing: ${url}`);
    console.log(`${'═'.repeat(60)}`);

    const result = await processSingleImage(url, slug, suffix);
    return result || url;
}

/**
 * Process ALL images in article content
 * This is the main function that handles body images
 */
export async function processContentImages(content, slug) {
    if (!content) return content;

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`[CONTENT IMAGES] Starting for article: ${slug}`);
    console.log(`${'═'.repeat(60)}`);

    // Extract all image paths
    const allImages = extractImagePaths(content);
    console.log(`[CONTENT IMAGES] Found ${allImages.length} images in content`);

    if (allImages.length === 0) {
        console.log('[CONTENT IMAGES] No images to process');
        return content;
    }

    // Filter to processable images
    const toProcess = allImages.filter(shouldProcess);
    console.log(`[CONTENT IMAGES] Processing ${toProcess.length} images:`);
    toProcess.forEach((img, i) => console.log(`  [${i}] ${img}`));

    if (toProcess.length === 0) {
        console.log('[CONTENT IMAGES] No new images to process');
        return content;
    }

    // Process each image SEQUENTIALLY (one at a time)
    const replacements = new Map();

    for (let i = 0; i < toProcess.length; i++) {
        const originalPath = toProcess[i];

        console.log(`\n[PROGRESS] Image ${i + 1} of ${toProcess.length}`);

        const r2Url = await processSingleImage(originalPath, slug, i);

        if (r2Url) {
            replacements.set(originalPath, r2Url);
            console.log(`[REPLACEMENT] ✅ ${originalPath.substring(0, 40)}... → ${r2Url}`);
        } else {
            console.warn(`[REPLACEMENT] ❌ Failed for: ${originalPath}`);
        }

        // Delay between uploads to avoid rate limiting
        if (i < toProcess.length - 1) {
            await sleep(1000);
        }
    }

    // Apply all replacements to content
    let processedContent = content;

    console.log(`\n[CONTENT IMAGES] Applying ${replacements.size} replacements...`);

    for (const [original, replacement] of replacements) {
        // Escape special regex characters in the original path
        const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'g');
        const matches = (processedContent.match(regex) || []).length;

        processedContent = processedContent.replace(regex, replacement);
        console.log(`  Replaced ${matches} occurrence(s): ...${original.substring(original.length - 30)}`);
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`[CONTENT IMAGES] ✅ COMPLETE: ${replacements.size}/${toProcess.length} images uploaded to R2`);
    console.log(`${'═'.repeat(60)}\n`);

    return processedContent;
}
