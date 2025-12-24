'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './SearchOverlay.module.css';

export default function SearchOverlay({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Live Search Logic (Debounced)
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const debounceTimer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                setResults(data.articles || []);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.container} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.searchBox}>
                        <svg className={styles.searchIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type to search kitchen algorithms..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className={styles.input}
                        />
                        {query && (
                            <button className={styles.clearBtn} onClick={() => setQuery('')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        ESC
                    </button>
                </div>

                <div className={styles.content}>
                    {isLoading ? (
                        <div className={styles.status}>Searching for clarity...</div>
                    ) : results.length > 0 ? (
                        <div className={styles.results}>
                            <h3 className={styles.resultHeading}>DISCOVERIES:</h3>
                            {results.map((article) => (
                                <Link
                                    key={article.slug}
                                    href={`/blog/${article.slug}`}
                                    className={styles.resultItem}
                                    onClick={onClose}
                                >
                                    <div className={styles.resultInfo}>
                                        <span className={styles.resultCategory}>{article.category?.name || 'Article'}</span>
                                        <h4 className={styles.resultTitle}>{article.title}</h4>
                                    </div>
                                    <svg className={styles.arrowIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className={styles.status}>No algorithms found for "{query}". Try another query.</div>
                    ) : (
                        <div className={styles.status}>Start typing to see magic happen.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
