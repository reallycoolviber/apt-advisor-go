import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { Evaluation, ComparisonField } from '@/components/comparison/types';
import { COMPARISON_FIELDS_WITH_COMPUTED } from '@/components/comparison/constants';
import { ComparisonCategoryCard } from '@/components/comparison/ComparisonCategoryCard';
import { formatValue as formatDisplayValue } from '@/utils/formatValue';
import { Star } from 'lucide-react';

const ComparisonView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const calculatePricePerSqm = (evaluation: Evaluation): number | null => {
    if (!evaluation.price || !evaluation.size || evaluation.size === 0) return null;
    return evaluation.price / evaluation.size;
  };

  const enhanceEvaluationWithComputed = (evaluation: Evaluation): Evaluation => {
    return {
      ...evaluation,
      price_per_sqm: calculatePricePerSqm(evaluation)
    };
  };

  const formatValue = (value: any, field: ComparisonField) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground text-sm">—</span>;
    }

    if (field.type === 'rating') {
      const numValue = typeof value === 'number' ? value : 0;
      return (
        <div className="flex items-center gap-2 justify-center">
          <span className="font-semibold text-sm min-w-8">{numValue.toFixed(1)}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${
                  star <= numValue 
                    ? 'text-yellow-500 fill-yellow-500' 
                    : 'text-gray-300 fill-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      );
    }

    if (field.type === 'boolean') {
      return value ? (
        <span className="text-emerald-600 font-medium">Ja</span>
      ) : (
        <span className="text-red-500 font-medium">Nej</span>
      );
    }

    const mapKeyToType = (key: string): string => {
      switch (key) {
        case 'price': return 'price';
        case 'monthly_fee': return 'fee';
        case 'size': return 'area';
        case 'rooms': return 'rooms';
        case 'debt_per_sqm': return 'debt_per_sqm';
        case 'fee_per_sqm':
        case 'cashflow_per_sqm':
        case 'price_per_sqm':
          return 'fee_per_sqm';
        default:
          return 'number';
      }
    };

    const display = formatDisplayValue(value, mapKeyToType(field.key as string));

    if (field.type === 'currency') {
      return <span className="font-medium text-emerald-700">{display}</span>;
    }

    if (field.type === 'number') {
      return <span className="font-medium">{display}</span>;
    }

    return <span className="text-left">{display}</span>;
  };

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
        
        const enhancedData = (data || []).map(enhanceEvaluationWithComputed);
        setEvaluations(enhancedData);
      } catch (err) {
        console.error('Error fetching evaluations:', err);
        setError("Kunde inte ladda dina utvärderingar. Försök igen senare.");
        toast({
          title: "Fel",
          description: "Kunde inte ladda dina utvärderingar. Försök igen senare.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [user, toast]);

  // Category configurations in the specified order
  const categories = [
    {
      title: 'Pris per kvm',
      fields: COMPARISON_FIELDS_WITH_COMPUTED.filter(f => f.key === 'price_per_sqm')
    },
    {
      title: 'Avgift per kvm',
      fields: COMPARISON_FIELDS_WITH_COMPUTED.filter(f => f.key === 'fee_per_sqm')
    },
    {
      title: 'Skuld per kvm',
      fields: COMPARISON_FIELDS_WITH_COMPUTED.filter(f => f.key === 'debt_per_sqm')
    },
    {
      title: 'Kassaflöde per kvm',
      fields: COMPARISON_FIELDS_WITH_COMPUTED.filter(f => f.key === 'cashflow_per_sqm')
    },
    {
      title: 'Fysisk bedömning',
      fields: COMPARISON_FIELDS_WITH_COMPUTED.filter(f => f.category === 'physical')
    }
  ];

  // Loading state
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
            <h1 className="text-xl font-semibold">Jämförelse</h1>
          </div>
        </div>
        <div className="p-4 relative z-10">
          <LoadingSkeleton type="card" rows={3} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const handleRetry = () => {
      setError(null);
      setLoading(true);
    };

    return (
      <div className="min-h-screen bg-background relative">
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
            <h1 className="text-xl font-semibold">Jämförelse</h1>
          </div>
        </div>
        <div className="p-4 relative z-10">
          <ErrorState 
            title="Kunde inte ladda utvärderingar"
            message={error}
            onRetry={handleRetry}
            size="lg"
          />
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-background relative">
      {/* Background cityscape */}
      <div className="absolute inset-0 opacity-15 bg-no-repeat bg-center bg-cover"
           style={{ backgroundImage: "url('/src/assets/cityscape-neutral.png')" }}>
      </div>
      
      {/* Header */}
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
          <h1 className="text-xl font-semibold">Jämförelse</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4 relative z-10">
        {evaluations.length === 0 ? (
          <Card className="bg-card shadow-lg border-0 p-6 text-center">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Inga utvärderingar att jämföra</h3>
            <p className="text-muted-foreground mb-4">
              Du behöver skapa minst två utvärderingar för att kunna jämföra dem.
            </p>
            <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Skapa din första utvärdering
            </Button>
          </Card>
        ) : evaluations.length < 2 ? (
          <Card className="bg-card shadow-lg border-0 p-6 text-center">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Bara en utvärdering</h3>
            <p className="text-muted-foreground mb-4">
              Du behöver minst två utvärderingar för att kunna jämföra dem.
            </p>
            <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Skapa en till utvärdering
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                Jämför dina {evaluations.length} utvärderingar genom att expandera kategorierna nedan
              </p>
            </div>
            
            {categories.map((category, index) => (
              <ComparisonCategoryCard
                key={category.title}
                title={category.title}
                evaluations={evaluations}
                fields={category.fields}
                calculatePhysicalAverage={calculatePhysicalAverage}
                formatValue={formatValue}
                defaultExpanded={index === 0} // Expand first category by default
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonView;