import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, BarChart3, User, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const menuItems = [
  { path: '/', icon: Home, label: 'Hem' },
  { path: '/evaluate', icon: ClipboardList, label: 'Ny utvärdering' },
  { path: '/evaluations', icon: ClipboardList, label: 'Mina utvärderingar' },
  { path: '/compare', icon: BarChart3, label: 'Jämför' },
  { path: '/profile', icon: User, label: 'Profil' },
];

export const SidebarMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 left-4 z-50 text-white hover:bg-white/20 bg-blue-900/80 backdrop-blur-sm rounded-md p-2 shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full bg-white">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-blue-900">Apt Advisor</h2>
            <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                        isActive(item.path)
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logga ut</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};