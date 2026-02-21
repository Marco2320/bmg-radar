import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { MOCK_USERS } from '@/lib/store';

interface AuthContextType {
  user: User;
  switchUser: (userId: string) => void;
  isAR: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);

  const switchUser = useCallback((userId: string) => {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) setCurrentUser(user);
  }, []);

  return (
    <AuthContext.Provider value={{ user: currentUser, switchUser, isAR: currentUser.role === 'ar' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
