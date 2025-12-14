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
async function fetchWithTimeout(url, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        return response;
    } catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}

/**
 * Retry wrapper for async operations
 */
async function withRetry(fn, maxRetries = 3, delayMs = 1000) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.warn(`[Retry] Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
            }
        }
    }
    throw lastError;
}

/**
 * Downloads, compresses, and uploads an image to Cloudflare R2.
 * Falls back to local storage if R2 fails or credentials missing.
 */
export async function downloadImage(url, slug, suffix = '') {
    if (!url) return url;

    // Skip data URLs and already-processed R2 URLs
    if (url.startsWith('data:')) return url;
    if (R2_PUBLIC_DOMAIN && url.includes(R2_PUBLIC_DOMAIN)) return url;
    if (url.includes('r2.cloudflarestorage.com')) return url;
    if (url.includes('r2.dev')) return url;

    // Check if it's a local absolute path or HTTP
    const isLocalPath = /^[a-zA-Z]:\\/.test(url) || /^[a-zA-Z]:\//.test(url) || url.startsWith('/');
    const isHttp = url.startsWith('http');

    if (!isLocalPath && !isHttp) return url;

    const imageId = `${slug}-${suffix}`;
    console.log(`[Image ${imageId}] Processing: ${url.substring(0, 60)}...`);

    try {
        let buffer;

        // 1. Fetch Image Buffer
        if (isLocalPath) {
            console.log(`[Image ${imageId}] Reading local file`);
            try {
                const cleanPath = url.replace(/['\"]/g, '');
                await fs.access(cleanPath);
                buffer = await fs.readFile(cleanPath);
            } catch (e) {
                console.error(`[Image ${imageId}] Local file not found: ${url}`);
                return url;
            }
        } else {
            // HTTP fetch with retry and timeout
            const response = await withRetry(async () => {
                console.log(`[Image ${imageId}] Fetching from URL...`);
                const res = await fetchWithTimeout(url, 15000);
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res;
            }, 3, 1000);

            buffer = Buffer.from(await response.arrayBuffer());
            console.log(`[Image ${imageId}] Downloaded ${(buffer.length / 1024).toFixed(1)}KB`);
        }

        // 2. Compress & Convert to WebP using Sharp
        const currentYear = new Date().getFullYear();
        console.log(`[Image ${imageId}] Compressing...`);

        let processedBuffer = await sharp(buffer)
            .withMetadata({
                exif: {
                    IFD0: {
                        Copyright: `© ${currentYear} ${SITE_NAME}`,
                        Artist: `${SITE_NAME} Content Engine`,
                        ImageDescription: `Illustration for ${slug.replace(/-/g, ' ')}`
                    }
                }
            })
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer();

        console.log(`[Image ${imageId}] Compressed to ${(processedBuffer.length / 1024).toFixed(1)}KB`);

        // 3. Upload to R2 with retry
        if (hasR2Credentials && s3Client) {
            const uploadResult = await withRetry(async () => {
                const uniqueSuffix = suffix || Math.floor(Math.random() * 1000);
                const filename = `${slug.substring(0, 50)}-${Date.now()}-${uniqueSuffix}.webp`;

                console.log(`[Image ${imageId}] Uploading to R2: ${filename}`);

                await s3Client.send(new PutObjectCommand({
                    Bucket: R2_BUCKET_NAME || 'blog-images',
                    Key: filename,
                    Body: processedBuffer,
                    ContentType: 'image/webp',
                }));

                // Return R2 Public URL
                const publicUrl = R2_PUBLIC_DOMAIN
                    ? `${R2_PUBLIC_DOMAIN}/${filename}`
                    : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${filename}`;

                console.log(`[Image ${imageId}] ✅ Upload success: ${publicUrl}`);
                return publicUrl;
            }, 3, 2000);

            return uploadResult;
        } else {
            console.warn(`[Image ${imageId}] R2 not configured, saving locally`);
        }

        // Fallback: Save locally as WebP
        console.log(`[Image ${imageId}] Saving locally...`);
        const uniqueSuffix = suffix || Math.floor(Math.random() * 1000);
        const filename = `${slug.substring(0, 50)}-${Date.now()}-${uniqueSuffix}.webp`;
        await ensureUploadDir();
        const filePath = path.join(UPLOAD_DIR, filename);
        await fs.writeFile(filePath, processedBuffer);
        console.log(`[Image ${imageId}] ⚠️ Saved locally: /uploads/${filename}`);
        return `/uploads/${filename}`;

    } catch (error) {
        console.error(`[Image ${imageId}] ❌ FAILED: ${error.message}`);
        return url; // Return original URL on complete failure
    }
}

export async function processContentImages(htmlContent, slug) {
    // Find all img src URLs
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const matches = [...htmlContent.matchAll(imgRegex)];

    // Deduplicate URLs
    const uniqueUrls = [...new Set(matches.map(m => m[1]))];

    // Filter out already-processed R2 URLs
    const urlsToProcess = uniqueUrls.filter(url => {
        if (R2_PUBLIC_DOMAIN && url.includes(R2_PUBLIC_DOMAIN)) return false;
        if (url.includes('r2.cloudflarestorage.com')) return false;
        if (url.includes('r2.dev')) return false;
        if (url.startsWith('data:')) return false;
        return true;
    });

    console.log(`\n[Image Processor] Found ${uniqueUrls.length} images, processing ${urlsToProcess.length} for slug: ${slug}`);
    urlsToProcess.forEach((url, i) => console.log(`  [${i}] ${url.substring(0, 80)}...`));

    if (urlsToProcess.length === 0) {
        return htmlContent;
    }

    // Process images concurrently with Promise.allSettled (won't fail if one fails)
    const processingResults = await Promise.allSettled(
        urlsToProcess.map((src, i) =>
            downloadImage(src, slug, `content-${i}`)
                .then(newUrl => ({ original: src, processed: newUrl }))
        )
    );

    // Build replacement map
    const replacements = new Map();
    processingResults.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value.processed !== result.value.original) {
            replacements.set(result.value.original, result.value.processed);
            console.log(`[Image Processor] ✅ Replaced: ${urlsToProcess[i].substring(0, 40)}...`);
        } else if (result.status === 'rejected') {
            console.error(`[Image Processor] ❌ Failed: ${urlsToProcess[i].substring(0, 40)}... - ${result.reason}`);
        }
    });

    // Apply all replacements
    let processedHtml = htmlContent;
    for (const [original, replacement] of replacements) {
        processedHtml = processedHtml.split(original).join(replacement);
    }

    console.log(`[Image Processor] ✅ Complete: ${replacements.size}/${urlsToProcess.length} images processed\n`);

    return processedHtml;
}

