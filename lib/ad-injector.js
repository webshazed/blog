/**
 * Inject ad placeholders into HTML content after every N paragraphs
 * Returns an array of content parts with ad markers
 */
export function injectAdPlaceholders(htmlContent, interval = 3) {
    if (!htmlContent || interval < 1) return [{ type: 'content', content: htmlContent }];

    // Split content by closing paragraph tags
    const paragraphRegex = /<\/p>/gi;
    const parts = htmlContent.split(paragraphRegex);

    if (parts.length <= interval) {
        // Not enough paragraphs for ads
        return [{ type: 'content', content: htmlContent }];
    }

    const result = [];
    let currentContent = '';
    let paragraphCount = 0;

    parts.forEach((part, index) => {
        if (index < parts.length - 1) {
            // Add the paragraph with its closing tag back
            currentContent += part + '</p>';
            paragraphCount++;

            // Inject ad after every N paragraphs
            if (paragraphCount >= interval && index < parts.length - 2) {
                result.push({ type: 'content', content: currentContent });
                result.push({ type: 'ad', id: `ad-${result.length}` });
                currentContent = '';
                paragraphCount = 0;
            }
        } else {
            // Last part (after final </p> or remaining content)
            currentContent += part;
        }
    });

    // Add remaining content
    if (currentContent.trim()) {
        result.push({ type: 'content', content: currentContent });
    }

    return result;
}

/**
 * Render content parts with ads injected
 * This is a React component helper
 */
export function ContentWithAds({ htmlContent, adSettings, AdComponent }) {
    if (!adSettings?.enabled || !adSettings.publisherId) {
        // No ads, render content normally
        return (
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        );
    }

    const parts = injectAdPlaceholders(htmlContent, adSettings.paragraphInterval || 3);

    return (
        <>
            {parts.map((part, index) => {
                if (part.type === 'ad') {
                    return (
                        <AdComponent
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
        </>
    );
}
