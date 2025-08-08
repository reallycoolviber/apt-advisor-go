import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft, Home, FileText, Building, BarChart3, Save, GitCompare, ClipboardCheck } from 'lucide-react';
import AutoComparisonWidget from '@/components/AutoComparisonWidget';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProgressBar } from '@/components/ui/progress-bar';
import EvaluationAddressEditor from '@/components/form/EvaluationAddressEditor';
import { supabase } from '@/integrations/supabase/client';
import cityscapeNeutral from '@/assets/cityscape-neutral.png';
import { formatValue as formatDisplayValue } from '@/utils/formatValue';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useEvaluationStore } from '@/stores/evaluationStore';

const EvaluationHub = () => {
  console.log('EvaluationHub component starting to render');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: urlEvaluationId } = useParams();
  
  // Use central store - Single Source of Truth
  const { 
    currentEvaluation, 
    currentEvaluationId,
    currentEvaluationLoading,
    updateField, 
    loadEvaluation,
    saveCurrentEvaluation,
    createNewEvaluation
  } = useEvaluationStore();

  // Only UI state, no evaluation data copies
  const [activeTab, setActiveTab] = useState<'input' | 'evaluation' | 'comparison'>('input');
  const [checklistProgress, setChecklistProgress] = useState({ filled: 0, total: 0 });
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Read data directly from central store
  const data = currentEvaluation || {
    address: '',
    general: { size: '', rooms: '', price: '', finalPrice: '', monthlyFee: '' },
    financial: { debtPerSqm: '', cashflowPerSqm: '', majorMaintenanceDone: false, ownsLand: false, underhållsplan: '' },
    physical: { planlösning: 0, kitchen: 0, bathroom: 0, bedrooms: 0, surfaces: 0, förvaring: 0, ljusinsläpp: 0, balcony: 0, planlösning_comment: '', kitchen_comment: '', bathroom_comment: '', bedrooms_comment: '', surfaces_comment: '', förvaring_comment: '', ljusinsläpp_comment: '', balcony_comment: '', comments: '' }
  };

  console.log('EvaluationHub: hooks initialized successfully');
  console.log('EvaluationHub: Current data:', data);
  console.log('EvaluationHub: User:', user);

  const fetchChecklistProgress = async () => {
    if (!user || !currentEvaluationId) return { filled: 0, total: 16 };
    
    try {
      // Get checklist data from the evaluation's checklist JSONB field
      const { data: evaluation, error } = await supabase
        .from('apartment_evaluations')
        .select('checklist')
        .eq('id', currentEvaluationId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const checklist = Array.isArray(evaluation?.checklist) ? evaluation.checklist : [];
      const filled = checklist.filter((item: any) => item.checked === true).length;
      const total = 16; // 8 + 8 items from predefined checklist structure
      const progress = { filled, total };
      setChecklistProgress(progress);
      return progress;
    } catch (error) {
      console.error('Error fetching checklist progress:', error);
      return { filled: 0, total: 16 };
    }
  };

  const toBase = (v: any): number | null => {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return v;
    const num = parseFloat(v.toString().replace(/\s/g, '').replace(',', '.'));
    return isNaN(num) ? null : num;
  };

  // Load checklist progress for this specific evaluation
  useEffect(() => {
    if (user && currentEvaluationId) {
      fetchChecklistProgress();
    }
  }, [user, currentEvaluationId]);

  // Load existing evaluation if edit mode or direct URL with ID, or create new if none exists
  useEffect(() => {
    const editId = searchParams.get('edit') || urlEvaluationId;
    if (editId && user && editId !== currentEvaluationId) {
      const fetchEvaluation = async () => {
        try {
          await loadEvaluation(editId);
        } catch (err) {
          console.error('Error loading evaluation for editing:', err);
          setError('Kunde inte ladda utvärderingen. Försök igen senare.');
        }
      };

      fetchEvaluation();
    } else if (user && !currentEvaluationId && !editId) {
      // No evaluation loaded and no edit ID - create a new one
      const createEvaluation = async () => {
        try {
          await createNewEvaluation();
        } catch (err) {
          console.error('Error creating new evaluation:', err);
          setError('Kunde inte skapa ny utvärdering. Försök igen senare.');
        }
      };

      createEvaluation();
    }
  }, [searchParams, urlEvaluationId, user?.id, currentEvaluationId, loadEvaluation, createNewEvaluation]);

  // Helper function to calculate progress for a section
  const calculateSectionProgress = (section: 'general' | 'financial' | 'physical' | 'checklist') => {
    if (section === 'general') {
      const fields = [data.address, data.general?.size, data.general?.rooms, data.general?.price, data.general?.finalPrice, data.general?.monthlyFee];
      const filledFields = fields.filter(field => field && field !== '').length;
      return { filled: filledFields, total: fields.length };
    } else if (section === 'financial') {
      const fields = [data.financial?.debtPerSqm, data.financial?.cashflowPerSqm, data.financial?.majorMaintenanceDone, data.financial?.ownsLand, data.financial?.underhållsplan];
      const filledFields = fields.filter(field => field !== null && field !== undefined && field !== '').length;
      return { filled: filledFields, total: fields.length };
    } else if (section === 'physical') {
      const ratings = [data.physical?.planlösning, data.physical?.kitchen, data.physical?.bathroom, data.physical?.bedrooms, data.physical?.surfaces, data.physical?.förvaring, data.physical?.ljusinsläpp, data.physical?.balcony];
      const filledRatings = ratings.filter(rating => rating && rating > 0).length;
      return { filled: filledRatings, total: ratings.length };
    }
    return checklistProgress;
  };

  const evaluationSections = [
    {
      title: 'Lägenhetsdata',
      description: 'Grundläggande information om lägenheten',
      icon: Building,
      path: '/evaluate/general/Lägenhetsdata',
      completed: 'not-started' as const,
      progress: calculateSectionProgress('general')
    },
    {
      title: 'Föreningsanalys',
      description: 'Ekonomisk information och föreningsdata',
      icon: BarChart3,
      path: '/evaluate/financial/Föreningsanalys',
      completed: 'not-started' as const,
      progress: calculateSectionProgress('financial')
    },
    {
      title: 'Lägenhetsbedömning',
      description: 'Kvalitativ bedömning av lägenheten',
      icon: FileText,
      path: '/evaluate/physical/Lägenhetsbedömning',
      completed: 'not-started' as const,
      progress: calculateSectionProgress('physical')
    },
    {
      title: 'Checklista under visning',
      description: 'Viktiga punkter att kontrollera under visning',
      icon: ClipboardCheck,
      path: '/evaluate/checklist/Checklista under visning',
      completed: 'not-started' as const,
      progress: calculateSectionProgress('checklist')
    }
  ];

  // Calculate physical assessment average if data exists
  const calculatePhysicalAverage = () => {
    if (!data.physical) return 0;
    const ratings = [
      data.physical.planlösning,
      data.physical.kitchen,
      data.physical.bathroom,
      data.physical.bedrooms,
      data.physical.surfaces,
      data.physical.förvaring,
      data.physical.ljusinsläpp,
      data.physical.balcony
    ].filter(rating => rating && rating > 0);
    
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  };

  const physicalAverage = calculatePhysicalAverage();
  const hasAnyData = data.address || data.general?.size || data.general?.price || data.physical || data.financial;

  // Functions to check if data exists for each category
  const hasLägenhetsdata = () => {
    return data.address || data.general?.size || data.general?.rooms || data.general?.price || data.general?.finalPrice || data.general?.monthlyFee;
  };

  const hasFöreningsinformation = () => {
    return data.financial?.debtPerSqm || data.financial?.cashflowPerSqm || 
           data.financial?.majorMaintenanceDone !== undefined || data.financial?.ownsLand !== undefined || 
           data.financial?.underhållsplan;
  };

  const hasBedömning = () => {
    return data.physical?.planlösning || data.physical?.kitchen || data.physical?.bathroom || 
           data.physical?.bedrooms || data.physical?.surfaces || data.physical?.förvaring || 
           data.physical?.ljusinsläpp || data.physical?.balcony || data.physical?.comments;
  };

  // Use central store for saving
  const handleSave = async () => {
    setSaveLoading(true);
    try {
      await saveCurrentEvaluation();
      navigate('/evaluations');
    } catch (err) {
      console.error('Error saving evaluation:', err);
      setError('Kunde inte spara utvärderingen. Försök igen.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCompare = () => {
    navigate('/compare');
  };

  // Loading state
  if (currentEvaluationLoading) {
    return (
      <div className="min-h-screen bg-app-background relative">
        {/* Background cityscape */}
        <div 
          className="absolute inset-0 opacity-15 bg-no-repeat bg-center bg-cover"
          style={{ backgroundImage: `url(${cityscapeNeutral})` }}
        />
        
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
              <h1>Lägenhetsutvärdering</h1>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto p-6 relative z-10">
          <LoadingSkeleton type="form" rows={8} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const handleRetry = () => {
      setError(null);
      window.location.reload();
    };

    return (
      <div className="min-h-screen bg-app-background relative">
        {/* Background cityscape */}
        <div 
          className="absolute inset-0 opacity-15 bg-no-repeat bg-center bg-cover"
          style={{ backgroundImage: `url(${cityscapeNeutral})` }}
        />
        
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
              <h1>Lägenhetsutvärdering</h1>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto p-6 relative z-10">
          <ErrorState 
            title="Kunde inte ladda utvärdering"
            message={error}
            onRetry={handleRetry}
            size="lg"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background cityscape */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `url(${cityscapeNeutral})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          zIndex: 1
        }}
      />
      
      {/* Content */}
      <div className="relative pt-6 pb-8 px-4" style={{ zIndex: 10 }}>
        <div className="max-w-md mx-auto">
          {/* Top navigation with title */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
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
            </div>
            
            <h2 className="text-xl font-bold text-foreground">
              Lägenhetsutvärdering
            </h2>
            
            <div className="w-20"></div> {/* Spacer for balance */}
          </div>

           {/* Address display using new component */}
           <EvaluationAddressEditor />

           {/* Navigation Toggle */}
           <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full mb-6">
             <TabsList className="grid w-full grid-cols-3 bg-muted p-1 h-auto rounded-lg">
               <TabsTrigger 
                 value="input"
                 className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md py-2 px-4 text-sm font-medium transition-all"
               >
                 Input
               </TabsTrigger>
               <TabsTrigger 
                 value="evaluation"
                 className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md py-2 px-4 text-sm font-medium transition-all"
               >
                 Utvärdering
               </TabsTrigger>
               <TabsTrigger 
                 value="comparison"
                 className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md py-2 px-4 text-sm font-medium transition-all"
               >
                 Jämförelse
               </TabsTrigger>
             </TabsList>
           
           {/* Content based on active tab */}
            <TabsContent value="input" className="mt-0">
              <div className="space-y-3 mb-8">
               {evaluationSections.map((section, index) => {
                 const IconComponent = section.icon;
                 
                   const renderProgressIndicator = (progress: { filled: number, total: number }) => {
                     return (
                       <ProgressBar 
                         filled={progress.filled} 
                         total={progress.total}
                       />
                     );
                   };
                 
                 return (
                    <Card 
                      key={section.title} 
                      className="group overflow-hidden bg-card border transition-all duration-300 hover:shadow-md hover:bg-hover hover:border-hover shadow-sm cursor-pointer h-20"
                      onClick={() => navigate(section.path)}
                    >
                     <div className="w-full p-3 flex items-center gap-4 text-left transition-all duration-300">
                       {/* Icon - Left */}
                        <div className="p-2 rounded-lg flex-shrink-0 bg-primary/10 group-hover:bg-hover-foreground/20">
                          <IconComponent className="h-5 w-5 text-primary group-hover:text-hover-foreground" />
                       </div>
                       
                       {/* Text - Center */}
                       <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold group-hover:text-hover-foreground mb-1 truncate">
                            {section.title}
                          </h3>
                          <p className="text-xs text-muted-foreground group-hover:text-hover-foreground/70 line-clamp-2">
                           {section.description}
                         </p>
                       </div>
                       
                        {/* Progress - Right */}
                        <div className="flex-shrink-0">
                          {renderProgressIndicator(section.progress)}
                        </div>
                     </div>
                   </Card>
                 );
                })}
              </div>
            </TabsContent>

           <TabsContent value="evaluation" className="mt-0">
              <div className="space-y-4 mb-8">
                {/* Lägenhetsdata */}
                 <Card className="bg-card border shadow-sm">
                   <div className="p-4">
                      <h3 className="text-small font-semibold text-foreground mb-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        Lägenhetsdata
                      </h3>
                    {hasLägenhetsdata() ? (
                      <div className="space-y-2">
                        {data.address && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Adress:</span>
                            <span className="text-sm font-medium text-foreground">{data.address}</span>
                          </div>
                        )}
                        {data.general?.size && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Boarea:</span>
                            <span className="text-sm font-medium text-foreground">{formatDisplayValue(data.general.size, 'area')}</span>
                          </div>
                        )}
                        {data.general?.rooms && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Antal rum:</span>
                            <span className="text-sm font-medium text-foreground">{formatDisplayValue(data.general.rooms, 'rooms')}</span>
                          </div>
                        )}
                        {data.general?.price && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Pris:</span>
                            <span className="text-sm font-medium text-foreground">{formatDisplayValue(data.general.price, 'price')}</span>
                          </div>
                        )}
                        {data.general?.finalPrice && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Slutpris:</span>
                            <span className="text-sm font-medium text-foreground">{formatDisplayValue(data.general.finalPrice, 'price')}</span>
                          </div>
                        )}
                         {data.general?.monthlyFee && (
                           <div className="flex justify-between py-2 border-b border-border/30">
                             <span className="text-sm text-muted-foreground">Avgift:</span>
                             <span className="text-sm font-medium text-foreground">{formatDisplayValue(data.general.monthlyFee, 'fee')}</span>
                           </div>
                         )}
                         {data.general?.price && data.general?.size && (
                           <div className="flex justify-between py-2 border-b border-border/30 bg-secondary/30 px-2 rounded">
                             <span className="text-sm font-medium text-foreground">Pris per kvm:</span>
                             <span className="text-sm font-bold text-foreground">{formatDisplayValue(Math.round(parseInt(data.general.price.replace(/\s/g, '')) / parseInt(data.general.size)), 'price_per_sqm')}</span>
                           </div>
                         )}
                         {data.general?.monthlyFee && data.general?.size && (
                           <div className="flex justify-between py-2 bg-secondary/30 px-2 rounded">
                             <span className="text-sm font-medium text-foreground">Avgift per kvm:</span>
                             <span className="text-sm font-bold text-foreground">{formatDisplayValue(Math.round(parseInt(data.general.monthlyFee.replace(/\s/g, '')) / parseInt(data.general.size)), 'fee_per_sqm')}</span>
                           </div>
                         )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Ingen information tillagd</p>
                    )}
                  </div>
                </Card>

                {/* Föreningsinformation */}
                 <Card className="bg-card border shadow-sm">
                   <div className="p-4">
                      <h3 className="text-small font-semibold text-foreground mb-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <BarChart3 className="h-5 w-5 text-primary" />
                        </div>
                        Föreningsinformation
                      </h3>
                    {hasFöreningsinformation() ? (
                      <div className="space-y-2">
                        {data.financial?.debtPerSqm && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Skuldsättning:</span>
                            <span className="text-sm font-medium text-foreground">{formatDisplayValue(data.financial.debtPerSqm, 'debt_per_sqm')}</span>
                          </div>
                        )}
                        {data.financial?.cashflowPerSqm && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Kassaflöde per kvm:</span>
                            <span className="text-sm font-medium text-foreground">{formatDisplayValue(data.financial.cashflowPerSqm, 'fee_per_sqm')}</span>
                          </div>
                        )}
                         <div className="flex justify-between py-2 border-b border-border/30">
                           <span className="text-sm text-muted-foreground">Stora renoveringar genomförda:</span>
                           <span className="text-sm font-medium text-foreground">
                             {data.financial?.majorMaintenanceDone === null || data.financial?.majorMaintenanceDone === undefined 
                               ? <span className="text-muted-foreground">Ej angivet</span>
                               : data.financial.majorMaintenanceDone ? 'Ja' : 'Nej'
                             }
                           </span>
                         </div>
                         <div className="flex justify-between py-2 border-b border-border/30">
                           <span className="text-sm text-muted-foreground">Äger mark:</span>
                           <span className="text-sm font-medium text-foreground">
                             {data.financial?.ownsLand === null || data.financial?.ownsLand === undefined 
                               ? <span className="text-muted-foreground">Ej angivet</span>
                               : data.financial.ownsLand ? 'Ja' : 'Nej (tomträtt)'
                             }
                           </span>
                         </div>
                        {data.financial?.underhållsplan && (
                          <div className="py-2">
                            <span className="text-sm text-muted-foreground block mb-1">Underhållsplan:</span>
                            <span className="text-sm font-medium text-foreground">{data.financial.underhållsplan}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Ingen information tillagd</p>
                    )}
                  </div>
                </Card>

                 {/* Lägenhetsbedömning */}
                 <Card className="bg-card border shadow-sm">
                   <div className="p-4">
                       <h3 className="text-small font-semibold text-foreground mb-4 flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-primary/10">
                           <FileText className="h-5 w-5 text-primary" />
                         </div>
                         Lägenhetsbedömning
                       </h3>
                    {hasBedömning() ? (
                      <div className="space-y-2">
                        {data.physical?.planlösning && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Planlösning:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.planlösning}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.kitchen && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Kök:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.kitchen}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.bathroom && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Badrum:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.bathroom}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.bedrooms && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Sovrum:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.bedrooms}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.surfaces && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Ytor:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.surfaces}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.förvaring && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Förvaring:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.förvaring}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.ljusinsläpp && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Ljusinsläpp:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.ljusinsläpp}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.balcony && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Balkong/Uteplats:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.balcony}/5 ⭐</span>
                          </div>
                        )}
                        {physicalAverage > 0 && (
                          <div className="flex justify-between py-2 border-b border-border/30 bg-secondary/30 px-2 rounded">
                            <span className="text-sm font-medium text-foreground">Genomsnittlig bedömning:</span>
                            <span className="text-sm font-bold text-foreground">{physicalAverage.toFixed(1)}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.comments && (
                          <div className="py-2">
                            <span className="text-sm text-muted-foreground block mb-1">Mina anteckningar:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.comments}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Ingen information tillagd</p>
                    )}
                  </div>
                </Card>

                 {/* Checklista kort */}
                 <Card className="bg-card border shadow-sm">
                   <div className="p-4">
                     <h3 className="text-small font-semibold text-foreground mb-4 flex items-center gap-3">
                       <div className="p-2 rounded-lg bg-primary/10">
                         <ClipboardCheck className="h-5 w-5 text-primary" />
                       </div>
                       Checklista
                     </h3>
                     <div className="flex justify-between py-2">
                       <span className="text-sm text-muted-foreground">Status:</span>
                       <span className="text-sm font-medium text-foreground">
                         {checklistProgress.filled} av {checklistProgress.total} punkter avklarade
                       </span>
                     </div>
                     <div className="mt-3">
                       <ProgressBar 
                         filled={checklistProgress.filled} 
                         total={checklistProgress.total}
                         className="w-full"
                       />
                     </div>
                   </div>
                 </Card>

                 {/* Comments input */}
                 {hasBedömning() && (
                    <Card className="bg-card border shadow-sm">
                     <div className="p-4">
                       <div className="space-y-2">
                         <Label htmlFor="comments" className="text-sm font-medium text-foreground">
                           Redigera slutkommentarer
                         </Label>
                         <Textarea
                           id="comments"
                           value={data.physical?.comments || ''}
                           onChange={(e) => {
                             updateField('physical', 'comments', e.target.value);
                           }}
                           placeholder="Lägg till dina reflektioner och slutsatser om lägenheten..."
                           className="min-h-[80px] resize-none text-sm"
                         />
                       </div>
                     </div>
                    </Card>
                  )}
               </div>
            </TabsContent>

            <TabsContent value="comparison" className="mt-0">
              {currentEvaluationId && (
                <div className="mb-8">
                   <h3 className="text-lg font-semibold text-foreground mb-4">Jämförelse</h3>
                   <Button 
                     onClick={() => navigate('/comparison')} 
                     className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                   >
                     Gå till jämförelse
                   </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
           
          {/* Action buttons */}
          <div className="flex gap-4 mt-6">
            <Button
              onClick={handleSave}
              disabled={saveLoading}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {saveLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Sparar...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Spara
                </>
              )}
            </Button>
            
            <Button
              onClick={() => navigate('/evaluations')}
              variant="outline"
              className="flex-1 h-12"
              disabled={saveLoading}
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Slutför
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationHub;