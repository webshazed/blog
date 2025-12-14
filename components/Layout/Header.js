'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './Header.module.css';

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className={styles.header}>
            <nav className={`${styles.nav} container`}>
                <Link href="/" className={styles.logo}>
                    Evergreen<span>.</span>
                </Link>

                {/* Desktop Navigation */}
                <ul className={styles.links}>
                    <li><Link href="/" className={styles.link}>Home</Link></li>
                    <li><Link href="/blog" className={styles.link}>Blog</Link></li>
                    <li><Link href="/about" className={styles.link}>About</Link></li>
                    <li><Link href="/contact" className={styles.link}>Contact</Link></li>
                </ul>

                <div className={styles.actions}>
                    {/* Search Button */}
                    <Link href="/search" className={styles.searchBtn} aria-label="Search">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                    </Link>

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
                        <li><Link href="/search" onClick={() => setMobileMenuOpen(false)}>Search</Link></li>
                    </ul>
                </div>
            </nav>
        </header>
    );
}
