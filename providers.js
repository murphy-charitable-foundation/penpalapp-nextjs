'use client';

import { UserDataProvider } from './context/UserDataContext';

export function Providers({ children }) {
  return (
    <UserDataProvider>
      {children}
    </UserDataProvider>
  );
}