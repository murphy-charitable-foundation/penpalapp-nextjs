import { Inter } from 'next/font/google'
import './globals.css'
import NavigationStateManager from '../components/loading/NavigationStateManager'
import { Suspense } from 'react'
import LoadingSpinner from '../components/loading/LoadingSpinner'
import { DormantLetterboxProvider } from '../context/DormantLetterboxContext';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'Pen Pal Magic',
    template: '%s · Pen Pal Magic',
  },
  description: 'To connect 2000 rural Ugandan Children to the World',
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <DormantLetterboxProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <NavigationStateManager />
          {children}
        </Suspense>          
      </DormantLetterboxProvider>
      </body>
    </html>
  )
}
