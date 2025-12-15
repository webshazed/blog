import './globals.css';
import { Outfit, Merriweather } from 'next/font/google';
import { getSiteSettings } from '@/lib/strapi';
import TrackingScripts from '@/components/TrackingScripts';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const SITE_URL = process.env.SITE_URL || 'https://blog1-roan.vercel.app';
const SITE_NAME = process.env.SITE_NAME || 'Evergreen';

export const metadata = {
  title: {
    default: `${SITE_NAME} | Modern Blog`,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'A beautiful, timeless space for thoughts and stories. Discover insightful articles on technology, lifestyle, and more.',
  keywords: ['blog', 'articles', 'technology', 'lifestyle', 'insights'],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Modern Blog`,
    description: 'A beautiful, timeless space for thoughts and stories.',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} Blog`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | Modern Blog`,
    description: 'A beautiful, timeless space for thoughts and stories.',
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

export default async function RootLayout({ children }) {
  // Fetch site settings (tracking codes, etc.)
  const siteSettings = await getSiteSettings();

  return (
    <html lang="en" className={`${outfit.variable} ${merriweather.variable}`}>
      <head>
        {/* Google Search Console Verification */}
        {siteSettings?.googleSearchConsoleCode && (
          <meta name="google-site-verification" content={siteSettings.googleSearchConsoleCode} />
        )}

        {/* Bing Webmaster Verification */}
        {siteSettings?.bingVerificationCode && (
          <meta name="msvalidate.01" content={siteSettings.bingVerificationCode} />
        )}

        {/* Custom Head Code */}
        {siteSettings?.customHeadCode && (
          <div dangerouslySetInnerHTML={{ __html: siteSettings.customHeadCode }} />
        )}
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />

        {/* Tracking Scripts (GA, Pixel, AdSense) */}
        <TrackingScripts settings={siteSettings} />
      </body>
    </html>
  );
}

