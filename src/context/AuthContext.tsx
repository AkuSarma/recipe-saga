
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth as firebaseAuthInstance } from '@/lib/firebase/config'; // Renamed to avoid conflict
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    // Check if firebaseAuthInstance is initialized
    if (!firebaseAuthInstance) {
      console.error("Firebase auth is not initialized. Cannot set up onAuthStateChanged listener.");
      setLoading(false); // Stop loading, user will remain null
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuthInstance, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array: runs once on mount and cleans up on unmount

  const logout = async () => {
    if (!firebaseAuthInstance) {
      toast({ title: 'Logout Failed', description: 'Firebase not initialized.', variant: 'destructive' });
      return;
    }
    try {
      await firebaseSignOut(firebaseAuthInstance);
      toast({ title: 'Logged out successfully.' });
      router.push('/'); // Redirect to home page after logout
    } catch (error) {
      console.error("Error logging out:", error);
      toast({ title: 'Logout Failed', description: (error as Error).message, variant: 'destructive' });
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
