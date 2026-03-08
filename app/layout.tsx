import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kitten Soup — LinkedIn Analyzer',
  description: 'Get your LinkedIn roasted by cats.',
  openGraph: {
    title: 'Kitten Soup — LinkedIn Analyzer',
    description: 'Get your LinkedIn roasted by cats.',
    url: 'https://kittensoup.com',
    siteName: 'Kitten Soup',
    images: [
      {
        url: 'https://kittensoup.com/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kitten Soup — LinkedIn Analyzer',
    description: 'Get your LinkedIn roasted by cats.',
    images: ['https://kittensoup.com/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
