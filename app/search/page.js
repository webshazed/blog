import styles from './search.module.css';
import Card from '@/components/UI/Card';
import Pagination from '@/components/UI/Pagination';
import { searchPosts } from '@/lib/data';
import Link from 'next/link';

export const metadata = {
    title: 'Search | Kitchen Algo',
    description: 'Search articles on Kitchen Algo.',
};

export default function SearchPage() {
    return (
        <div className={styles.searchPage}>
            <section className={styles.header}>
                <div className="container">
                    <h1 className={styles.title}>Search</h1>
                    <form action="/search" method="GET" className={styles.searchForm}>
                        <input
                            type="text"
                            name="q"
                            placeholder="Search articles..."
                            className={styles.searchInput}
                            autoFocus
                        />
                        <button type="submit" className={styles.searchBtn}>
                            Search
                        </button>
                    </form>
                </div>
            </section>

            <section className={`${styles.content} container`}>
                <div className={styles.empty}>
                    <p>Enter a keyword to search (Static Mode).</p>
                    <p><em>Note: Full dynamic search is disabled in static export.</em></p>
                </div>
            </section>
        </div>
    );
}
