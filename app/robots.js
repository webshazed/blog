const BASE_URL = process.env.SITE_URL || 'https://www.kitchenalgo.com';



export const dynamic = 'force-static';

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
