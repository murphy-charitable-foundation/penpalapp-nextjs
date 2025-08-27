'use client';

import { ConfirmProvider } from './ConfirmProvider';
import { LoadingProvider } from './LoadingProvider';
import { AlertProvider } from './AlertProvider';


export function Providers({ children: content}) {
  return (
    <ConfirmProvider>
      <LoadingProvider>
        <AlertProvider>
        {content}
        </AlertProvider>
      </LoadingProvider>
    </ConfirmProvider>
  );
}
