import styles from './page.module.css';
import Card from '@/components/UI/Card';
import { getAllPosts, getCategories, getFeaturedPosts } from '@/lib/data';
import Link from 'next/link';

export default async function Home() {
  const posts = await getAllPosts(1, 6);
  const categories = await getCategories();
  const featuredPosts = await getFeaturedPosts(3);

  const featuredPost = featuredPosts[0] || posts[0];

  return (
    <div className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>Welcome to Evergreen</span>
            <h1 className={styles.heroTitle}>Stories &amp; Insights.</h1>
            <p className={styles.heroSubtitle}>
              A curated collection of thoughts on design, technology, and the slow art of living well.
            </p>
            <div className={styles.heroActions}>
              <Link href="/blog" className={styles.primaryBtn}>
                Explore Articles
              </Link>
              <Link href="/about" className={styles.secondaryBtn}>
                About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className={`${styles.section} container`}>
          <div className={styles.featured}>
            <div className={styles.featuredImage}>
              {featuredPost.image ? (
                <img src={featuredPost.image} alt={featuredPost.title} />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <span>Featured</span>
                </div>
              )}
            </div>
            <div className={styles.featuredContent}>
              <span className={styles.featuredLabel}>Featured Article</span>
              <h2 className={styles.featuredTitle}>
                <Link href={`/blog/${featuredPost.slug}`}>
                  {featuredPost.title}
                </Link>
              </h2>
              <p className={styles.featuredExcerpt}>
                {featuredPost.excerpt}
              </p>
              <div className={styles.featuredMeta}>
                <span>{featuredPost.category}</span>
                <span>•</span>
                <span>{featuredPost.date}</span>
              </div>
              <Link href={`/blog/${featuredPost.slug}`} className={styles.readMore}>
                Read Article →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className={styles.categoriesSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Browse by Topic</h2>
            <div className={styles.categories}>
              {categories.slice(0, 6).map(category => (
                <Link
                  href={`/category/${category.slug}`}
                  key={category.id}
                  className={styles.categoryCard}
                >
                  <h3>{category.name}</h3>
                  <span>{category.articleCount || 0} articles</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Posts */}
      <section className={`${styles.section} container`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Latest Posts</h2>
          <Link href="/blog" className={styles.viewAll}>
            View All →
          </Link>
        </div>
        <div className={styles.grid}>
          {posts.map(post => (
            <Card key={post.id} post={post} />
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className={styles.newsletter}>
        <div className="container">
          <div className={styles.newsletterContent}>
            <h2>Stay Updated</h2>
            <p>Get our latest articles delivered straight to your inbox. No spam, just quality content.</p>
            <form className={styles.newsletterForm}>
              <input
                type="email"
                placeholder="Enter your email"
                className={styles.input}
              />
              <button type="submit" className={styles.subscribeBtn}>
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
