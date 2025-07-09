
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
import { SidebarMenu } from '@/components/ui/sidebar-menu';

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
    rooms: '',
    monthlyFee: '',
    
    // Physical assessment (1-5 ratings)
    planlösning: 3,
    kitchen: 3,
    bathroom: 3,
    bedrooms: 3,
    surfaces: 3,
    förvaring: 3,
    ljusinsläpp: 3,
    balcony: 3,
    
    // Financial data
    debtPerSqm: '',
    feePerSqm: '',
    cashflowPerSqm: '',
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
    { title: 'Fysisk bedömning', component: PhysicalAssessmentSection },
    { title: 'Ekonomi', component: FinancialSection },
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
        rooms: data.rooms || '',
        monthlyFee: data.monthly_fee?.toString() || '',
        planlösning: data.planlösning || 3,
        kitchen: data.kitchen || 3,
        bathroom: data.bathroom || 3,
        bedrooms: data.bedrooms || 3,
        surfaces: data.surfaces || 3,
        förvaring: data.förvaring || 3,
        ljusinsläpp: data.ljusinsläpp || 3,
        balcony: data.balcony || 3,
        debtPerSqm: data.debt_per_sqm?.toString() || '',
        feePerSqm: data.fee_per_sqm?.toString() || '',
        cashflowPerSqm: data.cashflow_per_sqm?.toString() || '',
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-blue-900">Laddar utvärdering...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <SidebarMenu />
      
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-blue-800 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-blue-800 p-2"
          >
            <Home className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">
            {isEditMode ? 'Redigera utvärdering' : 'Lägenhetsbedömning'}
          </h1>
          {apartmentData.is_draft && (
            <span className="bg-yellow-600 text-white px-2 py-1 rounded-full text-xs">
              Utkast
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm opacity-90">
            <span>{sections[currentSection].title}</span>
            <span>{currentSection + 1}/{sections.length}</span>
          </div>
          <Progress value={progress} className="h-2 bg-blue-800" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-24">
        <Card className="bg-white shadow-lg border-0">
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={prevSection}
            disabled={currentSection === 0}
            className="flex-1 h-12"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Föregående
          </Button>
          
          <Button
            onClick={() => saveEvaluation(true)}
            disabled={saving}
            variant="outline"
            className="flex-1 h-12 border-yellow-600 text-yellow-600 hover:bg-yellow-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent mr-2"></div>
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Spara utkast
          </Button>
          
          {currentSection === sections.length - 1 ? (
            <Button
              onClick={() => saveEvaluation(false)}
              disabled={saving}
              className="flex-1 h-12 bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditMode ? 'Uppdatera' : 'Slutför'}
            </Button>
          ) : (
            <Button
              onClick={nextSection}
              disabled={currentSection === sections.length - 1}
              className="flex-1 h-12 bg-blue-900 hover:bg-blue-800"
            >
              Nästa
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};


export default EvaluationForm;
