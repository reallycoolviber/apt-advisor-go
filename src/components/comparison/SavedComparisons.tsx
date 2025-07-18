import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bookmark, Trash2, Calendar, Scale } from 'lucide-react';

interface SavedComparison {
  id: string;
  name: string;
  selected_evaluations: string[];
  selected_fields: string[];
  created_at: string;
}

interface SavedComparisonsProps {
  onLoadComparison: (comparison: SavedComparison) => void;
}

export const SavedComparisons: React.FC<SavedComparisonsProps> = ({
  onLoadComparison
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedComparisons();
  }, [user]);

  const fetchSavedComparisons = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_comparisons')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedComparisons(data || []);
    } catch (err) {
      console.error('Error fetching saved comparisons:', err);
      toast({
        title: "Fel",
        description: "Kunde inte ladda sparade jämförelser. Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteComparison = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_comparisons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedComparisons(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Borttaget",
        description: "Jämförelsen har tagits bort.",
      });
    } catch (err) {
      console.error('Error deleting comparison:', err);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort jämförelsen. Försök igen senare.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-card shadow-lg border-0 p-6">
        <div className="text-center text-muted-foreground">
          Laddar sparade jämförelser...
        </div>
      </Card>
    );
  }

  if (savedComparisons.length === 0) {
    return (
      <Card className="bg-card shadow-lg border-0 p-6 text-center">
        <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Inga sparade jämförelser
        </h3>
        <p className="text-muted-foreground">
          Du har inga sparade jämförelser än. Skapa en ny jämförelse och spara den för att komma åt den här.
        </p>
      </Card>
    );
  }

  return (
    <Card className="bg-card shadow-lg border-0 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bookmark className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">
          Sparade jämförelser
        </h2>
      </div>
      <p className="text-muted-foreground mb-6">
        Klicka på en jämförelse för att ladda den.
      </p>

      <div className="space-y-3">
        {savedComparisons.map((comparison) => (
          <div
            key={comparison.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
          >
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => onLoadComparison(comparison)}
            >
              <h3 className="font-semibold text-foreground mb-1">
                {comparison.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(comparison.created_at).toLocaleDateString('sv-SE')}
                </div>
                <div className="flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  {comparison.selected_evaluations.length} lägenheter
                </div>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ta bort jämförelse</AlertDialogTitle>
                  <AlertDialogDescription>
                    Är du säker på att du vill ta bort jämförelsen "{comparison.name}"? 
                    Detta går inte att ångra.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteComparison(comparison.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Ta bort
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>
    </Card>
  );
};