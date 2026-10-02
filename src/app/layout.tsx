import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'

// Self-hosted variable fonts (SIL OFL, licences alongside the files). Bundled at
// build time, so there is no request to Google from the build or the phone.
const fraunces = localFont({
  src: [
    { path: './fonts/Fraunces-Variable.woff2', style: 'normal', weight: '100 900' },
    { path: './fonts/Fraunces-Italic-Variable.woff2', style: 'italic', weight: '100 900' },
  ],
  variable: '--font-fraunces',
  display: 'swap',
})

const geist = localFont({
  src: './fonts/Geist-Variable.woff2',
  weight: '100 900',
  variable: '--font-geist',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tastebook',
  description: 'The places we want to eat at, and the ones we have.',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Tastebook' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F1EA' },
    { media: '(prefers-color-scheme: dark)', color: '#15110E' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
