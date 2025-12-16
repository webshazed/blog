import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Public directory for local images
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

// Site Configuration
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
    console.log('[Image Processor] ✅ R2 client initialized');
} else {
    console.warn('[Image Processor] ⚠️ R2 not configured - images will be saved locally');
}

async function ensureUploadDir() {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
}

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
 * Get image buffer from URL or local path
 */
async function getImageBuffer(url) {
    // Check if it's a local path (starts with / but not http)
    if (url.startsWith('/') && !url.startsWith('//')) {
        // Try to read from public folder
        const localPath = path.join(PUBLIC_DIR, url);
        console.log(`[Fetch] Checking local file: ${localPath}`);

        if (await fileExists(localPath)) {
            try {
                const buffer = await fs.readFile(localPath);
                console.log(`[Fetch] ✅ Read local file: ${(buffer.length / 1024).toFixed(1)}KB`);
                return buffer;
            } catch (e) {
                console.error(`[Fetch] ❌ Failed to read local file: ${e.message}`);
                return null;
            }
        } else {
            console.log(`[Fetch] ❌ Local file not found: ${localPath}`);
            return null;
        }
    }

    // HTTP/HTTPS URL - fetch with retries
    if (url.startsWith('http://') || url.startsWith('https://')) {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`[Fetch] Attempt ${attempt}/3: ${url.substring(0, 60)}...`);

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 25000);

                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                clearTimeout(timeout);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const buffer = Buffer.from(await response.arrayBuffer());
                console.log(`[Fetch] ✅ Downloaded: ${(buffer.length / 1024).toFixed(1)}KB`);
                return buffer;

            } catch (error) {
                console.warn(`[Fetch] ❌ Attempt ${attempt} failed: ${error.message}`);
                if (attempt < 3) {
                    await sleep(1500 * attempt);
                }
            }
        }
    }

    return null;
}

/**
 * Upload buffer to R2
 */
async function uploadToR2(buffer, filename, maxRetries = 3) {
    if (!hasR2Credentials || !s3Client) {
        console.log('[R2] Not configured, skipping upload');
        return null;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[R2] Upload attempt ${attempt}/${maxRetries}: ${filename}`);

            await s3Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME || 'blog-images',
                Key: filename,
                Body: buffer,
                ContentType: 'image/webp',
            }));

            const publicUrl = R2_PUBLIC_DOMAIN
                ? `${R2_PUBLIC_DOMAIN.replace(/\/$/, '')}/${filename}`
                : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${filename}`;

            console.log(`[R2] ✅ Upload success: ${publicUrl}`);
            return publicUrl;

        } catch (error) {
            console.warn(`[R2] ❌ Attempt ${attempt} failed: ${error.message}`);
            if (attempt < maxRetries) {
                await sleep(2000 * attempt);
            }
        }
    }
    return null;
}

/**
 * Compress image with Sharp
 */
async function compressImage(buffer, slug, index) {
    try {
        const currentYear = new Date().getFullYear();

        const compressed = await sharp(buffer)
            .withMetadata({
                exif: {
                    IFD0: {
                        Copyright: `© ${currentYear} ${SITE_NAME}`,
                        Artist: SITE_NAME,
                        ImageDescription: `Image for ${slug.replace(/-/g, ' ')}`
                    }
                }
            })
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer();

        console.log(`[Compress] ${(buffer.length / 1024).toFixed(1)}KB → ${(compressed.length / 1024).toFixed(1)}KB`);
        return compressed;

    } catch (error) {
        console.error(`[Compress] ❌ Failed: ${error.message}`);
        return null;
    }
}

/**
 * Process a single image: fetch → compress → upload
 * Returns the new R2 URL or null if failed
 */
async function processOneImage(url, slug, index) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`[Image ${index}] Processing: ${url}`);

    // 1. Get image buffer (from local file or HTTP)
    const buffer = await getImageBuffer(url);
    if (!buffer) {
        console.log(`[Image ${index}] ❌ Could not get image, skipping`);
        return null;
    }

    // 2. Compress
    const compressed = await compressImage(buffer, slug, index);
    if (!compressed) {
        console.log(`[Image ${index}] ❌ Compression failed, skipping`);
        return null;
    }

    // 3. Upload to R2
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const safeSlug = slug.substring(0, 40).replace(/[^a-z0-9-]/gi, '');
    const filename = `${safeSlug}-${timestamp}-${index}-${random}.webp`;

    const r2Url = await uploadToR2(compressed, filename);
    if (r2Url) {
        console.log(`[Image ${index}] ✅ Complete: ${r2Url}`);
        return r2Url;
    }

    // Fallback: save locally
    console.log(`[Image ${index}] Saving locally as fallback...`);
    try {
        await ensureUploadDir();
        const localPath = path.join(UPLOAD_DIR, filename);
        await fs.writeFile(localPath, compressed);
        const localUrl = `/uploads/${filename}`;
        console.log(`[Image ${index}] ⚠️ Saved locally: ${localUrl}`);
        return localUrl;
    } catch (e) {
        console.error(`[Image ${index}] ❌ Local save failed: ${e.message}`);
        return null;
    }
}

/**
 * Check if URL should be processed
 */
function shouldProcessUrl(url) {
    if (!url) return false;

    // Skip data URLs
    if (url.startsWith('data:')) return false;

    // Skip already-processed R2 URLs
    if (R2_PUBLIC_DOMAIN && url.includes(R2_PUBLIC_DOMAIN)) return false;
    if (url.includes('r2.cloudflarestorage.com')) return false;
    if (url.includes('r2.dev')) return false;

    // Process HTTP/HTTPS URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return true;
    }

    // Process local paths starting with /
    if (url.startsWith('/')) {
        return true;
    }

    return false;
}

/**
 * Downloads and uploads featured image
 */
export async function downloadImage(url, slug, suffix = 'featured') {
    if (!url || !shouldProcessUrl(url)) {
        console.log(`[Featured Image] Invalid or empty URL, skipping`);
        return url || '';
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Featured Image] Processing: ${url}`);
    console.log(`${'='.repeat(60)}`);

    const result = await processOneImage(url, slug, suffix);
    return result || url;
}

/**
 * Process all images in HTML content SEQUENTIALLY
 */
export async function processContentImages(htmlContent, slug) {
    if (!htmlContent) return htmlContent;

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`[CONTENT IMAGES] Starting for: ${slug}`);
    console.log(`${'═'.repeat(60)}`);

    // Find all img src URLs
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const matches = [...htmlContent.matchAll(imgRegex)];

    if (matches.length === 0) {
        console.log('[CONTENT IMAGES] No images found in content');
        return htmlContent;
    }

    // Get unique URLs
    const allUrls = [...new Set(matches.map(m => m[1]))];
    console.log(`[CONTENT IMAGES] Found ${allUrls.length} unique image URLs:`);
    allUrls.forEach((url, i) => console.log(`  [${i}] ${url}`));

    // Filter to only processable URLs
    const urlsToProcess = allUrls.filter(shouldProcessUrl);
    console.log(`[CONTENT IMAGES] URLs to process: ${urlsToProcess.length}`);

    if (urlsToProcess.length === 0) {
        console.log('[CONTENT IMAGES] No URLs to process');
        return htmlContent;
    }

    // Process each URL sequentially
    const replacements = new Map();

    for (let i = 0; i < urlsToProcess.length; i++) {
        const originalUrl = urlsToProcess[i];
        console.log(`\n[Progress] Image ${i + 1}/${urlsToProcess.length}`);

        const newUrl = await processOneImage(originalUrl, slug, i);

        if (newUrl && newUrl !== originalUrl) {
            replacements.set(originalUrl, newUrl);
            console.log(`[Replacement ${i}] ✅ ${originalUrl.substring(0, 30)}... → ${newUrl.substring(0, 40)}...`);
        } else {
            console.log(`[Replacement ${i}] ❌ Failed, keeping original`);
        }

        // Delay between images
        if (i < urlsToProcess.length - 1) {
            await sleep(500);
        }
    }

    // Apply all replacements
    let processedHtml = htmlContent;

    console.log(`\n[CONTENT IMAGES] Applying ${replacements.size} replacements...`);
    for (const [original, replacement] of replacements) {
        // Replace all occurrences
        const beforeCount = processedHtml.split(original).length - 1;
        processedHtml = processedHtml.split(original).join(replacement);
        console.log(`  Replaced ${beforeCount} occurrences of: ${original.substring(0, 40)}...`);
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`[CONTENT IMAGES] ✅ Complete: ${replacements.size}/${urlsToProcess.length} images processed`);
    console.log(`${'═'.repeat(60)}\n`);

    return processedHtml;
}
