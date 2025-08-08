
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Home, Plus, MapPin, Euro, Star, Calendar, Edit, FileText, Download, Trash2 } from 'lucide-react';
import { formatValue as formatDisplayValue } from '@/utils/formatValue';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { exportToExcel, exportToCSV } from '@/utils/exportUtils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface Evaluation {
  id: string;
  address: string | null;
  size: number | null;
  price: number | null;
  rooms: string | null;
  monthly_fee: number | null;
  planlösning: number | null;
  kitchen: number | null;
  bathroom: number | null;
  bedrooms: number | null;
  surfaces: number | null;
  förvaring: number | null;
  ljusinsläpp: number | null;
  balcony: number | null;
  created_at: string;
  comments: string | null;
  is_draft: boolean | null;
}

const Evaluations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'drafts'>('all');
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('apartment_evaluations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEvaluations(data || []);
      } catch (err) {
        console.error('Error fetching evaluations:', err);
        setError('Kunde inte ladda dina utvärderingar. Försök igen senare.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [user]);

  const calculatePhysicalAverage = (evaluation: Evaluation) => {
    const ratings = [
      evaluation.planlösning,
      evaluation.kitchen,
      evaluation.bathroom,
      evaluation.bedrooms,
      evaluation.surfaces,
      evaluation.förvaring,
      evaluation.ljusinsläpp,
      evaluation.balcony
    ].filter(rating => rating !== null) as number[];
    
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    if (filter === 'completed') return !evaluation.is_draft;
    if (filter === 'drafts') return evaluation.is_draft;
    return true;
  });

  const handleExport = (format: 'excel' | 'csv') => {
    if (format === 'excel') {
      exportToExcel(evaluations as any);
    } else {
      exportToCSV(evaluations as any);
    }
  };

  const handleSelectEvaluation = (evaluationId: string, checked: boolean) => {
    if (checked) {
      setSelectedEvaluations([...selectedEvaluations, evaluationId]);
    } else {
      setSelectedEvaluations(selectedEvaluations.filter(id => id !== evaluationId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvaluations(filteredEvaluations.map(evaluation => evaluation.id));
    } else {
      setSelectedEvaluations([]);
    }
  };

  const handleDeleteSingle = async (evaluationId: string) => {
    try {
      const { error } = await supabase
        .from('apartment_evaluations')
        .delete()
        .eq('id', evaluationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setEvaluations(evaluations.filter(evaluation => evaluation.id !== evaluationId));
      setSelectedEvaluations(selectedEvaluations.filter(id => id !== evaluationId));
      
      toast({
        title: "Utvärdering borttagen",
        description: "Utvärderingen har tagits bort.",
      });
    } catch (err) {
      console.error('Error deleting evaluation:', err);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort utvärderingen. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const { error } = await supabase
        .from('apartment_evaluations')
        .delete()
        .in('id', selectedEvaluations)
        .eq('user_id', user?.id);

      if (error) throw error;

      setEvaluations(evaluations.filter(evaluation => !selectedEvaluations.includes(evaluation.id)));
      const deletedCount = selectedEvaluations.length;
      setSelectedEvaluations([]);
      
      toast({
        title: "Utvärderingar borttagna",
        description: `${deletedCount} utvärdering${deletedCount > 1 ? 'ar' : ''} har tagits bort.`,
      });
    } catch (err) {
      console.error('Error deleting evaluations:', err);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort utvärderingarna. Försök igen.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative">
        {/* Background cityscape */}
        <div className="absolute inset-0 opacity-15 bg-no-repeat bg-center bg-cover"
             style={{ backgroundImage: "url('/src/assets/cityscape-neutral.png')" }}>
        </div>
        <div className="bg-primary text-primary-foreground p-4 shadow-lg relative z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-primary-foreground hover:bg-primary/90 p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-primary-foreground hover:bg-primary/90 p-2"
            >
              <Home className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Mina utvärderingar</h1>
          </div>
        </div>
        <div className="p-4 text-center relative z-10">
          <div className="text-foreground">Laddar dina utvärderingar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background cityscape */}
      <div className="absolute inset-0 opacity-15 bg-no-repeat bg-center bg-cover"
           style={{ backgroundImage: "url('/src/assets/cityscape-neutral.png')" }}>
      </div>
      

      {/* Main Content */}
      <div className="pt-20 pb-8 px-4 relative z-10">
        <div className="max-w-lg mx-auto">
        {error && (
          <Card className="bg-destructive/10 border-destructive/20 p-4 mb-4">
            <p className="text-destructive">{error}</p>
          </Card>
        )}

        {evaluations.length === 0 ? (
          <Card className="bg-card shadow-lg border-0 p-6 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Inga utvärderingar än
            </h2>
            <p className="text-muted-foreground mb-6">
              Du har inte skapat några lägenhetsuvärderingar än. Kom igång genom att skapa din första utvärdering!
            </p>
            <Button
              onClick={() => navigate('/evaluate')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Skapa första utvärderingen
            </Button>
          </Card>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="text-foreground hover:bg-muted p-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-3xl font-bold text-foreground">
                    Mina Utvärderingar
                  </h2>
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {evaluations.length}
                  </span>
                </div>
                
                {/* Selection controls */}
                {filteredEvaluations.length > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedEvaluations.length === filteredEvaluations.length && filteredEvaluations.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
                        Markera alla
                      </label>
                    </div>
                    
                    {selectedEvaluations.length > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            Ta bort valda ({selectedEvaluations.length})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Bekräfta borttagning</AlertDialogTitle>
                            <AlertDialogDescription>
                              Är du säker på att du vill ta bort {selectedEvaluations.length} utvärdering{selectedEvaluations.length > 1 ? 'ar' : ''}? 
                              Denna åtgärd kan inte ångras.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteSelected}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Ta bort
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )}
                
                {/* Filter buttons */}
                <div className="flex gap-3">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="px-4"
                  >
                    Alla
                  </Button>
                  <Button
                    variant={filter === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('completed')}
                    className="px-4"
                  >
                    Slutförda
                  </Button>
                  <Button
                    variant={filter === 'drafts' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('drafts')}
                    className="px-4"
                  >
                    Utkast
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {evaluations.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="px-4">
                        <Download className="h-4 w-4 mr-2" />
                        Exportera
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExport('excel')}>
                        Ladda ner Excel (.xlsx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('csv')}>
                        Ladda ner CSV (.csv)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  onClick={() => navigate('/evaluate')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ny utvärdering
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {filteredEvaluations.map((evaluation) => {
                const physicalAvg = calculatePhysicalAverage(evaluation);
                return (
                  <Card key={evaluation.id} className="bg-white shadow-md border-0 rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="p-5">
                      {/* Header with checkbox, date and status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedEvaluations.includes(evaluation.id)}
                            onCheckedChange={(checked) => handleSelectEvaluation(evaluation.id, checked as boolean)}
                          />
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(evaluation.created_at).toLocaleDateString('sv-SE')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {evaluation.is_draft && (
                            <span className="bg-accent/20 text-accent-foreground px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 font-medium">
                              <FileText className="h-3 w-3" />
                              Utkast
                            </span>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2"
                                title="Ta bort utvärdering"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Bekräfta borttagning</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Är du säker på att du vill ta bort denna utvärdering? Denna åtgärd kan inte ångras.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSingle(evaluation.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Ta bort
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">
                          {evaluation.address || 'Ingen adress'}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {evaluation.size && formatDisplayValue(evaluation.size, 'area')}
                          {evaluation.rooms && ` • ${formatDisplayValue(evaluation.rooms, 'rooms')}`}
                        </p>
                      </div>
                    </div>

                    {/* Price info */}
                    {(evaluation.price || evaluation.monthly_fee) && (
                      <div className="flex items-center gap-2 mb-4 p-3 bg-primary/10 rounded-lg">
                        <Euro className="h-5 w-5 text-primary" />
                        <div>
                             {evaluation.price && (
                               <p className="font-semibold text-primary">
                                 {formatDisplayValue(evaluation.price, 'price')}
                               </p>
                             )}
                            {evaluation.monthly_fee && (
                              <p className="text-sm text-primary/80">
                                {formatDisplayValue(evaluation.monthly_fee, 'fee')}
                              </p>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Physical rating */}
                    <div className="flex items-center gap-2 mb-4 p-3 bg-accent/10 rounded-lg">
                      <Star className="h-5 w-5 text-accent" />
                      <div className="flex-1">
                        <p className="font-semibold text-accent-foreground">
                          Fysisk bedömning: {physicalAvg.toFixed(1)}
                        </p>
                        <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${star <= physicalAvg ? 'text-accent' : 'text-muted-foreground'}`}
                              >
                                ★
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Comments preview */}
                    {evaluation.comments && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {evaluation.comments}
                        </p>
                      </div>
                    )}

                      {/* Action buttons */}
                      <div className="flex gap-3 mt-5">
                        <Button
                          variant="outline"
                          className="flex-1 py-2.5"
                          onClick={() => navigate(`/evaluation/${evaluation.id}`)}
                        >
                          Visa detaljer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/evaluate?edit=${evaluation.id}`)}
                          className="px-3 py-2.5"
                          title="Redigera"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default Evaluations;
