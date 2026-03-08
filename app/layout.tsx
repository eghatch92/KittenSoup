import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kitten Soup',
  description: 'Chaotic kitten energy for LinkedIn page recommendations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
