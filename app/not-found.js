import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
    return (
        <div className={styles.notFound}>
            <div className={styles.content}>
                <h1 className={styles.code}>404</h1>
                <h2 className={styles.title}>Page Not Found</h2>
                <p className={styles.message}>
                    Oops! The page you're looking for doesn't exist or has been moved.
                </p>
                <div className={styles.actions}>
                    <Link href="/" className={styles.primaryBtn}>
                        Go Home
                    </Link>
                    <Link href="/blog" className={styles.secondaryBtn}>
                        Browse Articles
                    </Link>
                </div>
            </div>
        </div>
    );
}
