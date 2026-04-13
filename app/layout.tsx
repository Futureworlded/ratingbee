import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RatingBee — Real Reviews from Real People',
  description: 'Find trusted local businesses with verified human reviews. RatingBee amplifies authentic customer voices across the web.',
  keywords: 'local business reviews, restaurant reviews, verified reviews, local directory',
  openGraph: {
    title: 'RatingBee — Real Reviews from Real People',
    description: 'Find trusted local businesses with verified human reviews.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
