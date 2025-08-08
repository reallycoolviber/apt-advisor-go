import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEvaluationStore } from '@/stores/evaluationStore';
import { ArrowLeft, Home, Plus, MapPin, Euro, Star, Calendar, Edit, FileText, Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatValue as formatDisplayValue } from '@/utils/formatValue';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { EvaluationCardSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useLoadingButton } from '@/hooks/useLoadingButton';
import { CreateEvaluationModal } from '@/components/CreateEvaluationModal';
import { useCreateEvaluationModal } from '@/hooks/useCreateEvaluationModal';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { exportToExcel, exportToCSV } from '@/utils/exportUtils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { EvaluationData } from '@/types/evaluation';

const ITEMS_PER_PAGE = 10;

const Evaluations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    evaluations, 
    evaluationsLoading, 
    evaluationsError, 
    fetchEvaluations, 
    deleteEvaluation,
    clearCurrentEvaluation 
  } = useEvaluationStore();
  
  // Use centralized create evaluation modal logic
  const { 
    showCreateModal, 
    openCreateModal, 
    closeCreateModal, 
    handleCreateEvaluation 
  } = useCreateEvaluationModal();
  
  const [filter, setFilter] = useState<'all' | 'completed' | 'drafts'>('all');
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  // Fetch evaluations when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchEvaluations(user.id);
    }
  }, [user, fetchEvaluations]);

  // Clear current evaluation when navigating to evaluations list
  useEffect(() => {
    clearCurrentEvaluation();
  }, [clearCurrentEvaluation]);

  const calculatePhysicalAverage = (evaluation: EvaluationData) => {
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

  // Pagination logic
  const totalPages = Math.ceil(filteredEvaluations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentEvaluations = filteredEvaluations.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedCard(null); // Collapse any expanded card when changing pages
  };

  const handleCardClick = (evaluationId: string) => {
    setExpandedCard(expandedCard === evaluationId ? null : evaluationId);
  };

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
      setSelectedEvaluations(currentEvaluations.map(evaluation => evaluation.id));
    } else {
      setSelectedEvaluations([]);
    }
  };

  const handleDeleteEvaluation = async (evaluationId: string) => {
    try {
      await deleteEvaluation(evaluationId);
      setSelectedEvaluations(prev => prev.filter(id => id !== evaluationId));
      toast({
        title: "Borttagen",
        description: "Utvärderingen har tagits bort",
      });
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort utvärderingen",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedEvaluations.map(id => deleteEvaluation(id)));
      setSelectedEvaluations([]);
      toast({
        title: "Borttagna",
        description: `${selectedEvaluations.length} utvärderingar har tagits bort`,
      });
    } catch (error) {
      console.error('Error deleting evaluations:', error);
      toast({
        title: "Fel", 
        description: "Kunde inte ta bort utvärderingarna",
        variant: "destructive",
      });
    }
  };

  if (evaluationsLoading) {
    return (
      <div className="min-h-screen bg-app-background relative">
        {/* Background cityscape */}
        <div className="absolute inset-0 opacity-15 bg-no-repeat bg-center bg-cover"
             style={{ backgroundImage: "url('/src/assets/cityscape-neutral.png')" }}>
        </div>
        
        {/* Header */}
        <div className="container mx-auto p-6">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-hover"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-2 hover:bg-hover"
              >
                <Home className="h-5 w-5" />
              </Button>
              <h1>Mina utvärderingar</h1>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto p-6 relative z-10">
          <EvaluationCardSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (evaluationsError) {
    return (
      <div className="min-h-screen bg-app-background relative">
        {/* Background cityscape */}
        <div className="absolute inset-0 opacity-15 bg-no-repeat bg-center bg-cover"
             style={{ backgroundImage: "url('/src/assets/cityscape-neutral.png')" }}>
        </div>
        
        <div className="container mx-auto p-6">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-hover"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-2 hover:bg-hover"
              >
                <Home className="h-5 w-5" />
              </Button>
              <h1>Mina utvärderingar</h1>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto p-6 relative z-10">
          <ErrorState 
            title="Kunde inte ladda utvärderingar"
            message={evaluationsError}
            onRetry={() => user && fetchEvaluations(user.id)}
            size="lg"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-background relative">
      {/* Background cityscape */}
      <div className="absolute inset-0 opacity-15 bg-no-repeat bg-center bg-cover"
           style={{ backgroundImage: "url('/src/assets/cityscape-neutral.png')" }}>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto p-6 relative z-10">
        {/* Header Section */}
        <div className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-hover"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2 hover:bg-hover"
            >
              <Home className="h-5 w-5" />
            </Button>
            <h1>Mina utvärderingar</h1>
            {evaluations.length > 0 && (
              <span className="bg-muted text-muted-foreground px-4 py-2 rounded-full text-lg font-medium">
                {evaluations.length}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <Button
              onClick={openCreateModal}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ny utvärdering
            </Button>
            
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

            {/* Selection controls */}
            {currentEvaluations.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedEvaluations.length === currentEvaluations.length && currentEvaluations.length > 0}
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
                          onClick={handleBulkDelete}
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
          </div>

          {/* Equal-sized Filter Pills */}
          <div className="flex bg-muted p-1 rounded-full max-w-fit">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className={`rounded-full w-24 ${
                filter === 'all' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
              }`}
            >
              Alla
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('completed')}
              className={`rounded-full w-24 ${
                filter === 'completed' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
              }`}
            >
              Slutförda
            </Button>
            <Button
              variant={filter === 'drafts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('drafts')}
              className={`rounded-full w-24 ${
                filter === 'drafts' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
              }`}
            >
              Utkast
            </Button>
          </div>
        </div>

        {evaluations.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="bg-app-background-secondary shadow-lg border-0 p-12 text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Du har inga utvärderingar än
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Klicka på '+ Ny utvärdering' för att komma igång!
              </p>
              <Button
                onClick={openCreateModal}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Skapa första utvärderingen
              </Button>
            </Card>
          </div>
        ) : (
          <>
            {/* Single Column Layout */}
            <div className="space-y-4 mb-8">
              {currentEvaluations.map((evaluation) => {
                const physicalAvg = calculatePhysicalAverage(evaluation);
                const isExpanded = expandedCard === evaluation.id;
                
                return (
                  <Card 
                    key={evaluation.id} 
                    className="bg-app-background-secondary shadow-md border-0 rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                    onClick={() => handleCardClick(evaluation.id)}
                  >
                    {/* Compact header - always visible */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedEvaluations.includes(evaluation.id)}
                            onCheckedChange={(checked) => handleSelectEvaluation(evaluation.id, checked as boolean)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0"
                          />
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(evaluation.created_at).toLocaleDateString('sv-SE')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {evaluation.is_draft && (
                            <span className="bg-accent/20 text-accent-foreground px-2 py-1 rounded-full text-xs flex items-center gap-1 font-medium">
                              <FileText className="h-3 w-3" />
                              Utkast
                            </span>
                          )}
                          <div className="text-muted-foreground">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Address - always visible */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                        <h3 className="font-semibold text-foreground text-lg leading-tight">
                          {evaluation.address || 'Ingen adress'}
                        </h3>
                      </div>
                    </div>

                    {/* Expanded content - shown only when expanded */}
                    {isExpanded && (
                      <div className="px-4 pb-4 animate-accordion-down">
                        <div className="border-t border-border pt-4">
                          {/* Price and details */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Euro className="h-4 w-4 text-primary" />
                              <span className="text-sm text-muted-foreground">Pris:</span>
                              <span className="font-medium text-foreground">
                                {evaluation.price ? formatDisplayValue(evaluation.price, 'currency') : 'Ej angivet'}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Avgift:</span>
                              <span className="font-medium text-foreground ml-1">
                                {evaluation.monthly_fee ? formatDisplayValue(evaluation.monthly_fee, 'currency') : 'Ej angivet'}
                              </span>
                            </div>
                          </div>

                          {/* Size and rooms */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Storlek:</span>
                              <span className="font-medium text-foreground ml-1">
                                {evaluation.size ? formatDisplayValue(evaluation.size, 'area') : 'Ej angivet'}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Rum:</span>
                              <span className="font-medium text-foreground ml-1">
                                {evaluation.rooms || 'Ej angivet'}
                              </span>
                            </div>
                          </div>

                          {/* Physical rating */}
                          {physicalAvg > 0 && (
                            <div className="flex items-center gap-2 mb-4">
                              <Star className="h-4 w-4 text-primary" />
                              <span className="text-sm text-muted-foreground">Fysisk bedömning:</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= physicalAvg
                                        ? 'fill-primary text-primary'
                                        : 'text-muted'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-medium text-foreground">
                                ({physicalAvg.toFixed(1)})
                              </span>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center justify-between pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/evaluate/${evaluation.id}`);
                              }}
                              className="gap-2"
                            >
                              <Edit className="h-3 w-3" />
                              Visa detaljer
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
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
                                    onClick={() => handleDeleteEvaluation(evaluation.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Ta bort
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
          )}
        </div>
        
        {/* CreateEvaluationModal */}
        <CreateEvaluationModal
          open={showCreateModal}
          onOpenChange={closeCreateModal}
          onContinue={handleCreateEvaluation}
        />
      </div>
    );
  };

  export default Evaluations;