import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Plus, Radio } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, users, switchUser, isAR } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Feed' },
    { to: '/submit', label: 'Submit Artist' },
    ...(isAR ? [{ to: '/analytics', label: 'Analytics' }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bmg-header">
        <div className="container flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-primary-foreground">
              <Radio className="h-5 w-5" />
              BMG Radar
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    location.pathname === item.to
                      ? 'bg-accent text-accent-foreground'
                      : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* User switcher */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-primary-foreground/60 hidden sm:inline">Signed in as:</span>
            <Select value={user.id} onValueChange={switchUser}>
              <SelectTrigger className="w-[180px] h-8 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.role === 'ar' ? 'A&R' : 'Employee'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="md:hidden bmg-header border-t border-primary-foreground/10">
        <div className="container flex gap-1 px-6 py-2">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                location.pathname === item.to
                  ? 'bg-accent text-accent-foreground'
                  : 'text-primary-foreground/80 hover:text-primary-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;
