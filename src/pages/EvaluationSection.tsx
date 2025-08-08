import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Home, Link, Loader2 } from 'lucide-react';
import { GeneralInfoSection } from '@/components/GeneralInfoSection';
import { FinancialSection } from '@/components/FinancialSection';
import { PhysicalAssessmentSection } from '@/components/PhysicalAssessmentSection';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEvaluation } from '@/contexts/EvaluationContext';
import cityscapeNeutral from '@/assets/cityscape-neutral.png';

const EvaluationSection = () => {
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [booliUrl, setBooliUrl] = useState('');
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
  const { data: contextData, updateGeneralData, updateFinancialData, updatePhysicalData, getCompletionStatus } = useEvaluation();
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
      title: 'Din bedömning av lägenheten',
      component: PhysicalAssessmentSection
    }
  };

  const currentConfig = section ? sectionConfig[section as keyof typeof sectionConfig] : null;

  const updateData = (newData: Partial<typeof apartmentData>) => {
    setApartmentData(prev => ({ ...prev, ...newData }));
    
    // Update context based on section
    if (section === 'general') {
      updateGeneralData(newData);
    } else if (section === 'financial') {
      updateFinancialData(newData);
    } else if (section === 'physical') {
      updatePhysicalData(newData);
    }
  };

  const saveCurrentData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const saveData = {
        user_id: user.id,
        address: apartmentData.address || '',
        size: parseFloat(apartmentData.size) || null,
        rooms: apartmentData.rooms || '',
        price: parseFloat(apartmentData.price) || null,
        final_price: parseFloat(apartmentData.finalPrice) || null,
        monthly_fee: parseFloat(apartmentData.monthlyFee) || null,
        debt_per_sqm: parseFloat(apartmentData.debtPerSqm) || null,
        fee_per_sqm: parseFloat(apartmentData.feePerSqm) || null,
        cashflow_per_sqm: parseFloat(apartmentData.cashflowPerSqm) || null,
        major_maintenance_done: apartmentData.majorMaintenanceDone,
        owns_land: apartmentData.ownsLand,
        planlösning: apartmentData.planlösning || 0,
        kitchen: apartmentData.kitchen || 0,
        bathroom: apartmentData.bathroom || 0,
        bedrooms: apartmentData.bedrooms || 0,
        surfaces: apartmentData.surfaces || 0,
        förvaring: apartmentData.förvaring || 0,
        ljusinsläpp: apartmentData.ljusinsläpp || 0,
        balcony: apartmentData.balcony || 0,
        planlösning_comment: apartmentData.planlösning_comment || '',
        kitchen_comment: apartmentData.kitchen_comment || '',
        bathroom_comment: apartmentData.bathroom_comment || '',
        bedrooms_comment: apartmentData.bedrooms_comment || '',
        surfaces_comment: apartmentData.surfaces_comment || '',
        förvaring_comment: apartmentData.förvaring_comment || '',
        ljusinsläpp_comment: apartmentData.ljusinsläpp_comment || '',
        balcony_comment: apartmentData.balcony_comment || '',
        apartment_url: apartmentData.apartmentUrl || '',
        is_draft: true
      };

      const { error } = await supabase
        .from('apartment_evaluations')
        .insert(saveData);

      if (error) {
        console.error('Error saving evaluation:', error);
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    await saveCurrentData();
    navigate('/evaluate');
  };

  // Scrape Booli data
  const scrapeWebsite = async (url: string) => {
    try {
      setScraping(true);
      console.log('Attempting to scrape URL:', url);
      
      const { data, error } = await supabase.functions.invoke('scrape-booli', {
        body: { url }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to scrape website');
      }

      console.log('Response from scrape-booli:', data);

      if (data && data.success && data.data && Object.keys(data.data).length > 0) {
        console.log('Scraped data received:', data.data);
        const scrapedData = data.data;
        
        const newData = {
          address: scrapedData.address || '',
          size: scrapedData.size?.toString() || '',
          rooms: scrapedData.rooms?.toString() || '',
          price: scrapedData.startPrice?.toString() || '',
          finalPrice: scrapedData.finalPrice?.toString() || '',
          monthlyFee: scrapedData.monthlyFee?.toString() || '',
          apartmentUrl: url,
        };
        
        updateData(newData);
        
        toast({
          title: "Framgång",
          description: "Data har hämtats från Booli och fälten har fyllts i automatiskt",
          duration: 5000,
        });
      } else if (data && !data.success) {
        throw new Error(data.error || 'Ingen data kunde hämtas från den angivna URL:en');
      } else {
        throw new Error('Ingen data kunde hämtas från den angivna URL:en');
      }
    } catch (error) {
      console.error('Error scraping website:', error);
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Kunde inte hämta data från Booli. Kontrollera att länken är korrekt.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setScraping(false);
    }
  };

  const handleBooliSubmit = () => {
    if (booliUrl.trim()) {
      scrapeWebsite(booliUrl.trim());
    }
  };

  // Calculate progress for current section
  const calculateProgress = () => {
    if (section === 'general') {
      const fields = ['size', 'rooms', 'price', 'monthlyFee'];
      const filledFields = fields.filter(field => {
        const value = apartmentData[field as keyof typeof apartmentData];
        return value && value.toString().trim() !== '';
      });
      return (filledFields.length / fields.length) * 100;
    } else if (section === 'financial') {
      const fields = ['debtPerSqm', 'feePerSqm', 'cashflowPerSqm', 'majorMaintenanceDone', 'ownsLand'];
      const filledFields = fields.filter(field => {
        const value = apartmentData[field as keyof typeof apartmentData];
        if (field === 'majorMaintenanceDone' || field === 'ownsLand') {
          return value !== null && value !== undefined;
        }
        return value && value.toString().trim() !== '';
      });
      return (filledFields.length / fields.length) * 100;
    } else if (section === 'physical') {
      const fields = ['planlösning', 'kitchen', 'bathroom', 'bedrooms', 'surfaces', 'förvaring', 'ljusinsläpp', 'balcony'];
      const filledFields = fields.filter(field => {
        const value = apartmentData[field as keyof typeof apartmentData];
        return value && typeof value === 'number' && value > 0;
      });
      return (filledFields.length / fields.length) * 100;
    }
    return 0;
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
      
      {/* Content */}
      <div className="relative pt-6 pb-8 px-4" style={{ zIndex: 10 }}>
        <div className="max-w-lg mx-auto">
          {/* Top navigation */}
          <div className="flex items-center gap-2 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReturn}
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
            <h1 className="text-xl font-bold text-foreground ml-2">{currentConfig.title}</h1>
          </div>

          {/* Booli URL input - only show for general section */}
          {section === 'general' && (
            <div className="mb-8">
              <Card className="bg-card shadow-lg border-border">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Link className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Automatisk ifyllning från Booli</h3>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Klistra in Booli-länk här..."
                      value={booliUrl}
                      onChange={(e) => setBooliUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleBooliSubmit}
                      disabled={!booliUrl.trim() || scraping}
                      className="px-6"
                    >
                      {scraping ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Hämtar...
                        </>
                      ) : (
                        'Hämta data'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <Card className="bg-card shadow-lg border-border">
            <div className="p-6">
              <CurrentSectionComponent 
                data={apartmentData} 
                updateData={updateData}
              />
            </div>
          </Card>

          {/* Progress Bar */}
          <div className="mt-8">
            <Card className="bg-card shadow-lg border-border">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Ifyllnadsgrad</span>
                  <span className="text-sm text-muted-foreground">{Math.round(calculateProgress())}%</span>
                </div>
                <Progress value={calculateProgress()} className="w-full" />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-40">
        <div className="flex justify-center max-w-lg mx-auto">
          <Button
            onClick={handleReturn}
            variant="outline"
            className="h-12 px-8 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Spara och återgå
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationSection;