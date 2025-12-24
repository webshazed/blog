import styles from './page.module.css';
import Card from '@/components/UI/Card';
import { getAllPosts, getCategories, getFeaturedPosts } from '@/lib/data';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  // Parallel Data Fetching
  const [posts, categories, featuredPosts] = await Promise.all([
    getAllPosts(1, 6),
    getCategories(),
    getFeaturedPosts(3)
  ]);

  const featuredPost = featuredPosts[0] || posts[0];

  // Map categories to visual emojis or icons (Mocking icons for now)
  const categoryIcons = {
    'recipes': '🍳',
    'kitchen-tips': '💡',
    'science-of-cooking': '🔬',
    'gear-reviews': '🔪',
    'nutrition': '🥗',
    'air-fryer': '🍗',
    'instant-pot': '🥣'
  };

  return (
    <div className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <Image
          src="/KithcenAlgo-banner.webp"
          alt="Kitchen Algo Banner"
          fill
          priority
          className={styles.heroBg}
        />
        <div className={styles.heroOverlay}></div>
        <div className="container">
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>Science Meets Flavor</span>
            <h1 className={styles.heroTitle}>Master the <span>Kitchen Algo.</span></h1>
            <p className={styles.heroSubtitle}>
              Unlock the data-driven secrets of perfect cooking. We break down the science,
              gear, and techniques behind every byte.
            </p>
            <div className={styles.heroActions}>
              <Link href="/blog" className={styles.primaryBtn}>
                Explore Lab Notes
              </Link>
              <Link href="/about" className={styles.secondaryBtn}>
                Our Mission
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Categories */}
      {categories.length > 0 && (
        <section className={styles.categoriesSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Browse <span>Categories</span></h2>
              <Link href="/search" className={styles.viewAll}>
                All Topics →
              </Link>
            </div>
            <div className={styles.categoriesGrid}>
              {categories.slice(0, 5).map(category => (
                <Link
                  href={`/category/${category.slug}`}
                  key={category.id}
                  className={styles.categoryLink}
                >
                  <div className={styles.categoryCard}>
                    <span className={styles.categoryIcon}>
                      {categoryIcons[category.slug] || '🍲'}
                    </span>
                    <h3>{category.name}</h3>
                    <span>{category.articleCount || 0} Articles</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Post */}
      {featuredPost && (
        <section className={styles.featuredSection}>
          <div className="container">
            <div className={styles.featured}>
              <div className={styles.featuredImage}>
                {featuredPost.image ? (
                  <Image
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <span>Science in Action</span>
                  </div>
                )}
              </div>
              <div className={styles.featuredContent}>
                <span className={styles.featuredLabel}>Lab Favorite</span>
                <h2 className={styles.featuredTitle}>
                  <Link href={`/blog/${featuredPost.slug}`}>
                    {featuredPost.title}
                  </Link>
                </h2>
                <p className={styles.featuredExcerpt}>
                  {featuredPost.excerpt}
                </p>
                <Link href={`/blog/${featuredPost.slug}`} className={styles.readMore}>
                  Read Full Theory →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SEO About Section */}
      <section className={styles.seoAbout}>
        <div className="container">
          <div className={styles.aboutContent}>
            <h2>Decoding the Art of Cooking</h2>
            <p>
              Kitchen Algo isn't just about recipes; it's about the <strong>algorithms of taste</strong>.
              We leverage data, science, and rigorous testing to bring you the most efficient
              and delicious results in the modern kitchen.
            </p>
            <div className={styles.aboutGrid}>
              <div className={styles.aboutItem}>
                <h4>🧪 Lab-Tested</h4>
                <p>Every recipe is tested across multiple variables to ensure perfect results.</p>
              </div>
              <div className={styles.aboutItem}>
                <h4>⚙️ Gear Focused</h4>
                <p>Scientific reviews of the tech that actually makes cooking better.</p>
              </div>
              <div className={styles.aboutItem}>
                <h4>🥗 Health Metrics</h4>
                <p>Data-driven nutritional insights for every meal we create.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Posts */}
      <section className={styles.gridSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Latest <span>Entries</span></h2>
            <Link href="/blog" className={styles.viewAll}>
              Full Archives →
            </Link>
          </div>
          <div className={styles.grid}>
            {posts.map(post => (
              <Card key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className={styles.newsletter}>
        <div className="container">
          <div className={styles.newsletterCard}>
            <div className={styles.newsletterText}>
              <h2>Join the Laboratory</h2>
              <p>Get data-driven recipes and kitchen experiments delivered to your inbox.</p>
            </div>
            <form className={styles.newsletterForm}>
              <input
                type="email"
                placeholder="chef@kitchenalgo.com"
                className={styles.input}
              />
              <button type="submit" className={styles.subscribeBtn}>
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Structured Data for SEO (EEAT) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Kitchen Algo",
            "url": "https://kitchenalgo.com",
            "logo": "https://kitchenalgo.com/logo.png",
            "sameAs": [
              "https://twitter.com/kitchenalgo",
              "https://instagram.com/kitchenalgo"
            ],
            "description": "Deciphering the science of cooking through data-driven recipes and kitchen algorithms."
          })
        }}
      />
    </div>
  );
}
