'use client';

import { createContext, useContext, useState } from 'react';

const UserDataContext = createContext();

export const UserDataProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    uid: '',
    photoUri: '',
    country: '',
    user_type: '',
    birthday: '',
    village: '',
    bio: '',
    education_level: '',
    is_orphan: false,
    guardian: '',
    dream_job: '',
    hobby: '',
    favorite_color: ''
  });

  return (
    <UserDataContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserDataContext.Provider>
  );
};


export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};