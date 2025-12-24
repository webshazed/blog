import './globals.css';
import { Open_Sans } from 'next/font/google';
import { getSiteSettings } from '@/lib/strapi';
import TrackingScripts from '@/components/TrackingScripts';

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
});

const SITE_URL = process.env.SITE_URL || 'https://kitchenalgo.com';
const SITE_NAME = process.env.SITE_NAME || 'Kitchen Algo';

export const metadata = {
  title: {
    default: `${SITE_NAME} | Deciphering the Art of Cooking`,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'Master the science of the kitchen with data-driven recipes, essential techniques, and algorithm-based cooking guides.',
  keywords: ['food blog', 'recipes', 'kitchen science', 'cooking techniques', 'kitchen algo'],
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
    title: `${SITE_NAME} | Deciphering the Art of Cooking`,
    description: 'Master the science of the kitchen with data-driven recipes, essential techniques, and algorithm-based cooking guides.',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Science of Cooking`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | Deciphering the Art of Cooking`,
    description: 'Master the science of the kitchen with data-driven recipes, essential techniques, and algorithm-based cooking guides.',
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
    <html lang="en" className={openSans.variable}>
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

