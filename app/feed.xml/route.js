import { getAllPosts as getAllArticles } from '@/lib/data';

const SITE_URL = process.env.SITE_URL || 'https://www.kitchenalgo.com';
const SITE_NAME = process.env.SITE_NAME || 'Evergreen';

export const dynamic = 'force-static';

export async function GET() {
  let articles = [];

  try {
    articles = await getAllArticles(1, 50);
  } catch (e) {
    console.error('RSS: Failed to fetch articles', e);
  }

  const escapeXml = (unsafe) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  };

  const rssItems = articles.map((article) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${SITE_URL}/blog/${article.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${article.slug}</guid>
      <description><![CDATA[${article.excerpt || article.title}]]></description>
      <pubDate>${new Date(article.date || article.createdAt || Date.now()).toUTCString()}</pubDate>
      ${article.author ? `<author>${escapeXml(article.author.toString())}</author>` : ''}
      ${article.category ? `<category><![CDATA[${article.category}]]></category>` : ''}
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
