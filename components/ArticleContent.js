"use client";
import AdUnit from '@/components/AdUnit';
import { injectAdPlaceholders } from '@/lib/ad-injector';
import styles from './ArticleContent.module.css';

/**
 * ArticleContent - Client component that renders article HTML with auto-injected ads
 */
export default function ArticleContent({ htmlContent, adSettings }) {
    // If ads disabled or no content, render normally
    if (!adSettings?.enabled || !adSettings?.publisherId || !htmlContent) {
        return (
            <div
                className={styles.content}
                dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
            />
        );
    }

    // Inject ad placeholders
    const parts = injectAdPlaceholders(htmlContent, adSettings.paragraphInterval || 3);

    return (
        <div className={styles.content}>
            {parts.map((part, index) => {
                if (part.type === 'ad') {
                    return (
                        <AdUnit
                            key={part.id}
                            publisherId={adSettings.publisherId}
                            adSlot={adSettings.adSlot}
                            adFormat={adSettings.adFormat}
                            customScript={adSettings.customScript}
                        />
                    );
                }
                return (
                    <div
                        key={`content-${index}`}
                        dangerouslySetInnerHTML={{ __html: part.content }}
                    />
                );
            })}
        </div>
    );
}
