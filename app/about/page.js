import styles from './about.module.css';
import { getAuthors } from '@/lib/data';
import Link from 'next/link';

export const metadata = {
    title: 'About Us | Evergreen',
    description: 'Learn about Evergreen - a curated collection of thoughts on design, technology, and the slow art of living well.',
};

export default async function AboutPage() {
    const authors = await getAuthors();

    return (
        <div className={styles.aboutPage}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>About Evergreen</h1>
                    <p className={styles.heroSubtitle}>
                        Stories & insights for curious minds
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section className={`${styles.section} container`}>
                <div className={styles.missionGrid}>
                    <div className={styles.missionContent}>
                        <h2 className={styles.sectionTitle}>Our Mission</h2>
                        <p>
                            Evergreen is a curated collection of thoughts on design, technology,
                            and the slow art of living well. We believe in timeless ideas over
                            fleeting trends.
                        </p>
                        <p>
                            Our writers explore the intersection of technology and humanity,
                            offering insights that remain relevant long after they're published.
                            Every article is crafted with care, designed to educate, inspire,
                            and spark meaningful conversations.
                        </p>
                    </div>
                    <div className={styles.missionImage}>
                        <div className={styles.imagePlaceholder}>
                            <span>🌿</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className={styles.valuesSection}>
                <div className="container">
                    <h2 className={styles.sectionTitle}>Our Values</h2>
                    <div className={styles.valuesGrid}>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>📚</div>
                            <h3>Quality Over Quantity</h3>
                            <p>Every article is researched, reviewed, and refined to provide genuine value.</p>
                        </div>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>💡</div>
                            <h3>Timeless Ideas</h3>
                            <p>We focus on evergreen content that remains relevant for years to come.</p>
                        </div>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>🤝</div>
                            <h3>Community First</h3>
                            <p>We write for our readers, not algorithms. Your growth is our success.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className={`${styles.section} container`}>
                <h2 className={styles.sectionTitle}>Meet Our Writers</h2>
                <div className={styles.teamGrid}>
                    {authors.length > 0 ? (
                        authors.map(author => (
                            <Link
                                href={`/author/${author.slug}`}
                                key={author.id}
                                className={styles.authorCard}
                            >
                                <div className={styles.authorAvatar}>
                                    {author.avatar ? (
                                        <img src={author.avatar} alt={author.name} />
                                    ) : (
                                        <span>{author.name.charAt(0)}</span>
                                    )}
                                </div>
                                <h3 className={styles.authorName}>{author.name}</h3>
                                {author.bio && (
                                    <p className={styles.authorBio}>{author.bio}</p>
                                )}
                                <span className={styles.articleCount}>
                                    {author.articleCount || 0} article{author.articleCount !== 1 ? 's' : ''}
                                </span>
                            </Link>
                        ))
                    ) : (
                        <p className={styles.noAuthors}>No authors yet. Stay tuned!</p>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className={styles.ctaSection}>
                <div className="container">
                    <h2>Want to contribute?</h2>
                    <p>We're always looking for passionate writers to join our team.</p>
                    <Link href="/contact" className={styles.ctaButton}>
                        Get in Touch
                    </Link>
                </div>
            </section>
        </div>
    );
}
