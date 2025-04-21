'use client';

import { ConfirmProvider } from './ConfirmProvider';
import { LoadingProvider } from './LoadingProvider';
import { AlertProvider } from './AlertProvider';


export function Providers({ children}) {
  return (
    <ConfirmProvider>
      <LoadingProvider>
        <AlertProvider>
        {children}
        </AlertProvider>
      </LoadingProvider>
    </ConfirmProvider>
  );
}
