import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AutoInputSection } from '@/components/AutoInputSection';
import { GeneralInfoSection } from '@/components/GeneralInfoSection';
import { PhysicalAssessmentSection } from '@/components/PhysicalAssessmentSection';
import { FinancialSection } from '@/components/FinancialSection';
import { SummarySection } from '@/components/SummarySection';
import { ChevronLeft, ChevronRight, Home, ArrowLeft, Save, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useEvaluationStore } from '@/stores/evaluationStore';
import { useEvaluationAutoSave } from '@/hooks/useEvaluationAutoSave';

const EvaluationForm = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();

  // SSOT: All data comes from central store
  const {
    currentEvaluation,
    currentEvaluationLoading,
    currentEvaluationError,
    updateField,
    loadEvaluation,
    createNewEvaluation,
    saveCurrentEvaluation,
    hasUnsavedChanges,
    autoSaveStatus
  } = useEvaluationStore();

  // Auto-save functionality
  useEvaluationAutoSave({ enabled: true });

  const sections = [
    { title: 'Automatisk indata', component: AutoInputSection },
    { title: 'Allmän information', component: GeneralInfoSection },
    { title: 'Ekonomi', component: FinancialSection },
    { title: 'Fysisk bedömning', component: PhysicalAssessmentSection },
    { title: 'Sammanfattning', component: SummarySection }
  ];

  useEffect(() => {
    if (id && id !== 'new') {
      loadEvaluation(id);
    } else if (!currentEvaluation) {
      // Create new evaluation with empty address (will be filled by user)
      createNewEvaluation('');
    }
  }, [id]);

  // SSOT: Single update function that goes through central store
  const updateData = (updates: Record<string, any>) => {
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'address') {
        updateField('address', '', value);
      } else if (['size', 'rooms', 'price', 'finalPrice', 'monthlyFee'].includes(key)) {
        const fieldMap: Record<string, string> = {
          size: 'size',
          rooms: 'rooms', 
          price: 'price',
          finalPrice: 'finalPrice',
          monthlyFee: 'monthlyFee'
        };
        updateField('general', fieldMap[key], value);
      } else if (['debtPerSqm', 'feePerSqm', 'cashflowPerSqm', 'majorMaintenanceDone', 'ownsLand', 'underhållsplan'].includes(key)) {
        updateField('financial', key, value);
      } else if (['planlösning', 'kitchen', 'bathroom', 'bedrooms', 'surfaces', 'förvaring', 'ljusinsläpp', 'balcony', 'comments'].includes(key) || key.endsWith('_comment')) {
        updateField('physical', key, value);
      } else {
        // Handle other fields by finding appropriate section
        if (key === 'apartmentUrl' || key === 'annualReportUrl') {
          // These are temporary fields for auto-input, store in general for now
          updateField('general', key, value);
        }
      }
    });
  };

  // Convert store data to component format for backward compatibility
  const apartmentData = currentEvaluation ? {
    // Auto input data
    apartmentUrl: (currentEvaluation.general as any)?.apartmentUrl || '',
    annualReportUrl: (currentEvaluation.general as any)?.annualReportUrl || '',
    
    // General info
    address: currentEvaluation.address,
    size: currentEvaluation.general.size,
    price: currentEvaluation.general.price,
    finalPrice: currentEvaluation.general.finalPrice,
    rooms: currentEvaluation.general.rooms,
    monthlyFee: currentEvaluation.general.monthlyFee,
    
    // Physical assessment (1-5 ratings)
    planlösning: currentEvaluation.physical.planlösning,
    kitchen: currentEvaluation.physical.kitchen,
    bathroom: currentEvaluation.physical.bathroom,
    bedrooms: currentEvaluation.physical.bedrooms,
    surfaces: currentEvaluation.physical.surfaces,
    förvaring: currentEvaluation.physical.förvaring,
    ljusinsläpp: currentEvaluation.physical.ljusinsläpp,
    balcony: currentEvaluation.physical.balcony,
    
    // Financial data
    debtPerSqm: currentEvaluation.financial.debtPerSqm,
    feePerSqm: (currentEvaluation.financial as any)?.feePerSqm || '',
    cashflowPerSqm: currentEvaluation.financial.cashflowPerSqm,
    majorMaintenanceDone: currentEvaluation.financial.majorMaintenanceDone,
    ownsLand: currentEvaluation.financial.ownsLand,
    underhållsplan: currentEvaluation.financial.underhållsplan,
    
    // Summary
    comments: currentEvaluation.physical.comments,
    
    // Comment fields
    planlösning_comment: currentEvaluation.physical.planlösning_comment,
    kitchen_comment: currentEvaluation.physical.kitchen_comment,
    bathroom_comment: currentEvaluation.physical.bathroom_comment,
    bedrooms_comment: currentEvaluation.physical.bedrooms_comment,
    surfaces_comment: currentEvaluation.physical.surfaces_comment,
    förvaring_comment: currentEvaluation.physical.förvaring_comment,
    ljusinsläpp_comment: currentEvaluation.physical.ljusinsläpp_comment,
    balcony_comment: currentEvaluation.physical.balcony_comment
  } : null;

  const handleSave = async () => {
    try {
      await saveCurrentEvaluation();
      toast({
        title: "Sparad",
        description: "Utvärderingen har sparats",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte spara utvärderingen",
        variant: "destructive",
      });
    }
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const progress = ((currentSection + 1) / sections.length) * 100;
  const CurrentSectionComponent = sections[currentSection].component;

  if (currentEvaluationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar utvärdering...</p>
        </div>
      </div>
    );
  }

  if (currentEvaluationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{currentEvaluationError}</p>
          <Button onClick={() => navigate('/evaluations')}>
            Tillbaka till utvärderingar
          </Button>
        </div>
      </div>
    );
  }

  if (!apartmentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Ingen data tillgänglig</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/evaluations')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                {sections[currentSection].title}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={autoSaveStatus.saving || !hasUnsavedChanges}
              className="text-muted-foreground hover:text-foreground"
            >
              {autoSaveStatus.saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {autoSaveStatus.saving ? 'Sparar...' : hasUnsavedChanges ? 'Spara' : 'Sparad'}
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{currentSection + 1}/{sections.length}</span>
              <span>{Math.round(progress)}% klar</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 pb-20 relative z-10">
        <Card className="bg-card shadow-lg border-border max-w-lg mx-auto">
          <div className="p-6">
            <CurrentSectionComponent 
              data={apartmentData} 
              updateData={updateData}
              {...(sections[currentSection].component === SummarySection && { userId: user?.id })}
            />
          </div>
        </Card>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-sm border-t border-border shadow-lg z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={prevSection}
              disabled={currentSection === 0}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Föregående
            </Button>
            
            <Button
              onClick={nextSection}
              disabled={currentSection === sections.length - 1}
              className="flex-1"
            >
              Nästa
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationForm;