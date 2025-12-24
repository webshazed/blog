"use client";
import AdUnit from '@/components/AdUnit';
import { injectAdPlaceholders } from '@/lib/ad-injector';
import styles from './ArticleContent.module.css';

/**
 * Extract FAQs from JSON-LD schema in content
 */
function extractFAQs(htmlContent) {
    if (!htmlContent) return [];

    // Find FAQPage schema in script tags
    const scriptRegex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    const faqs = [];

    while ((match = scriptRegex.exec(htmlContent)) !== null) {
        try {
            let jsonContent = match[1].trim();

            // Clean up corrupted JSON (internal links were added inside schema)
            // Remove HTML tags that broke the JSON structure
            jsonContent = jsonContent.replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1');

            const schemas = JSON.parse(jsonContent);

            // Handle array of schemas
            const schemaArray = Array.isArray(schemas) ? schemas : [schemas];

            for (const schema of schemaArray) {
                if (schema['@type'] === 'FAQPage' && schema.mainEntity) {
                    for (const item of schema.mainEntity) {
                        if (item['@type'] === 'Question' && item.acceptedAnswer) {
                            faqs.push({
                                question: item.name,
                                answer: item.acceptedAnswer.text
                            });
                        }
                    }
                }
            }
        } catch (e) {
            // JSON parse error, skip this script
            console.warn('Failed to parse FAQ schema:', e);
        }
    }

    return faqs;
}

/**
 * FAQ Accordion Component
 */
function FAQSection({ faqs }) {
    if (!faqs || faqs.length === 0) return null;

    return (
        <div className="faq-section">
            <h3 className="faq-title">Frequently Asked Questions</h3>
            <div className="faq-list">
                {faqs.map((faq, index) => (
                    <details key={index} className="faq-item">
                        <summary className="faq-question">
                            <span className="faq-question-text">{faq.question}</span>
                            <span className="faq-icon">▼</span>
                        </summary>
                        <div className="faq-answer">
                            <p>{faq.answer}</p>
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
}

/**
 * ArticleContent - Client component that renders article HTML with auto-injected ads
 */
export default function ArticleContent({ htmlContent, adSettings }) {
    // Extract FAQs from JSON-LD schema
    const faqs = extractFAQs(htmlContent);

    // If ads disabled or no content, render normally
    if (!adSettings?.enabled || !adSettings?.publisherId || !htmlContent) {
        return (
            <div className={styles.content}>
                <div dangerouslySetInnerHTML={{ __html: htmlContent || '' }} />
                {faqs.length > 0 && <FAQSection faqs={faqs} />}
            </div>
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
            {faqs.length > 0 && <FAQSection faqs={faqs} />}
        </div>
    );
}
