import Link from 'next/link';
import styles from './Pagination.module.css';

export default function Pagination({ currentPage, totalPages, basePath }) {
    if (totalPages <= 1) return null;

    const pages = [];
    const showPages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage + 1 < showPages) {
        startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <nav className={styles.pagination} aria-label="Pagination">
            {/* Previous */}
            {currentPage > 1 ? (
                <Link
                    href={`${basePath}?page=${currentPage - 1}`}
                    className={styles.arrow}
                    aria-label="Previous page"
                >
                    ← Prev
                </Link>
            ) : (
                <span className={`${styles.arrow} ${styles.disabled}`}>← Prev</span>
            )}

            {/* First page */}
            {startPage > 1 && (
                <>
                    <Link href={`${basePath}?page=1`} className={styles.page}>1</Link>
                    {startPage > 2 && <span className={styles.ellipsis}>...</span>}
                </>
            )}

            {/* Page numbers */}
            {pages.map(page => (
                <Link
                    key={page}
                    href={`${basePath}?page=${page}`}
                    className={`${styles.page} ${page === currentPage ? styles.active : ''}`}
                    aria-current={page === currentPage ? 'page' : undefined}
                >
                    {page}
                </Link>
            ))}

            {/* Last page */}
            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className={styles.ellipsis}>...</span>}
                    <Link href={`${basePath}?page=${totalPages}`} className={styles.page}>
                        {totalPages}
                    </Link>
                </>
            )}

            {/* Next */}
            {currentPage < totalPages ? (
                <Link
                    href={`${basePath}?page=${currentPage + 1}`}
                    className={styles.arrow}
                    aria-label="Next page"
                >
                    Next →
                </Link>
            ) : (
                <span className={`${styles.arrow} ${styles.disabled}`}>Next →</span>
            )}
        </nav>
    );
}
