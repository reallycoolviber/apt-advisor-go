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
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.log('Profile fetch error:', error);
          // Don't set profile if there's an error - will fall back to email
          return;
        }
        
        setUserProfile(data);
      } catch (err) {
        console.log('Profile fetch exception:', err);
      }
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
      <header className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 px-4">
        <div className="flex items-center gap-3 ml-12">
          <h1 className="text-xl font-bold text-accent">AptEval</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{getDisplayName()}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2"
            title="Logga ut"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
    </>
  );
};