'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './Header.module.css';
import SearchOverlay from '@/components/Search/SearchOverlay';

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <header className={styles.header}>
            <nav className={`${styles.nav} container`}>
                <Link href="/" className={styles.logo}>
                    <img src="/logo.png" alt="Kitchen Algo" className={styles.logoImg} />
                </Link>

                <ul className={styles.links}>
                    <li><Link href="/" className={styles.link}>Home</Link></li>
                    <li><Link href="/blog" className={styles.link}>Blog</Link></li>
                    <li><Link href="/about" className={styles.link}>About</Link></li>
                    <li><Link href="/contact" className={styles.link}>Contact</Link></li>
                </ul>

                <div className={styles.actions}>
                    {/* Search Button Toggle */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className={styles.searchBtn}
                        aria-label="Search"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                    </button>

                    {/* Mobile Menu Button */}
                    <button
                        className={styles.mobileMenuBtn}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={mobileMenuOpen}
                    >
                        <span className={`${styles.hamburger} ${mobileMenuOpen ? styles.open : ''}`}></span>
                    </button>
                </div>

                {/* Mobile Navigation */}
                <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ''}`}>
                    <ul className={styles.mobileLinks}>
                        <li><Link href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link></li>
                        <li><Link href="/blog" onClick={() => setMobileMenuOpen(false)}>Blog</Link></li>
                        <li><Link href="/about" onClick={() => setMobileMenuOpen(false)}>About</Link></li>
                        <li><Link href="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link></li>
                        <li>
                            <button
                                className={styles.mobileSearchBtn}
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    setIsSearchOpen(true);
                                }}
                            >
                                Search
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* Live Search Overlay */}
            <SearchOverlay
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </header>
    );
}
