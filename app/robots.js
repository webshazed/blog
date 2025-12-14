const BASE_URL = process.env.SITE_URL || 'https://blog1-roan.vercel.app';

export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/admin/'],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
