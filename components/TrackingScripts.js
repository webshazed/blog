"use client";

import Script from 'next/script';

/**
 * TrackingScripts - Injects all tracking codes into the page
 * Rendered client-side for proper script loading
 */
export default function TrackingScripts({ settings }) {
    if (!settings) return null;

    const {
        googleAnalyticsId,
        metaPixelId,
        adsensePublisherId,
        customBodyCode,
    } = settings;

    return (
        <>
            {/* Google Analytics */}
            {googleAnalyticsId && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${googleAnalyticsId}');
                        `}
                    </Script>
                </>
            )}

            {/* Meta Pixel */}
            {metaPixelId && (
                <Script id="meta-pixel" strategy="afterInteractive">
                    {`
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${metaPixelId}');
                        fbq('track', 'PageView');
                    `}
                </Script>
            )}

            {/* Google AdSense */}
            {adsensePublisherId && (
                <Script
                    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}`}
                    strategy="afterInteractive"
                    crossOrigin="anonymous"
                />
            )}

            {/* Custom Body Code */}
            {customBodyCode && (
                <div dangerouslySetInnerHTML={{ __html: customBodyCode }} />
            )}
        </>
    );
}
