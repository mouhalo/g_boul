'use client';

import { useContext, useEffect, useState } from 'react';
import { UserContext, User } from '@/app/contexts/UserContext';

export function useCurrentUser() {
  const { user, setUser } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get user from localStorage on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser && !user) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, [user, setUser]);

  return { user, isLoading };
}
