import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'

export const metadata: Metadata = {
  title: 'Tastebook',
  description: 'Tastebook',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Tastebook' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E8E6DF' },
    { media: '(prefers-color-scheme: dark)', color: '#10131A' },
  ],
}

// No webfonts by design — the type stack is entirely iOS-resident, so there is
// nothing to preconnect to and nothing to lay out twice.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
