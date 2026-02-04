import styles from './author.module.css';
import Card from '@/components/UI/Card';
import Pagination from '@/components/UI/Pagination';
import { getAuthor, getPostsByAuthor, getAuthors } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const author = await getAuthor(slug);

    if (!author) {
        return { title: 'Author Not Found' };
    }

    return {
        title: `${author.name} | Expert Author | Kitchen Algo`,
        description: author.bio || `Scientific cooking articles and kitchen algorithms by ${author.name}.`,
    };
}

export async function generateStaticParams() {
    const authors = await getAuthors();
    return authors.map((author) => ({
        slug: author.slug,
    }));
}

export default async function AuthorPage({ params }) {
    const { slug } = await params;
    const page = 1; // Static build limitation: only first page is generated

    const author = await getAuthor(slug);

    if (!author) {
        notFound();
    }

    const { articles: posts, pagination } = await getPostsByAuthor(slug, page, 9);

    return (
        <div className={styles.authorPage}>
            {/* Author Header */}
            <section className={styles.header}>
                <div className="container">
                    <div className={styles.profile}>
                        <div className={styles.avatar}>
                            {author.avatar ? (
                                <img src={author.avatar} alt={author.name} />
                            ) : (
                                <span>{author.name.charAt(0)}</span>
                            )}
                        </div>
                        <div className={styles.info}>
                            <div className={styles.badge}>
                                <span>🛡️</span> Verified Expert Author
                            </div>
                            <h1 className={styles.name}>{author.name}</h1>
                            {author.bio && (
                                <p className={styles.bio}>{author.bio}</p>
                            )}
                            <div className={styles.socials}>
                                {author.twitter && (
                                    <a href={author.twitter} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                                        𝕏
                                    </a>
                                )}
                                {author.linkedin && (
                                    <a href={author.linkedin} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                                        in
                                    </a>
                                )}
                                {author.website && (
                                    <a href={author.website} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                                        🔗
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Posts */}
            <section className={`${styles.content} container`}>
                <h2 className={styles.sectionTitle}>
                    Articles by {author.name}
                    <span className={styles.count}>({pagination.total || 0})</span>
                </h2>

                {posts.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No articles published yet.</p>
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
                            basePath={`/author/${slug}`}
                        />
                    </>
                )}
            </section>
        </div>
    );
}
