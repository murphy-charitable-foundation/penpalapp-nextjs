'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from "@/components/general/Button";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('Confirm Action');
  const [resolvePromise, setResolvePromise] = useState(null);

  const confirm = useCallback((msg, ttl = 'Confirm Action') => {
    setMessage(msg);
    setTitle(ttl);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleCancel = () => {
    setIsOpen(false);
    resolvePromise?.(false);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolvePromise?.(true);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <h2 className="text-lg font-semibold mb-4">{title}</h2>
              <p className="text-gray-700 mb-6">{message}</p>
              <div className="flex justify-end gap-3">
                <Button
                  btnText="Cancel"
                  color="bg-gray-200"
                  hoverColor="hover:bg-gray-300"
                  textColor="text-white"
                  rounded="rounded-lg"
                  size="w-24"
                  onClick={handleCancel}
                />
                <Button
                  btnText="Confirm"
                  color="bg-green-700"
                  hoverColor="hover:bg-green-800"
                  textColor="text-white"
                  rounded="rounded-lg"
                  size="w-24"
                  onClick={handleConfirm}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
  return context;
}
