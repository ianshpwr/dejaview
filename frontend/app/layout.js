export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-manrope',
  display: "swap",
  preload: true,
});

export const metadata = {
  title: 'DejaView - Your memories, rediscovered.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${manrope.className} antialiased overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
