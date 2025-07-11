import React, { useState, useEffect } from 'react';
import { SidebarMenu } from '@/components/ui/sidebar-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const GlobalHeader = () => {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      setUserProfile(data);
    };

    fetchProfile();
  }, [user]);

  const getDisplayName = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name.split(' ')[0]; // First name only
    }
    return user?.email || '';
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <SidebarMenu />
      <header className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4">
        <div className="flex items-center gap-3 ml-12">
          <h1 className="text-xl font-bold text-blue-900">AptEval</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User className="h-4 w-4" />
            <span>{getDisplayName()}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-gray-700 hover:text-red-600 hover:bg-red-50 p-2"
            title="Logga ut"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
    </>
  );
};