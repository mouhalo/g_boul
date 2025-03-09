'use client';

import { ReactNode, useEffect, useState } from 'react';
import { UserContext, User } from '../contexts/UserContext';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        console.log('=== UserProvider: Loaded user from localStorage ===');
        console.log('User:', JSON.stringify(parsedUser, null, 2));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const updateUser = (newUser: User | null) => {
    console.log('=== UserProvider: Updating user ===');
    console.log('New user:', newUser ? JSON.stringify(newUser, null, 2) : 'null');
    setUser(newUser);
  };

  return (
    <UserContext.Provider value={{ user, setUser: updateUser }}>
      {children}
    </UserContext.Provider>
  );
}
