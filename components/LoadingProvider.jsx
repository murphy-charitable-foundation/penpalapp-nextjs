'use client';

import { createContext, useContext, useState } from 'react';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loading, setLoadingInternal] = useState(false);
  const [message, setMessage] = useState('');

  const setLoading = (value, customMessage = '') => {
    setLoadingInternal(value);
    setMessage(value ? customMessage : '');
  };

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}

      {loading && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center flex-col space-y-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          {message && (
            <div className="text-white text-lg font-medium text-center px-4">
              {message}
            </div>
          )}
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
