import './globals.css';
import { Open_Sans } from 'next/font/google';
import { getSiteSettings } from '@/lib/data';
import TrackingScripts from '@/components/TrackingScripts';

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
});

const SITE_URL = process.env.SITE_URL || 'https://www.kitchenalgo.com';
const SITE_NAME = process.env.SITE_NAME || 'Kitchen Algo';

export async function generateMetadata() {
  const siteSettings = await getSiteSettings();
  const SITE_NAME = siteSettings?.siteName || 'Kitchen Algo';
  const SITE_DESCRIPTION = siteSettings?.siteDescription || 'Master the science of the kitchen with data-driven recipes, essential techniques, and algorithm-based cooking guides.';

  return {
    title: {
      default: `${SITE_NAME} | Deciphering the Art of Cooking`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
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
    verification: {
      google: siteSettings?.googleSearchConsoleCode || '',
      other: {
        'msvalidate.01': siteSettings?.bingVerificationCode?.match(/content="([^"]+)"/)?.[1] || siteSettings?.bingVerificationCode || '',
      }
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: SITE_URL,
      siteName: SITE_NAME,
      title: `${SITE_NAME} | Deciphering the Art of Cooking`,
      description: SITE_DESCRIPTION,
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
      description: SITE_DESCRIPTION,
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
}

import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

export default async function RootLayout({ children }) {
  // Fetch site settings (tracking codes, etc.)
  const siteSettings = await getSiteSettings();

  return (
    <html lang="en" className={openSans.variable}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />

        {/* Tracking Scripts (GA, Pixel, AdSense) */}
        <TrackingScripts settings={siteSettings} />

        {/* Custom Head Code - Injected via helper or Script component */}
        {siteSettings?.customHeadCode && (
          <div
            id="custom-head-injection"
            hidden
            dangerouslySetInnerHTML={{
              __html: siteSettings.customHeadCode
            }}
          />
        )}
      </body>
    </html>
  );
}

