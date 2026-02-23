import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { useUsers } from '@/hooks/use-api';

interface AuthContextType {
  user: User;
  users: User[];
  switchUser: (userId: string) => void;
  isAR: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: users = [], isLoading } = useUsers();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Set the first user once users load
  useEffect(() => {
    if (users.length > 0 && !currentUser) {
      setCurrentUser(users[0]);
    }
  }, [users, currentUser]);

  const switchUser = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) setCurrentUser(user);
  }, [users]);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: currentUser, users, switchUser, isAR: currentUser.role === 'ar', isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
