
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth as firebaseAuthInstance } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { toast, Bounce } from 'react-toastify';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!firebaseAuthInstance) {
      console.error("Firebase auth is not initialized. Cannot set up onAuthStateChanged listener.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuthInstance, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if (!firebaseAuthInstance) {
      toast.error('Logout Failed: Firebase not initialized.', {
        position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: false, pauseOnHover: true, draggable: true, progress: undefined, theme: "light", transition: Bounce,
      });
      return;
    }
    try {
      await firebaseSignOut(firebaseAuthInstance);
      toast.success('Logged out successfully.', {
        position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: false, pauseOnHover: true, draggable: true, progress: undefined, theme: "light", transition: Bounce,
      });
      router.push('/');
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error(`Logout Failed: ${(error as Error).message}`, {
        position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: false, pauseOnHover: true, draggable: true, progress: undefined, theme: "light", transition: Bounce,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
