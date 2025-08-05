import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { GeneralInfoSection } from '@/components/GeneralInfoSection';
import { FinancialSection } from '@/components/FinancialSection';
import { PhysicalAssessmentSection } from '@/components/PhysicalAssessmentSection';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import cityscapeNeutral from '@/assets/cityscape-neutral.png';

const EvaluationSection = () => {
  const [loading, setLoading] = useState(false);
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
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { section } = useParams<{ section: string }>();

  const sectionConfig = {
    general: {
      title: 'Lägenhetsdata',
      component: GeneralInfoSection
    },
    financial: {
      title: 'Föreningsanalys',
      component: FinancialSection
    },
    physical: {
      title: 'Kvalitativ bedömning',
      component: PhysicalAssessmentSection
    }
  };

  const currentConfig = section ? sectionConfig[section as keyof typeof sectionConfig] : null;

  const updateData = (newData: Partial<typeof apartmentData>) => {
    setApartmentData(prev => ({ ...prev, ...newData }));
  };

  const handleReturn = () => {
    navigate('/evaluate');
  };

  if (!currentConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Sektion hittades inte</div>
      </div>
    );
  }

  const CurrentSectionComponent = currentConfig.component;

  return (
    <div className="min-h-screen bg-background relative">
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
      
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg relative z-10">
        <div className="flex items-center gap-3">
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
          <h1 className="text-xl font-bold">{currentConfig.title}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 relative z-10">
        <Card className="bg-card shadow-lg border-border max-w-5xl mx-auto">
          <div className="p-6">
            <CurrentSectionComponent 
              data={apartmentData} 
              updateData={updateData}
            />
          </div>
        </Card>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-40">
        <div className="flex justify-center max-w-5xl mx-auto">
          <Button
            onClick={handleReturn}
            variant="outline"
            className="h-12 px-8 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Återgå
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationSection;