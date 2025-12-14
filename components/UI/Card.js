import Link from 'next/link';
import Image from 'next/image';
import styles from './Card.module.css';

export default function Card({ post }) {
    return (
        <article className={styles.card}>
            <Link href={`/blog/${post.slug}`} className={styles.imageLink}>
                {post.image ? (
                    <div className={styles.imageWrapper}>
                        <Image
                            src={post.image}
                            alt={post.image_alt || post.title}
                            fill
                            className={styles.image}
                            sizes="(max-width: 768px) 100vw, 400px"
                        />
                    </div>
                ) : (
                    <div className={styles.imagePlaceholder}>
                        <span>{post.category?.charAt(0) || 'E'}</span>
                    </div>
                )}
            </Link>
            <div className={styles.content}>
                <div className={styles.meta}>
                    {post.categorySlug ? (
                        <Link href={`/category/${post.categorySlug}`} className={styles.category}>
                            {post.category}
                        </Link>
                    ) : (
                        <span className={styles.category}>{post.category}</span>
                    )}
                    <span className={styles.dot}>•</span>
                    <span className={styles.date}>{post.date}</span>
                </div>
                <h3 className={styles.title}>
                    <Link href={`/blog/${post.slug}`}>
                        {post.title}
                    </Link>
                </h3>
                <p className={styles.excerpt}>{post.excerpt}</p>
                <div className={styles.footer}>
                    {post.authorSlug ? (
                        <Link href={`/author/${post.authorSlug}`} className={styles.author}>
                            {post.author}
                        </Link>
                    ) : (
                        <span className={styles.author}>{post.author}</span>
                    )}
                    <Link href={`/blog/${post.slug}`} className={styles.readMore}>
                        Read →
                    </Link>
                </div>
            </div>
        </article>
    );
}

