// src/hooks/useAuth.ts
'use client';

import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { UserContext } from '../contexts/UserContext';

export function useAuth() {
 const router = useRouter();
 const { setUser } = useContext(UserContext);

 const handleLogout = () => {
   setUser(null);
   localStorage.removeItem('user');
   router.push('/');
 };

 return { handleLogout };
}

