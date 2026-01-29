import { Inter } from 'next/font/google'
import './globals.css'
import NavigationStateManager from '../components/loading/NavigationStateManager'
import { Suspense } from 'react'
import LoadingSpinner from '../components/loading/LoadingSpinner'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Pen Pal Magic App',
  description: 'To connect 2000 rural Ugandan Children to the World',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <Suspense fallback={<LoadingSpinner />}>
          <NavigationStateManager />
          {children}
        </Suspense>          
      </body>
    </html>
  )
}
