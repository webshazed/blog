import styles from './about.module.css';
import { getAllAuthors } from '@/lib/strapi';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
    title: 'About Us | Kitchen Algo',
    description: 'Welcome to Kitchen Algo - where data-driven recipes meet the science of the kitchen. Our mission is to simplify cooking through algorithms and efficiency.',
};

export default async function AboutPage() {
    // Fetch authors from Strapi
    const authors = await getAllAuthors();

    return (
        <div className={styles.aboutPage}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>About Kitchen Algo</h1>
                    <p className={styles.heroSubtitle}>
                        Where Culinary Art Meets Kitchen Science
                    </p>
                </div>
            </section>

            {/* Mission & Philosophy */}
            <section className={`${styles.section} container`}>
                <div className={styles.missionGrid}>
                    <div className={styles.missionContent}>
                        <h2 className={styles.sectionTitle}>The Kitchen Algo Philosophy</h2>
                        <p>
                            At Kitchen Algo, we believe that cooking is more than just following instructions—it's a precise science that can be mastered, optimized, and enjoyed.
                            Our philosophy is rooted in the <strong>"Algorithm of Taste"</strong>: the concept that every perfect dish is the result of distinctive, repeatable, and quantifiable variables.
                        </p>
                        <p>
                            We don't just share recipes; we decode the <em>why</em> and <em>how</em> behind them. Why does a specific temperature trigger the perfect Maillard reaction?
                            Why does a 2% salt-to-flour ratio yield the ultimate crust? Our mission is to eliminate the guesswork from your kitchen by providing data-driven guides,
                            rigorous technique testing, and recipes that work every single time.
                        </p>
                        <p>
                            <strong>Our Vision:</strong> To empower every home cook with the scientific confidence to experiment, innovate, and master their culinary environment.
                        </p>
                    </div>
                    <div className={styles.missionImage}>
                        <div className={styles.imageWrapper}>
                            <Image
                                src="https://kitchenalgo.com/KithcenAlgo-team.jpg"
                                alt="The Kitchen Algo Team"
                                width={600}
                                height={600}
                                style={{
                                    objectFit: 'cover',
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: 'var(--radius-lg)'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Credibility / Experience */}
            <section className={styles.experienceSection}>
                <div className="container">
                    <div className={styles.experienceContent}>
                        <h2 className={styles.sectionTitle}>Decades of Culinary Logic</h2>
                        <p>
                            Our team brings together a unique and powerful blend of professional culinary experience and analytical engineering mindsets.
                            We've spent thousands of hours in the "test lab" (our kitchens), breaking down complex recipes into efficient, high-performance algorithms.
                            From analyzing heat distribution in pans to optimizing prep workflows, we turn chaos into delicious order.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className={styles.valuesSection}>
                <div className="container">
                    <h2 className={styles.sectionTitle}>The Kitchen Algo Standards</h2>
                    <div className={styles.valuesGrid}>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>🧪</div>
                            <h3>Tested & Proven</h3>
                            <p>Every recipe is rigorously tested multiple times to ensure accuracy, consistency, and repeatability across different appliances and environments.</p>
                        </div>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>📉</div>
                            <h3>Data-Driven</h3>
                            <p>We analyze ratios, temperatures, and timings to find the optimal paths to flavor, ensuring you get the best results with the least amount of trial and error.</p>
                        </div>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>⚡</div>
                            <h3>Efficiency First</h3>
                            <p>We focus on "Kitchen Algorithms" that save you time, reduce waste, and streamline your cooking process without sacrificing the quality of your meals.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className={`${styles.section} container`}>
                <h2 className={styles.sectionTitle}>Meet Our Experts</h2>
                <div className={styles.teamGrid}>
                    {authors.length > 0 ? (
                        authors.map((author) => (
                            <div key={author.id} className={styles.authorCard}>
                                <div className={styles.authorAvatar}>
                                    {author.avatar ? (
                                        <Image
                                            src={author.avatar}
                                            alt={author.name}
                                            width={100}
                                            height={100}
                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                        />
                                    ) : (
                                        <span>{author.name.charAt(0)}</span>
                                    )}
                                </div>
                                <h3 className={styles.authorName}>{author.name}</h3>
                                <p className={styles.articleCount}>{author.articleCount} Articles</p>
                                <p className={styles.authorBio}>{author.bio || 'Contributing culinary expert.'}</p>
                                <Link href={`/author/${author.slug}`} className={styles.articleCount} style={{ textDecoration: 'underline', marginTop: '0.5rem', display: 'block' }}>
                                    View Profile
                                </Link>
                            </div>
                        ))
                    ) : (
                        <div className={styles.noAuthors}>
                            <p>Our team is cooking up something special. Check back soon!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className={styles.ctaSection}>
                <div className="container">
                    <h2>Got a kitchen puzzle?</h2>
                    <p>We're always looking for new challenges to solve. Whether it's a recipe request or a culinary conundrum, reach out to our team!</p>
                    <Link href="/contact" className={styles.ctaButton}>
                        Contact the Lab
                    </Link>
                </div>
            </section>
        </div>
    );
}
