import { getAllArticles } from '@/lib/strapi';

const SITE_URL = process.env.SITE_URL || 'https://blog1-roan.vercel.app';
const SITE_NAME = process.env.SITE_NAME || 'Evergreen';

export async function GET() {
    let articles = [];

    try {
        const result = await getAllArticles(1, 50);
        articles = result?.articles || [];
    } catch (e) {
        console.error('RSS: Failed to fetch articles', e);
    }

    const rssItems = articles.map((article) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${SITE_URL}/blog/${article.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${article.slug}</guid>
      <description><![CDATA[${article.excerpt || article.title}]]></description>
      <pubDate>${new Date(article.date || article.createdAt || Date.now()).toUTCString()}</pubDate>
      ${article.author ? `<author>${article.author}</author>` : ''}
      ${article.category ? `<category>${article.category}</category>` : ''}
    </item>`).join('');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} Blog</title>
    <link>${SITE_URL}</link>
    <description>A beautiful, timeless space for thoughts and stories.</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

    return new Response(rssFeed, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 's-maxage=3600, stale-while-revalidate',
        },
    });
}
