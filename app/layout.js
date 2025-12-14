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

export const metadata = {
  title: 'Evergreen | Modern Blog',
  description: 'A beautiful, timeless space for thoughts and stories.',
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
