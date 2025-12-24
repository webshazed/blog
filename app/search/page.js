import styles from './search.module.css';
import Card from '@/components/UI/Card';
import Pagination from '@/components/UI/Pagination';
import { searchPosts } from '@/lib/data';
import Link from 'next/link';

export const metadata = {
    title: 'Search | Kitchen Algo',
    description: 'Search articles on Kitchen Algo.',
};

export default async function SearchPage({ searchParams }) {
    const params = await searchParams;
    const query = params?.q || '';
    const page = parseInt(params?.page) || 1;

    let results = { articles: [], pagination: { page: 1, pageSize: 10, total: 0 } };

    if (query) {
        results = await searchPosts(query, page, 9);
    }

    return (
        <div className={styles.searchPage}>
            {/* Search Header */}
            <section className={styles.header}>
                <div className="container">
                    <h1 className={styles.title}>Search</h1>
                    <form action="/search" method="GET" className={styles.searchForm}>
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
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

            {/* Results */}
            <section className={`${styles.content} container`}>
                {query ? (
                    <>
                        <p className={styles.resultsInfo}>
                            {results.pagination.total} result{results.pagination.total !== 1 ? 's' : ''} for "{query}"
                        </p>

                        {results.articles.length === 0 ? (
                            <div className={styles.empty}>
                                <h2>No results found</h2>
                                <p>Try searching with different keywords.</p>
                                <Link href="/blog" className={styles.browseLink}>
                                    Browse all articles →
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className={styles.grid}>
                                    {results.articles.map(post => (
                                        <Card key={post.id} post={post} />
                                    ))}
                                </div>

                                <Pagination
                                    currentPage={results.pagination.page}
                                    totalPages={Math.ceil(results.pagination.total / results.pagination.pageSize)}
                                    basePath={`/search?q=${encodeURIComponent(query)}`}
                                />
                            </>
                        )}
                    </>
                ) : (
                    <div className={styles.empty}>
                        <h2>Enter a search term</h2>
                        <p>Type something to search our articles.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
