import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ChevronLeft, ChevronRight, Home, MapPin, Euro, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  debt_per_sqm: number | null;
  fee_per_sqm: number | null;
  cashflow_per_sqm: number | null;
  owns_land: boolean | null;
  underhållsplan: string | null;
  comments: string | null;
  created_at: string;
}

const EvaluationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(3); // Start with summary (index 3)

  const sections = [
    { title: 'Allmän information', component: 'general' },
    { title: 'Fysisk bedömning', component: 'physical' },
    { title: 'Ekonomi', component: 'financial' },
    { title: 'Sammanfattning', component: 'summary' }
  ];

  useEffect(() => {
    const fetchEvaluation = async () => {
      if (!user || !id) return;

      try {
        const { data, error } = await supabase
          .from('apartment_evaluations')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setEvaluation(data);
      } catch (err) {
        console.error('Error fetching evaluation:', err);
        toast({
          title: "Fel",
          description: "Kunde inte ladda utvärderingen. Försök igen senare.",
          variant: "destructive",
        });
        navigate('/evaluations');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [user, id, navigate, toast]);

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

  const calculatePhysicalAverage = () => {
    if (!evaluation) return 0;
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

  const renderGeneralInfo = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Allmän information</h2>
        <p className="text-muted-foreground">Grundläggande information om lägenheten</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <label className="text-sm font-medium text-muted-foreground">Adress</label>
          <p className="text-lg text-foreground">{evaluation?.address || 'Ej angiven'}</p>
        </Card>
        
        <Card className="p-4">
          <label className="text-sm font-medium text-muted-foreground">Storlek</label>
          <p className="text-lg text-foreground">{evaluation?.size ? `${evaluation.size} kvm` : 'Ej angiven'}</p>
        </Card>
        
        <Card className="p-4">
          <label className="text-sm font-medium text-muted-foreground">Pris</label>
          <p className="text-lg text-foreground">{evaluation?.price ? `${parseInt(evaluation.price.toString()).toLocaleString()} SEK` : 'Ej angivet'}</p>
        </Card>
        
        <Card className="p-4">
          <label className="text-sm font-medium text-muted-foreground">Rum</label>
          <p className="text-lg text-foreground">{evaluation?.rooms || 'Ej angivet'}</p>
        </Card>
        
        <Card className="p-4">
          <label className="text-sm font-medium text-muted-foreground">Månadsavgift</label>
          <p className="text-lg text-foreground">{evaluation?.monthly_fee ? `${parseInt(evaluation.monthly_fee.toString()).toLocaleString()} SEK/mån` : 'Ej angivet'}</p>
        </Card>
      </div>
    </div>
  );

  const renderPhysicalAssessment = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Fysisk bedömning</h2>
        <p className="text-muted-foreground">Bedömning av lägenhetens fysiska egenskaper</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'planlösning', label: 'Planlösning' },
          { key: 'kitchen', label: 'Kök' },
          { key: 'bathroom', label: 'Badrum' },
          { key: 'bedrooms', label: 'Sovrum' },
          { key: 'surfaces', label: 'Ytor' },
          { key: 'förvaring', label: 'Förvaring' },
          { key: 'ljusinsläpp', label: 'Ljusinsläpp' },
          { key: 'balcony', label: 'Balkong/Uteplats' }
        ].map(({ key, label }) => (
          <Card key={key} className="p-4">
            <label className="text-sm font-medium text-muted-foreground">{label}</label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg font-semibold text-foreground">
                {evaluation?.[key as keyof Evaluation] || 0}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-sm ${star <= (evaluation?.[key as keyof Evaluation] as number || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderFinancial = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Ekonomi</h2>
        <p className="text-muted-foreground">Ekonomisk information och nyckeltal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <label className="text-sm font-medium text-foreground">Skuld per kvm</label>
          <p className="text-lg text-foreground">{evaluation?.debt_per_sqm ? `${parseInt(evaluation.debt_per_sqm.toString()).toLocaleString()} SEK/kvm` : 'Ej angivet'}</p>
        </Card>
        
        <Card className="p-4">
          <label className="text-sm font-medium text-foreground">Avgift per kvm</label>
          <p className="text-lg text-foreground">{evaluation?.fee_per_sqm ? `${parseInt(evaluation.fee_per_sqm.toString()).toLocaleString()} SEK/kvm` : 'Ej angivet'}</p>
        </Card>
        
        <Card className="p-4">
          <label className="text-sm font-medium text-foreground">Kassaflöde per kvm</label>
          <p className="text-lg text-foreground">{evaluation?.cashflow_per_sqm ? `${parseInt(evaluation.cashflow_per_sqm.toString()).toLocaleString()} SEK/kvm` : 'Ej angivet'}</p>
        </Card>
        
        <Card className="p-4">
          <label className="text-sm font-medium text-muted-foreground">Äger mark</label>
          <p className="text-lg text-foreground">{evaluation?.owns_land === null ? 'Ej angivet' : evaluation.owns_land ? 'Ja' : 'Nej'}</p>
        </Card>
      </div>

      {evaluation?.underhållsplan && (
        <Card className="p-4">
          <label className="text-sm font-medium text-muted-foreground">Underhållsplan</label>
          <p className="text-foreground mt-2">{evaluation.underhållsplan}</p>
        </Card>
      )}
    </div>
  );

  const renderSummary = () => {
    const physicalAverage = calculatePhysicalAverage();
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Sammanfattning</h2>
          <p className="text-muted-foreground">Översikt av din utvärdering</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-secondary border-border">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Lägenhet</h3>
            </div>
            <p className="text-sm text-muted-foreground">{evaluation?.address || 'Ingen adress angiven'}</p>
            <p className="text-sm text-muted-foreground">
              {evaluation?.size && `${evaluation.size} kvm`} 
              {evaluation?.rooms && ` • ${evaluation.rooms} rum`}
            </p>
          </Card>

          <Card className="p-4 bg-secondary border-border">
            <div className="flex items-center gap-3 mb-2">
              <Euro className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-accent">Ekonomi</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {evaluation?.price ? `${parseInt(evaluation.price.toString()).toLocaleString()} SEK` : 'Inget pris angivet'}
            </p>
            <p className="text-sm text-muted-foreground">
              {evaluation?.monthly_fee && `${parseInt(evaluation.monthly_fee.toString()).toLocaleString()} SEK/mån`}
            </p>
          </Card>
        </div>

        <Card className="p-4 bg-secondary border-border">
          <div className="flex items-center gap-3 mb-3">
            <Star className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-primary">Fysisk bedömning</h3>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{physicalAverage.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Genomsnittligt betyg</p>
            <div className="flex justify-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-lg ${star <= physicalAverage ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        </Card>

        {evaluation?.comments && (
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-2">Kommentarer</h3>
            <p className="text-muted-foreground">{evaluation.comments}</p>
          </Card>
        )}
      </div>
    );
  };

  const renderCurrentSection = () => {
    switch (sections[currentSection]?.component) {
      case 'general':
        return renderGeneralInfo();
      case 'physical':
        return renderPhysicalAssessment();
      case 'financial':
        return renderFinancial();
      case 'summary':
        return renderSummary();
      default:
        return renderSummary();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Laddar utvärdering...</div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-4">Utvärdering hittades inte</h2>
          <Button onClick={() => navigate('/evaluations')}>
            Tillbaka till utvärderingar
          </Button>
        </div>
      </div>
    );
  }

  const progress = ((currentSection + 1) / sections.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/evaluations')}
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
          <h1 className="text-xl font-bold">Utvärdering - {evaluation.address || 'Utan adress'}</h1>
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
      <div className="p-4 pb-24">
        <Card className="bg-card shadow-lg border-0">
          <div className="p-6">
            {renderCurrentSection()}
          </div>
        </Card>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
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
            onClick={nextSection}
            disabled={currentSection === sections.length - 1}
            className="flex-1 h-12 bg-primary hover:bg-primary/90"
          >
            Nästa
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationDetail;