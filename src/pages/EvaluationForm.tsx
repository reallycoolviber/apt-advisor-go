
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
import { supabase } from '@/integrations/supabase/client';


const EvaluationForm = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [apartmentData, setApartmentData] = useState({
    // Auto input data
    apartmentUrl: '',
    annualReportUrl: '',
    
    // General info
    address: '',
    size: '',
    price: '',
    finalPrice: '',
    rooms: '',
    monthlyFee: '',
    
    // Physical assessment (1-5 ratings)
    planlösning: 0,
    kitchen: 0,
    bathroom: 0,
    bedrooms: 0,
    surfaces: 0,
    förvaring: 0,
    ljusinsläpp: 0,
    balcony: 0,
    
    // Financial data
    debtPerSqm: '',
    feePerSqm: '',
    cashflowPerSqm: '',
    majorMaintenanceDone: null as boolean | null,
    ownsLand: null as boolean | null,
    underhållsplan: '',
    
    // Summary
    comments: '',
    
    // Comment fields
    planlösning_comment: '',
    kitchen_comment: '',
    bathroom_comment: '',
    bedrooms_comment: '',
    surfaces_comment: '',
    förvaring_comment: '',
    ljusinsläpp_comment: '',
    balcony_comment: '',
    
    // Validation results for scraped data
    validationResults: {} as Record<string, any>,
    
    // Draft flag
    is_draft: false
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();

  const sections = [
    { title: 'Automatisk indata', component: AutoInputSection },
    { title: 'Allmän information', component: GeneralInfoSection },
    { title: 'Ekonomi', component: FinancialSection },
    { title: 'Fysisk bedömning', component: PhysicalAssessmentSection },
    { title: 'Sammanfattning', component: SummarySection }
  ];

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      loadEvaluation(id);
    }
  }, [id]);

  const loadEvaluation = async (evaluationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('apartment_evaluations')
        .select('*')
        .eq('id', evaluationId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setApartmentData({
        apartmentUrl: data.apartment_url || '',
        annualReportUrl: data.annual_report_url || '',
        address: data.address || '',
        size: data.size?.toString() || '',
        price: data.price?.toString() || '',
        finalPrice: data.final_price?.toString() || '',
        rooms: data.rooms || '',
        monthlyFee: data.monthly_fee?.toString() || '',
        planlösning: data.planlösning || 0,
        kitchen: data.kitchen || 0,
        bathroom: data.bathroom || 0,
        bedrooms: data.bedrooms || 0,
        surfaces: data.surfaces || 0,
        förvaring: data.förvaring || 0,
        ljusinsläpp: data.ljusinsläpp || 0,
        balcony: data.balcony || 0,
        debtPerSqm: data.debt_per_sqm?.toString() || '',
        feePerSqm: data.fee_per_sqm?.toString() || '',
        cashflowPerSqm: data.cashflow_per_sqm?.toString() || '',
        majorMaintenanceDone: data.major_maintenance_done,
        ownsLand: data.owns_land,
        underhållsplan: data.underhållsplan || '',
        comments: data.comments || '',
        planlösning_comment: data.planlösning_comment || '',
        kitchen_comment: data.kitchen_comment || '',
        bathroom_comment: data.bathroom_comment || '',
        bedrooms_comment: data.bedrooms_comment || '',
        surfaces_comment: data.surfaces_comment || '',
        förvaring_comment: data.förvaring_comment || '',
        ljusinsläpp_comment: data.ljusinsläpp_comment || '',
        balcony_comment: data.balcony_comment || '',
        validationResults: {},
        is_draft: data.is_draft || false
      });
    } catch (error) {
      console.error('Error loading evaluation:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda utvärderingen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveEvaluation = async (isDraft: boolean = false) => {
    if (!user) return;

    setSaving(true);
    try {
      const evaluationData = {
        user_id: user.id,
        apartment_url: apartmentData.apartmentUrl,
        annual_report_url: apartmentData.annualReportUrl,
        address: apartmentData.address,
        size: apartmentData.size ? parseFloat(apartmentData.size) : null,
        price: apartmentData.price ? parseFloat(apartmentData.price) : null,
        final_price: apartmentData.finalPrice ? parseFloat(apartmentData.finalPrice) : null,
        rooms: apartmentData.rooms,
        monthly_fee: apartmentData.monthlyFee ? parseFloat(apartmentData.monthlyFee) : null,
        planlösning: apartmentData.planlösning,
        kitchen: apartmentData.kitchen,
        bathroom: apartmentData.bathroom,
        bedrooms: apartmentData.bedrooms,
        surfaces: apartmentData.surfaces,
        förvaring: apartmentData.förvaring,
        ljusinsläpp: apartmentData.ljusinsläpp,
        balcony: apartmentData.balcony,
        debt_per_sqm: apartmentData.debtPerSqm ? parseFloat(apartmentData.debtPerSqm) : null,
        fee_per_sqm: apartmentData.feePerSqm ? parseFloat(apartmentData.feePerSqm) : null,
        cashflow_per_sqm: apartmentData.cashflowPerSqm ? parseFloat(apartmentData.cashflowPerSqm) : null,
        major_maintenance_done: apartmentData.majorMaintenanceDone,
        owns_land: apartmentData.ownsLand,
        underhållsplan: apartmentData.underhållsplan,
        comments: apartmentData.comments,
        planlösning_comment: apartmentData.planlösning_comment,
        kitchen_comment: apartmentData.kitchen_comment,
        bathroom_comment: apartmentData.bathroom_comment,
        bedrooms_comment: apartmentData.bedrooms_comment,
        surfaces_comment: apartmentData.surfaces_comment,
        förvaring_comment: apartmentData.förvaring_comment,
        ljusinsläpp_comment: apartmentData.ljusinsläpp_comment,
        balcony_comment: apartmentData.balcony_comment,
        is_draft: isDraft
      };

      let result;
      if (isEditMode && id) {
        result = await supabase
          .from('apartment_evaluations')
          .update(evaluationData)
          .eq('id', id)
          .eq('user_id', user.id);
      } else {
        result = await supabase
          .from('apartment_evaluations')
          .insert(evaluationData);
      }

      if (result.error) throw result.error;

      toast({
        title: isDraft ? "Utkast sparat" : "Utvärdering sparad",
        description: isDraft ? "Ditt utkast har sparats framgångsrikt!" : "Din utvärdering har sparats framgångsrikt!",
      });

      if (!isDraft) {
        navigate('/evaluations');
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara utvärderingen",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateData = (newData: Partial<typeof apartmentData>) => {
    setApartmentData(prev => ({ ...prev, ...newData }));
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

  const CurrentSectionComponent = sections[currentSection].component;
  const progress = ((currentSection + 1) / sections.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        {/* Background cityscape */}
        <div className="absolute inset-0 opacity-15 bg-no-repeat bg-center bg-cover"
             style={{ backgroundImage: "url('/src/assets/cityscape-neutral.png')" }}>
        </div>
        <div className="text-foreground relative z-10">Laddar utvärdering...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background cityscape */}
      <div className="absolute inset-0 opacity-15 bg-no-repeat bg-center bg-cover"
           style={{ backgroundImage: "url('/src/assets/cityscape-neutral.png')" }}>
      </div>
      
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-primary-foreground hover:bg-primary/80 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-primary-foreground hover:bg-primary/80 p-2"
          >
            <Home className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">
            {isEditMode ? 'Redigera utvärdering' : 'Lägenhetsbedömning'}
          </h1>
          {apartmentData.is_draft && (
            <span className="bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs">
              Utkast
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm opacity-90">
            <span>{sections[currentSection].title}</span>
            <span>{currentSection + 1}/{sections.length}</span>
          </div>
          <Progress value={progress} className="h-2 bg-primary/20" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 relative z-10">
        <Card className="bg-card shadow-lg border-border max-w-5xl mx-auto">
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
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-40 relative">
        <div className="flex justify-between gap-3 max-w-5xl mx-auto">
          <Button
            variant="outline"
            onClick={prevSection}
            disabled={currentSection === 0}
            className="flex-1 h-12 text-sm font-medium min-w-0"
          >
            <ChevronLeft className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">Föregående</span>
          </Button>
          
          <Button
            onClick={() => saveEvaluation(true)}
            disabled={saving}
            variant="outline"
            className="flex-1 h-12 text-sm font-medium border-accent text-accent hover:bg-accent/10 min-w-0 flex items-center justify-center"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent border-t-transparent"></div>
            ) : (
              <FileText className="h-5 w-5" />
            )}
          </Button>
          
          {currentSection === sections.length - 1 ? (
            <div className="flex-1"></div>
          ) : (
            <Button
              onClick={nextSection}
              disabled={currentSection === sections.length - 1}
              className="flex-1 h-12 text-sm font-medium bg-primary hover:bg-primary/90 min-w-0"
            >
              <span className="truncate">Nästa</span>
              <ChevronRight className="h-4 w-4 ml-1 flex-shrink-0" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};


export default EvaluationForm;
