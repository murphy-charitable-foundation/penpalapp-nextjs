import { Inter } from 'next/font/google'
import './globals.css'
import NavigationStateManager from '../components/loading/NavigationStateManager'
import { Suspense } from 'react'
import LoadingSpinner from '../components/loading/LoadingSpinner'

import { CachedUsersProvider } from './contexts/CachedUserContext'
import { DormantLetterboxProvider } from '../context/DormantLetterboxContext'
import { UserProvider } from '../contexts/UserContext'
import { NavigationProvider } from '../contexts/NavigationContext'
import { CachedUserLoginsProvider } from './contexts/CachedUserLoginContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'Pen Pal Magic App',
    template: '%s | Pen Pal Magic App',
  },
  description: 'To connect 2000 rural Ugandan Children to the World',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <DormantLetterboxProvider>
          <CachedUserLoginsProvider>
            <UserProvider>
              <NavigationProvider>
                <Suspense fallback={<LoadingSpinner />}>
                  <NavigationStateManager />
                  {children}
                </Suspense>
              </NavigationProvider>
            </UserProvider>      
          </CachedUserLoginsProvider> 
        </DormantLetterboxProvider>
      </body>
    </html>
  )
}