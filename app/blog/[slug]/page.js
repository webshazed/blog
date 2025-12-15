import { getPostBySlug, getAllPosts } from '@/lib/data';
import { getAdSettings } from '@/lib/strapi';
import styles from './BlogPost.module.css';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Comments from '@/components/Comments';
import ArticleContent from '@/components/ArticleContent';

// Ad Slot Component - renders ad code from Strapi
function AdSlot({ code, fallback, className, style }) {
    if (!code) {
        return fallback ? (
            <div className={className} style={style}>{fallback}</div>
        ) : null;
    }
    return (
        <div
            className={className}
            style={style}
            dangerouslySetInnerHTML={{ __html: code }}
        />
    );
}

const SITE_URL = process.env.SITE_URL || 'https://blog1-roan.vercel.app';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: 'Post Not Found',
        };
    }

    const postUrl = `${SITE_URL}/blog/${slug}`;
    const imageUrl = post.image || `${SITE_URL}/og-image.png`;

    return {
        title: post.title,
        description: post.excerpt || post.title,
        alternates: {
            canonical: postUrl,
        },
        openGraph: {
            type: 'article',
            url: postUrl,
            title: post.title,
            description: post.excerpt || post.title,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: post.imageAlt || post.title,
                },
            ],
            publishedTime: post.date || new Date().toISOString(),
            authors: [post.author || 'Evergreen Team'],
            section: post.category || 'General',
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt || post.title,
            images: [imageUrl],
        },
    };
}

export async function generateStaticParams() {
    const posts = await getAllPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function BlogPost({ params }) {
    const { slug } = await params;
    const [post, allPosts, adSettings] = await Promise.all([
        getPostBySlug(slug),
        getAllPosts(),
        getAdSettings(),
    ]);

    if (!post) {
        notFound();
    }

    // Sidebar Data: Recent Posts (excluding current)
    const recentPosts = allPosts.filter(p => p.slug !== slug).slice(0, 4);
    // Mock Most Viewed (just shuffle or pick randoms for now, simplified to next 4)
    const mostViewedPosts = allPosts.filter(p => p.slug !== slug).sort(() => 0.5 - Math.random()).slice(0, 4);

    // Calculate Reading Time (average 200 words per minute)
    const wordCount = post.content ? post.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Extract TOC from H2 and H3 headings
    const headingRegex = /<h([23])[^>]*(?:id="([^"]*)")?[^>]*>([^<]+)<\/h[23]>/gi;
    const tocItems = [];
    let match;
    const contentWithIds = post.content ? post.content.replace(/<h([23])([^>]*)>([^<]+)<\/h([23])>/gi, (m, level, attrs, text) => {
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        tocItems.push({ level: parseInt(level), id, text: text.trim() });
        return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    }) : '';

    // Generate Article Schema
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "image": post.image ? [post.image] : [],
        "datePublished": post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
        "dateModified": post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
        "author": [{
            "@type": "Person",
            "name": post.author || "Evergreen Team",
            "url": post.authorSlug ? `https://blog1-roan.vercel.app/author/${post.authorSlug}` : undefined
        }],
        "publisher": {
            "@type": "Organization",
            "name": "Evergreen Blog",
            "logo": {
                "@type": "ImageObject",
                "url": "https://blog1-roan.vercel.app/logo.png"
            }
        },
        "description": post.excerpt || post.title,
        "wordCount": wordCount,
        "timeRequired": `PT${readingTime}M`
    };

    // Generate Breadcrumb Schema
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://blog1-roan.vercel.app"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": "https://blog1-roan.vercel.app/blog"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": post.category || "General",
                "item": `https://blog1-roan.vercel.app/category/${post.categorySlug || 'general'}`
            },
            {
                "@type": "ListItem",
                "position": 4,
                "name": post.title
            }
        ]
    };

    const allSchemas = [articleSchema, breadcrumbSchema];

    return (
        <div className={`container ${styles.pageWrapper}`}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(allSchemas) }}
            />

            {/* Breadcrumbs */}
            <nav className={styles.breadcrumbs}>
                <Link href="/">Home</Link> &raquo;
                <Link href="/blog">Blog</Link> &raquo;
                {post.categorySlug ? (
                    <Link href={`/category/${post.categorySlug}`}>{post.category}</Link>
                ) : (
                    <span>{post.category}</span>
                )}
            </nav>

            <div className={styles.layoutGrid}>

                {/* Main Content Column */}
                <main className={styles.mainColumn}>

                    <header className={styles.header}>
                        {post.categorySlug ? (
                            <Link href={`/category/${post.categorySlug}`} className={styles.meta}>
                                {post.category}
                            </Link>
                        ) : (
                            <div className={styles.meta}>
                                {post.category}
                            </div>
                        )}
                        <h1 className={styles.title}>{post.title}</h1>
                        <div className={styles.metaDataRow}>
                            <span>📅 Published: {post.date}</span>
                            <span className={styles.separator}>|</span>
                            <span>⏱️ {readingTime} min read</span>
                            <span className={styles.separator}>|</span>
                            <span>By {post.authorSlug ? (
                                <Link href={`/author/${post.authorSlug}`} className={styles.authorLink}>{post.author}</Link>
                            ) : (
                                <span className={styles.authorLink}>{post.author}</span>
                            )}</span>
                            {post.updatedAt && post.updatedAt !== post.date && (
                                <>
                                    <span className={styles.separator}>|</span>
                                    <span>🔄 Updated: {new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                                </>
                            )}
                        </div>

                        {/* Table of Contents */}
                        {tocItems.length > 2 && (
                            <nav className={styles.toc}>
                                <h4>📖 Table of Contents</h4>
                                <ul>
                                    {tocItems.map((item, i) => (
                                        <li key={i} style={{ marginLeft: item.level === 3 ? '1rem' : 0 }}>
                                            <a href={`#${item.id}`}>{item.text}</a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        )}
                        <div className={styles.socialShare}>
                            <button className={styles.shareBtn} style={{ background: '#3b5998' }}>Share</button>
                            <button className={styles.shareBtn} style={{ background: '#000000' }}>X Tweet</button>
                            <button className={styles.shareBtn} style={{ background: '#bd081c' }}>Pin</button>
                        </div>
                    </header>

                    {/* Top Ad Slot */}
                    {post.enableAds !== false && (
                        <AdSlot
                            code={post.adCodeTop}
                            fallback="AdSense Slot (Top Banner)"
                            className={styles.adSlot}
                        />
                    )}

                    {post.image && (
                        <div className={styles.imageContainer}>
                            <img src={post.image} alt={post.title} className={styles.image} />
                        </div>
                    )}

                    <div className={styles.content}>
                        {/* Article Content with Auto-Injected Ads */}
                        <ArticleContent
                            htmlContent={contentWithIds || post.content}
                            adSettings={adSettings}
                        />

                        <Link href="/" className={styles.backLink}>
                            &larr; Back to Home
                        </Link>
                    </div>

                    {/* Bottom Ad Slot */}
                    {post.enableAds !== false && (
                        <AdSlot
                            code={post.adCodeBottom}
                            fallback="AdSense Slot (Bottom Banner)"
                            className={styles.adSlot}
                        />
                    )}

                    {/* Comments Section */}
                    <Comments slug={slug} />

                </main>

                {/* Sidebar Column */}
                <aside className={styles.sidebar}>

                    {/* Author Widget */}
                    <div className={styles.widget}>
                        <div className={styles.authorWidget}>
                            <div className={styles.authorImg}>
                                {post.author?.charAt(0) || 'E'}
                            </div>
                            <h3>{post.author || 'Evergreen Team'}</h3>
                            <p>Expert writer sharing insights on design, technology, and mindful living.</p>
                            {post.authorSlug && (
                                <Link href={`/author/${post.authorSlug}`} className={styles.moreBtn}>
                                    View all posts &rarr;
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Sticky Ad Mock */}
                    <div className={styles.widget}>
                        <div className={styles.adSlot} style={{ minHeight: '300px', margin: 0 }}>
                            AdSense (Sidebar Sticky)
                        </div>
                    </div>

                    {/* Recent Posts */}
                    <div className={styles.widget}>
                        <h3 className={styles.widgetTitle}>Recent Posts</h3>
                        <div className={styles.postsGrid}>
                            {recentPosts.map(p => (
                                <Link href={`/blog/${p.slug}`} key={p.slug} className={styles.miniPost}>
                                    <div className={styles.miniThumb}>
                                        {/* Fallback image if no p.image, or simple div color */}
                                        {p.image ? <img src={p.image} alt={p.title} /> : <div style={{ background: '#eee', width: '100%', height: '100%' }}></div>}
                                    </div>
                                    <h4>{p.title}</h4>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Most Viewed Posts */}
                    <div className={styles.widget}>
                        <h3 className={styles.widgetTitle}>Most Viewed</h3>
                        <div className={styles.postsGrid}>
                            {mostViewedPosts.map(p => (
                                <Link href={`/blog/${p.slug}`} key={p.slug} className={styles.miniPost}>
                                    <div className={styles.miniThumb}>
                                        {p.image ? <img src={p.image} alt={p.title} /> : <div style={{ background: '#eee', width: '100%', height: '100%' }}></div>}
                                    </div>
                                    <h4>{p.title}</h4>
                                </Link>
                            ))}
                        </div>
                    </div>

                </aside>
            </div>
        </div>
    );
}
