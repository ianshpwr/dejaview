import { Manrope } from 'next/font/google';
import './globals.css'; // Your global Tailwind styles

// Setup the font
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-manrope', // Optional: if you want to use it as a CSS variable
});

// Setup the page title and metadata
export const metadata = {
  title: 'DejaView - Your memories, rediscovered.',
  // You can add description, openGraph, etc. here
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Apply the font to the entire body */}
      <body className={`${manrope.className} antialiased`}>{children}</body>
    </html>
  );
}