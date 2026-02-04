/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.r2.cloudflarestorage.com',
            },
            {
                protocol: 'https',
                hostname: 'pub-*.r2.dev',
            },
            {
                protocol: 'https',
                hostname: 'strapi-cms-qbv8.onrender.com',
            },
            {
                protocol: 'https',
                hostname: '**.cloudflare.com',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'kitchenalgo.com',
            },
            {
                protocol: 'https',
                hostname: 'images.kitchenalgo.com',
            },
            {
                protocol: 'https',
                hostname: '**.unsplash.com',
            },
        ],
    },
};

module.exports = nextConfig;
