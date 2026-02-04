import styles from './category.module.css';
import Card from '@/components/UI/Card';
import Pagination from '@/components/UI/Pagination';
import { getCategory, getPostsByCategory, getCategories } from '@/lib/data';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const category = await getCategory(slug);

    if (!category) {
        return { title: 'Category Not Found' };
    }

    return {
        title: `${category.name} | Kitchen Algo`,
        description: category.description || `Articles in ${category.name}`,
    };
}

export async function generateStaticParams() {
    const categories = await getCategories();
    return categories.map((category) => ({
        slug: category.slug,
    }));
}

export default async function CategoryPage({ params }) {
    const { slug } = await params;
    const page = 1; // Static build limitation: only first page is generated

    const category = await getCategory(slug);

    if (!category) {
        notFound();
    }

    const { articles: posts, pagination } = await getPostsByCategory(slug, page, 9);

    return (
        <div className={styles.categoryPage}>
            {/* Category Header */}
            <section className={styles.header}>
                <div className="container">
                    <span className={styles.label}>Category</span>
                    <h1 className={styles.title}>{category.name}</h1>
                    {category.description && (
                        <p className={styles.description}>{category.description}</p>
                    )}
                    <div className={styles.meta}>
                        {pagination.total || 0} article{pagination.total !== 1 ? 's' : ''}
                    </div>
                </div>
            </section>

            {/* Posts */}
            <section className={`${styles.content} container`}>
                {posts.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No articles in this category yet.</p>
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
                            basePath={`/category/${slug}`}
                        />
                    </>
                )}
            </section>
        </div>
    );
}
