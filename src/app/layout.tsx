import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TestMark - Automated Bookmark Testing',
  description: 'TestMark automatically tests your bookmarked URLs and alerts you when they break. Perfect for developers, QA engineers, and site owners.',
  keywords: 'bookmark testing, URL monitoring, broken links, website monitoring, QA tools',
  authors: [{ name: 'TestMark' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'TestMark - Automated Bookmark Testing',
    description: 'Never let a broken bookmark slow down your workflow again.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TestMark - Automated Bookmark Testing',
    description: 'Never let a broken bookmark slow down your workflow again.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  )
}