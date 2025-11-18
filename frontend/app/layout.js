// Explicit viewport settings (must be one of the first exports)
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { Manrope } from 'next/font/google';
import './globals.css';

// Google font setup
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-manrope',
});

export const metadata = {
  title: 'DejaView - Your memories, rediscovered.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${manrope.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
