import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

// Site Configuration (for image metadata)
const SITE_NAME = process.env.SITE_NAME || 'Evergreen';

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
    console.log('[Image Processor] R2 client initialized');
} else {
    console.warn('[Image Processor] R2 not configured - will save locally');
}

async function ensureUploadDir() {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
}

/**
 * Fetch with timeout to prevent hanging
 */
async function fetchWithTimeout(url, timeoutMs = 20000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        return response;
    } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            throw new Error(`Timeout after ${timeoutMs}ms`);
        }
        throw error;
    }
}

/**
 * Sleep helper for delays between operations
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Upload buffer to R2 with retries
 */
async function uploadToR2(buffer, filename, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await s3Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME || 'blog-images',
                Key: filename,
                Body: buffer,
                ContentType: 'image/webp',
            }));

            const publicUrl = R2_PUBLIC_DOMAIN
                ? `${R2_PUBLIC_DOMAIN.replace(/\/$/, '')}/${filename}`
                : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${filename}`;

            return publicUrl;
        } catch (error) {
            console.warn(`[R2 Upload] Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
            if (attempt < maxRetries) {
                await sleep(2000 * attempt); // Exponential backoff
            } else {
                throw error;
            }
        }
    }
}

/**
 * Downloads, compresses, and uploads a single image to R2.
 * Returns the new URL or null if failed.
 */
async function processSingleImage(url, slug, index) {
    const imageId = `${slug}-${index}`;

    console.log(`\n[Image ${index}] ========================================`);
    console.log(`[Image ${index}] Processing: ${url.substring(0, 80)}...`);

    try {
        // 1. FETCH IMAGE
        console.log(`[Image ${index}] Step 1: Fetching...`);
        let buffer;

        const isLocalPath = /^[a-zA-Z]:[\\\/]/.test(url) || url.startsWith('/');

        if (isLocalPath) {
            try {
                const cleanPath = url.replace(/['"]/g, '');
                buffer = await fs.readFile(cleanPath);
                console.log(`[Image ${index}] Loaded local file: ${(buffer.length / 1024).toFixed(1)}KB`);
            } catch (e) {
                console.error(`[Image ${index}] ❌ Local file not found`);
                return null;
            }
        } else {
            // HTTP fetch with timeout
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const response = await fetchWithTimeout(url, 20000);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    buffer = Buffer.from(await response.arrayBuffer());
                    console.log(`[Image ${index}] Downloaded: ${(buffer.length / 1024).toFixed(1)}KB`);
                    break;
                } catch (fetchError) {
                    console.warn(`[Image ${index}] Fetch attempt ${attempt}/3 failed: ${fetchError.message}`);
                    if (attempt === 3) {
                        console.error(`[Image ${index}] ❌ All fetch attempts failed`);
                        return null;
                    }
                    await sleep(1000 * attempt);
                }
            }
        }

        if (!buffer || buffer.length < 100) {
            console.error(`[Image ${index}] ❌ Invalid or empty buffer`);
            return null;
        }

        // 2. COMPRESS IMAGE
        console.log(`[Image ${index}] Step 2: Compressing...`);
        const currentYear = new Date().getFullYear();

        let processedBuffer;
        try {
            processedBuffer = await sharp(buffer)
                .withMetadata({
                    exif: {
                        IFD0: {
                            Copyright: `© ${currentYear} ${SITE_NAME}`,
                            Artist: `${SITE_NAME}`,
                            ImageDescription: `Image for ${slug.replace(/-/g, ' ')}`
                        }
                    }
                })
                .resize({ width: 1200, withoutEnlargement: true })
                .webp({ quality: 75 })
                .toBuffer();

            console.log(`[Image ${index}] Compressed: ${(buffer.length / 1024).toFixed(1)}KB → ${(processedBuffer.length / 1024).toFixed(1)}KB`);
        } catch (sharpError) {
            console.error(`[Image ${index}] ❌ Compression failed: ${sharpError.message}`);
            return null;
        }

        // 3. UPLOAD TO R2
        if (hasR2Credentials && s3Client) {
            console.log(`[Image ${index}] Step 3: Uploading to R2...`);

            // Generate unique filename
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            const safeSlug = slug.substring(0, 40).replace(/[^a-z0-9-]/g, '');
            const filename = `${safeSlug}-${timestamp}-${index}-${random}.webp`;

            try {
                const publicUrl = await uploadToR2(processedBuffer, filename);
                console.log(`[Image ${index}] ✅ SUCCESS: ${publicUrl}`);
                return publicUrl;
            } catch (uploadError) {
                console.error(`[Image ${index}] ❌ R2 upload failed: ${uploadError.message}`);
                // Fall through to local save
            }
        }

        // 4. FALLBACK: Save locally
        console.log(`[Image ${index}] Step 3: Saving locally (R2 unavailable)...`);
        await ensureUploadDir();

        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const safeSlug = slug.substring(0, 40).replace(/[^a-z0-9-]/g, '');
        const filename = `${safeSlug}-${timestamp}-${index}-${random}.webp`;
        const filePath = path.join(UPLOAD_DIR, filename);

        await fs.writeFile(filePath, processedBuffer);
        console.log(`[Image ${index}] ⚠️ Saved locally: /uploads/${filename}`);
        return `/uploads/${filename}`;

    } catch (error) {
        console.error(`[Image ${index}] ❌ EXCEPTION: ${error.message}`);
        return null;
    }
}

/**
 * Downloads and uploads featured image
 */
export async function downloadImage(url, slug, suffix = 'featured') {
    if (!url) return url;

    // Skip data URLs and already-processed R2 URLs
    if (url.startsWith('data:')) return url;
    if (R2_PUBLIC_DOMAIN && url.includes(R2_PUBLIC_DOMAIN)) return url;
    if (url.includes('r2.cloudflarestorage.com')) return url;
    if (url.includes('r2.dev')) return url;

    const result = await processSingleImage(url, slug, suffix);
    return result || url; // Return original URL if processing failed
}

/**
 * Process all images in HTML content SEQUENTIALLY for reliability
 */
export async function processContentImages(htmlContent, slug) {
    if (!htmlContent) return htmlContent;

    // Find all img src URLs
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const matches = [...htmlContent.matchAll(imgRegex)];

    // Deduplicate URLs
    const uniqueUrls = [...new Set(matches.map(m => m[1]))];

    // Filter out already-processed URLs
    const urlsToProcess = uniqueUrls.filter(url => {
        if (R2_PUBLIC_DOMAIN && url.includes(R2_PUBLIC_DOMAIN)) return false;
        if (url.includes('r2.cloudflarestorage.com')) return false;
        if (url.includes('r2.dev')) return false;
        if (url.startsWith('data:')) return false;
        return true;
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Image Processor] Starting for slug: ${slug}`);
    console.log(`[Image Processor] Total images: ${uniqueUrls.length}, To process: ${urlsToProcess.length}`);
    console.log(`${'='.repeat(60)}`);

    if (urlsToProcess.length === 0) {
        console.log('[Image Processor] No images to process');
        return htmlContent;
    }

    // Process images SEQUENTIALLY (one at a time, no race conditions)
    const replacements = new Map();
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < urlsToProcess.length; i++) {
        const originalUrl = urlsToProcess[i];
        console.log(`\n[Progress] Image ${i + 1}/${urlsToProcess.length}`);

        const newUrl = await processSingleImage(originalUrl, slug, i);

        if (newUrl && newUrl !== originalUrl) {
            replacements.set(originalUrl, newUrl);
            successCount++;
        } else {
            failCount++;
            console.warn(`[Image ${i}] ⚠️ Keeping original URL`);
        }

        // Small delay between images to avoid rate limiting
        if (i < urlsToProcess.length - 1) {
            await sleep(500);
        }
    }

    // Apply all replacements
    let processedHtml = htmlContent;
    for (const [original, replacement] of replacements) {
        // Replace all occurrences of this URL
        processedHtml = processedHtml.split(original).join(replacement);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Image Processor] COMPLETE`);
    console.log(`[Image Processor] ✅ Success: ${successCount}/${urlsToProcess.length}`);
    if (failCount > 0) {
        console.log(`[Image Processor] ❌ Failed: ${failCount}/${urlsToProcess.length}`);
    }
    console.log(`${'='.repeat(60)}\n`);

    return processedHtml;
}
