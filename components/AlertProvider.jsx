'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'success', duration = 3000) => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, duration);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      {alert && (
        <div
          className={`
            fixed top-5 left-1/2 -translate-x-1/2 z-50
            px-4 py-2 rounded-lg text-white shadow-lg transition-all
            bg-black text-sm max-w-[90vw] inline-block whitespace-pre-line text-center
            ${alert.type === 'success' ? 'bg-green-600' : ''}
            ${alert.type === 'error' ? 'bg-red-600' : ''}
            ${alert.type === 'info' ? 'bg-blue-600' : ''}
          `}
        >
          {alert.message}
        </div>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
