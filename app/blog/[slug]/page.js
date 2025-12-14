import { getPostBySlug, getAllPosts } from '@/lib/data';
import styles from './BlogPost.module.css';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Comments from '@/components/Comments';

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

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: 'Post Not Found',
        };
    }

    return {
        title: `${post.title} | Evergreen`,
        description: post.excerpt,
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
    const post = await getPostBySlug(slug);
    const allPosts = await getAllPosts();

    if (!post) {
        notFound();
    }

    // Sidebar Data: Recent Posts (excluding current)
    const recentPosts = allPosts.filter(p => p.slug !== slug).slice(0, 4);
    // Mock Most Viewed (just shuffle or pick randoms for now, simplified to next 4)
    const mostViewedPosts = allPosts.filter(p => p.slug !== slug).sort(() => 0.5 - Math.random()).slice(0, 4);

    return (
        <div className={`container ${styles.pageWrapper}`}>

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
                            <span>Published: {post.date}</span>
                            <span className={styles.separator}>|</span>
                            <span>By {post.authorSlug ? (
                                <Link href={`/author/${post.authorSlug}`} className={styles.authorLink}>{post.author}</Link>
                            ) : (
                                <span className={styles.authorLink}>{post.author}</span>
                            )}</span>
                        </div>

                        {/* Social Placeholders */}
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
                        {/* Middle Ad Slot - inserted before content */}
                        {post.enableAds !== false && post.adCodeMiddle && (
                            <AdSlot
                                code={post.adCodeMiddle}
                                className={styles.adSlot}
                            />
                        )}

                        <div dangerouslySetInnerHTML={{ __html: post.content }} />

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
