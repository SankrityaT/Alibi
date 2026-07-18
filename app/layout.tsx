import type { ReactNode } from 'react'
import { Bebas_Neue, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas'
})

const plexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-plex-mono'
})

export const metadata = {
  title: 'Alibi — a detective game where the suspects actually remember',
  description:
    'A local-first AI noir detective game. Interrogate four suspects with real private memory, dig evidence, and catch the one who rewrote someone\'s memory. 100% on your machine.'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${bebas.variable} ${plexMono.variable}`}>
      <body>
        <div className="grain-overlay" aria-hidden="true" />
        <div className="vignette-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
