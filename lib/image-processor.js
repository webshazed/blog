import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

// Initialize S3 Client for Cloudflare R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

async function ensureUploadDir() {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
}

/**
 * Downloads, compresses, and uploads an image to Cloudflare R2.
 * Falls back to local storage if R2 fails or credentials missing.
 */
export async function downloadImage(url, slug, suffix = '') {
    if (!url) return url;

    // Check if it's a local absolute path or HTTP
    const isLocalPath = /^[a-zA-Z]:\\/.test(url) || /^[a-zA-Z]:\//.test(url) || url.startsWith('/');
    const isHttp = url.startsWith('http');

    if (!isLocalPath && !isHttp) return url;

    try {
        let buffer;
        let originalExt = 'jpg';

        // 1. Fetch Image Buffer
        if (isLocalPath) {
            console.log(`Processing local image: ${url}`);
            try {
                const cleanPath = url.replace(/['"]/g, '');
                await fs.access(cleanPath);
                buffer = await fs.readFile(cleanPath);
                originalExt = path.extname(cleanPath).substring(1) || 'jpg';
            } catch (e) {
                console.error(`Local file not found: ${url}`, e);
                return url;
            }
        } else {
            console.log(`Downloading image: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch image: ${url} - ${response.statusText}`);
                return url;
            }
            buffer = Buffer.from(await response.arrayBuffer());
            const contentType = response.headers.get('content-type');
            if (contentType) {
                if (contentType.includes('png')) originalExt = 'png';
                else if (contentType.includes('webp')) originalExt = 'webp';
                else if (contentType.includes('gif')) originalExt = 'gif';
                else if (contentType.includes('svg')) originalExt = 'svg';
                else if (contentType.includes('jpeg')) originalExt = 'jpg';
            }
        }

        // 2. Compress & Convert to WebP using Sharp
        // Invisible SEO #4: Preserve EXIF/IPTC metadata
        console.log(`Compressing image...`);
        let processedBuffer = await sharp(buffer)
            .withMetadata() // Preserves copyright, camera info, etc.
            .resize({ width: 1200, withoutEnlargement: true }) // Max width 1200px
            .webp({ quality: 75 }) // Convert to WebP, 75% quality
            .toBuffer();

        // 3. Upload to R2
        const hasCredentials = R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && !R2_ACCESS_KEY_ID.includes('placeholder');
        console.log(`[Image] Check credentials for ${slug} (${suffix}): ${hasCredentials ? 'PASS' : 'FAIL'} (Acct: ${!!R2_ACCOUNT_ID}, Key: ${!!R2_ACCESS_KEY_ID}, Secret: ${!!R2_SECRET_ACCESS_KEY})`);

        if (hasCredentials) {
            try {
                const uniqueSuffix = suffix || Math.floor(Math.random() * 1000);
                const filename = `${slug.substring(0, 50)}-${Date.now()}-${uniqueSuffix}.webp`;

                console.log(`Uploading to R2: ${filename}`);

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

                console.log(`[Image] Upload success: ${publicUrl}`);
                return publicUrl;
            } catch (r2Error) {
                console.error(`[Image] R2 Upload failed for ${url}, falling back to local:`, r2Error);
                // Fallthrough to local saving below
            }
        } else {
            console.warn("[Image] R2 Credentials missing or placeholder, falling back to local storage.");
        }

        // Fallback: Save locally as WebP
        console.log(`[Image] Saving locally: ${slug}`);
        const uniqueSuffix = suffix || Math.floor(Math.random() * 1000);
        const filename = `${slug.substring(0, 50)}-${Date.now()}-${uniqueSuffix}.webp`;
        await ensureUploadDir();
        const filePath = path.join(UPLOAD_DIR, filename);
        await fs.writeFile(filePath, processedBuffer);
        return `/uploads/${filename}`;

    } catch (error) {
        console.error(`Error processing image ${url}:`, error);
        return url;
    }
}

export async function processContentImages(htmlContent, slug) {
    // Find all img src URLs
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    const matches = [...htmlContent.matchAll(imgRegex)];

    // Deduplicate URLs
    const uniqueUrls = [...new Set(matches.map(m => m[1]))];

    let processedHtml = htmlContent;

    for (let i = 0; i < uniqueUrls.length; i++) {
        const src = uniqueUrls[i];

        // Skip already processed R2 URLs if re-running
        if (src.includes(R2_PUBLIC_DOMAIN || 'r2.cloudflarestorage.com')) continue;

        const newUrl = await downloadImage(src, slug, `content-${i}`);

        // global replace
        if (newUrl !== src) {
            processedHtml = processedHtml.split(src).join(newUrl);
        }
    }

    return processedHtml;
}
