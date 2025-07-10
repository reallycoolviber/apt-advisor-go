import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';


const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    buyer_type: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // If no profile exists, create one
        if (error.code === 'PGRST116') {
          await createProfile();
        } else {
          throw error;
        }
      } else {
        setProfile({
          full_name: data.full_name || '',
          buyer_type: data.buyer_type || '',
          phone: data.phone || '',
          notes: data.notes || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        email: user.email
      }]);

    if (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          buyer_type: profile.buyer_type,
          phone: profile.phone,
          notes: profile.notes
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profil sparad",
        description: "Din profil har uppdaterats framgångsrikt!",
      });
      
      // Navigate to home after successful save
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara profil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-blue-900">Laddar profil...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-blue-800 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <User className="h-6 w-6" />
          <h1 className="text-xl font-bold">Min Profil</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 lg:p-8">
        <Card className="max-w-2xl mx-auto bg-white shadow-lg border-0">
          <div className="p-6 lg:p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">Profilinformation</h2>
              <p className="text-gray-600">Uppdatera din personliga information</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-blue-900 font-medium">
                  E-post
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-1 bg-gray-50"
                />
                <p className="text-sm text-gray-500 mt-1">E-postadressen kan inte ändras</p>
              </div>

              <div>
                <Label htmlFor="full_name" className="text-blue-900 font-medium">
                  Fullständigt namn
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Ditt fullständiga namn"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="buyer_type" className="text-blue-900 font-medium">
                  Roll
                </Label>
                <select
                  id="buyer_type"
                  value={profile.buyer_type}
                  onChange={(e) => setProfile(prev => ({ ...prev, buyer_type: e.target.value }))}
                  className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Välj roll</option>
                  <option value="buyer">Köpare</option>
                  <option value="agent">Mäklare</option>
                  <option value="investor">Investerare</option>
                </select>
              </div>

              <div>
                <Label htmlFor="phone" className="text-blue-900 font-medium">
                  Telefonnummer
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="070-123 45 67"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-blue-900 font-medium">
                  Anteckningar
                </Label>
                <Textarea
                  id="notes"
                  value={profile.notes}
                  onChange={(e) => setProfile(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Eventuella anteckningar eller preferenser..."
                  className="mt-1 min-h-[100px] resize-none"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-medium"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Sparar...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Spara profil
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;