"use client";
import { useEffect, useRef } from 'react';
import styles from './AdUnit.module.css';

/**
 * Google AdSense Ad Unit Component
 * Renders an in-article ad with proper initialization
 */
export default function AdUnit({
    publisherId,
    adSlot,
    adFormat = 'auto',
    customScript = null
}) {
    const adRef = useRef(null);
    const isLoaded = useRef(false);

    useEffect(() => {
        // If custom script provided, use a simple div
        if (customScript) return;

        // Only load AdSense once
        if (isLoaded.current) return;

        // Push ad to AdSense
        try {
            if (typeof window !== 'undefined' && window.adsbygoogle) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                isLoaded.current = true;
            }
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }, [customScript]);

    // If custom script is provided, render it
    if (customScript) {
        return (
            <div
                className={styles.adContainer}
                dangerouslySetInnerHTML={{ __html: customScript }}
            />
        );
    }

    // Standard AdSense unit
    if (!publisherId || !adSlot) {
        return null;
    }

    return (
        <div className={styles.adContainer}>
            <span className={styles.adLabel}>Advertisement</span>
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: 'block', textAlign: 'center' }}
                data-ad-client={publisherId}
                data-ad-slot={adSlot}
                data-ad-format={adFormat}
                data-full-width-responsive="true"
            />
        </div>
    );
}
