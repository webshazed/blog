import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={`${styles.content} container`}>
                {/* Main Footer Grid */}
                <div className={styles.grid}>
                    {/* Brand */}
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            <img src="/logo.png" alt="Kitchen Algo" className={styles.footerLogoImg} />
                        </Link>
                        <p className={styles.tagline}>
                            Deciphering the science of cooking through data-driven recipes and kitchen algorithms.
                        </p>
                        <div className={styles.socials}>
                            <a href="https://instagram.com/kitchenalgo" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Instagram">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                            <a href="https://facebook.com/kitchenalgorithm" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Facebook">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                                </svg>
                            </a>
                            <a href="https://pinterest.com/kitchenalgo" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Pinterest">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.992 3.995-.283 1.195.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.65 0-5.789 2.733-5.789 5.543 0 1.099.423 2.279.953 2.922.105.127.12.239.089.373-.096.398-.313 1.285-.355 1.467-.056.236-.2.285-.463.172-1.728-.799-2.808-3.32-2.808-5.328 0-4.328 3.155-8.313 9.098-8.313 4.776 0 8.487 3.404 8.487 7.944 0 4.741-2.993 8.558-7.146 8.558-1.396 0-2.709-.724-3.159-1.58l-.859 3.282c-.313 1.197-1.164 2.684-1.745 3.597 1.32.408 2.738.63 4.223.63 6.627 0 12-5.373 12-12 0-6.628-5.372-12-12-12z" />
                                </svg>
                            </a>
                            <a href="/feed.xml" className={styles.socialIcon} aria-label="RSS">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className={styles.column}>
                        <h4 className={styles.columnTitle}>Company</h4>
                        <ul className={styles.linkList}>
                            <li><Link href="/about">About Us</Link></li>
                            <li><Link href="/contact">Contact Us</Link></li>
                            <li><Link href="/advertising">Advertising</Link></li>
                            <li><Link href="/dmca">DMCA Policy</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className={styles.column}>
                        <h4 className={styles.columnTitle}>Legal</h4>
                        <ul className={styles.linkList}>
                            <li><Link href="/privacy">Privacy Policy</Link></li>
                            <li><Link href="/terms">Terms & Conditions</Link></li>
                            <li><Link href="/disclaimer">Disclaimer</Link></li>
                            <li><Link href="/affiliate-disclosure">Affiliate Disclosure</Link></li>
                            <li><Link href="/cookies">Cookie Policy</Link></li>
                            <li><Link href="/accessibility">Accessibility</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className={`${styles.column} ${styles.newsletter}`}>
                        <h4 className={styles.columnTitle}>Newsletter</h4>
                        <p className={styles.newsletterText}>
                            Get our latest posts delivered to your inbox.
                        </p>
                        <form className={styles.newsletterForm}>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                className={styles.input}
                            />
                            <button type="submit" className={styles.button}>
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className={styles.bottom}>
                    <p className={styles.copyright}>
                        © {new Date().getFullYear()} Kitchen Algo. All rights reserved.
                    </p>
                    <div className={styles.legal}>
                        <span>Data-Driven Excellence</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
