//created by kinjal
import { Silkscreen, Press_Start_2P } from 'next/font/google'

export const pixelFont = Silkscreen({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
})

export const pressStart = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press',
  display: 'swap',
})
