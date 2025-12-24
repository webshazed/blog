import styles from './blog.module.css';
import Card from '@/components/UI/Card';
import Pagination from '@/components/UI/Pagination';
import { getPostsWithPagination, getCategories } from '@/lib/data';
import Link from 'next/link';

export const metadata = {
    title: 'Blog | Kitchen Algo',
    description: 'Explore our collection of data-driven recipes, kitchen science articles, and cooking techniques.',
};

export default async function BlogPage({ searchParams }) {
    const params = await searchParams;
    const page = parseInt(params?.page) || 1;
    const { articles: posts, pagination } = await getPostsWithPagination(page, 9);
    const categories = await getCategories();

    return (
        <div className={styles.blogPage}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>Our Blog</h1>
                    <p className={styles.heroSubtitle}>
                        Discover insights, tutorials, and stories from our team
                    </p>
                </div>
            </section>

            <div className={`${styles.content} container`}>
                {/* Main Content */}
                <main className={styles.main}>
                    {posts.length === 0 ? (
                        <div className={styles.empty}>
                            <h2>No posts yet</h2>
                            <p>Check back soon for new content!</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.grid}>
                                {posts.map(post => (
                                    <Card key={post.id} post={post} />
                                ))}
                            </div>

                            <Pagination
                                currentPage={pagination.page}
                                totalPages={Math.ceil(pagination.total / pagination.pageSize)}
                                basePath="/blog"
                            />
                        </>
                    )}
                </main>

                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    {/* Categories Widget */}
                    <div className={styles.widget}>
                        <h3 className={styles.widgetTitle}>Categories</h3>
                        <ul className={styles.categoryList}>
                            {categories.map(category => (
                                <li key={category.id}>
                                    <Link
                                        href={`/category/${category.slug}`}
                                        className={styles.categoryLink}
                                    >
                                        <span>{category.name}</span>
                                        <span className={styles.count}>{category.articleCount || 0}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter Widget */}
                    <div className={styles.widget}>
                        <h3 className={styles.widgetTitle}>Newsletter</h3>
                        <p className={styles.widgetText}>
                            Get our latest posts delivered to your inbox.
                        </p>
                        <form className={styles.newsletterForm}>
                            <input
                                type="email"
                                placeholder="Your email address"
                                className={styles.input}
                            />
                            <button type="submit" className={styles.button}>
                                Subscribe
                            </button>
                        </form>
                    </div>
                </aside>
            </div>
        </div>
    );
}
