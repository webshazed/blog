import './globals.css';
import { Outfit, Merriweather } from 'next/font/google';

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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${merriweather.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
