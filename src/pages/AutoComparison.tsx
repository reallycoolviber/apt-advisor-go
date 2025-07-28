import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Star, 
  Euro, 
  Home,
  BarChart3,
  Filter,
  Eye,
  RotateCcw
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Evaluation } from '@/components/comparison/types';
import { StandardizedCard } from '@/components/StandardizedCard';

type ComparisonBase = 'last-month' | 'similar-price' | 'custom';

interface ComparisonMetric {
  name: string;
  value: number;
  average: number;
  best: number;
  worst: number;
  percentile: number;
  unit: string;
  icon: React.ReactNode;
}

const AutoComparison = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [comparisonEvaluations, setComparisonEvaluations] = useState<Evaluation[]>([]);
  const [comparisonBase, setComparisonBase] = useState<ComparisonBase>('last-month');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Fetch the current evaluation and comparison data
  useEffect(() => {
    if (!user || !id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch the current evaluation
        const { data: currentEval, error: currentError } = await supabase
          .from('apartment_evaluations')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (currentError || !currentEval) {
          toast({
            title: "Fel",
            description: "Kunde inte hitta utvärderingen",
            variant: "destructive",
          });
          navigate('/evaluations');
          return;
        }

        setCurrentEvaluation(enhanceEvaluationWithComputed(currentEval));

        // Fetch comparison evaluations based on selected base
        await fetchComparisonEvaluations(currentEval);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Fel",
          description: "Kunde inte hämta jämförelsedata",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, id, comparisonBase]);

  const fetchComparisonEvaluations = async (currentEval: Evaluation) => {
    if (!user) return;

    let query = supabase
      .from('apartment_evaluations')
      .select('*')
      .eq('user_id', user.id)
      .neq('id', currentEval.id);

    switch (comparisonBase) {
      case 'last-month':
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        query = query.gte('created_at', lastMonth.toISOString());
        break;
      
      case 'similar-price':
        if (currentEval.price && currentEval.size) {
          const pricePerSqm = currentEval.price / currentEval.size;
          const tolerance = 0.2; // ±20%
          const minPrice = pricePerSqm * (1 - tolerance);
          const maxPrice = pricePerSqm * (1 + tolerance);
          
          // Filter by similar price per sqm (we'll do this client-side for now)
          const { data: allEvals } = await query;
          if (allEvals) {
            const filtered = allEvals.filter(evaluation => {
              if (!evaluation.price || !evaluation.size) return false;
              const evalPricePerSqm = evaluation.price / evaluation.size;
              return evalPricePerSqm >= minPrice && evalPricePerSqm <= maxPrice;
            });
            setComparisonEvaluations(filtered.map(enhanceEvaluationWithComputed));
          }
          return;
        }
        break;
    }

    const { data: evaluations } = await query;
    if (evaluations) {
      setComparisonEvaluations(evaluations.map(enhanceEvaluationWithComputed));
    }
  };

  const enhanceEvaluationWithComputed = (evaluation: any): Evaluation => {
    const enhanced = { ...evaluation };
    if (enhanced.price && enhanced.size) {
      enhanced.price_per_sqm = enhanced.price / enhanced.size;
    }
    return enhanced;
  };

  const calculatePhysicalAverage = (evaluation: Evaluation): number => {
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
    
    return ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
  };

  const calculateEconomicIndex = (evaluation: Evaluation): number => {
    // Economic index combining debt, fee, and cashflow per sqm
    const debt = evaluation.debt_per_sqm || 0;
    const fee = evaluation.fee_per_sqm || 0;
    const cashflow = evaluation.cashflow_per_sqm || 0;
    
    // Lower debt and fee is better, higher cashflow is better
    // Normalize to 0-10 scale
    const debtScore = Math.max(0, 10 - (debt / 1000));
    const feeScore = Math.max(0, 10 - (fee / 100));
    const cashflowScore = Math.max(0, Math.min(10, (cashflow + 100) / 20));
    
    return (debtScore + feeScore + cashflowScore) / 3;
  };

  const comparisonMetrics = useMemo(() => {
    if (!currentEvaluation || comparisonEvaluations.length === 0) return [];

    const metrics: ComparisonMetric[] = [];

    // Price per sqm comparison
    if (currentEvaluation.price_per_sqm) {
      const pricesPerSqm = comparisonEvaluations
        .map(e => e.price_per_sqm)
        .filter(Boolean) as number[];
      
      if (pricesPerSqm.length > 0) {
        pricesPerSqm.push(currentEvaluation.price_per_sqm);
        pricesPerSqm.sort((a, b) => a - b);
        const rank = pricesPerSqm.indexOf(currentEvaluation.price_per_sqm) + 1;
        const percentile = Math.round((rank / pricesPerSqm.length) * 100);

        metrics.push({
          name: 'Pris per kvadratmeter',
          value: currentEvaluation.price_per_sqm,
          average: pricesPerSqm.reduce((sum, p) => sum + p, 0) / pricesPerSqm.length,
          best: Math.min(...pricesPerSqm),
          worst: Math.max(...pricesPerSqm),
          percentile,
          unit: 'SEK/kvm',
          icon: <Euro className="h-5 w-5" />
        });
      }
    }

    // Physical rating comparison
    const currentPhysical = calculatePhysicalAverage(currentEvaluation);
    if (currentPhysical > 0) {
      const physicalRatings = comparisonEvaluations
        .map(calculatePhysicalAverage)
        .filter(r => r > 0);
      
      if (physicalRatings.length > 0) {
        physicalRatings.push(currentPhysical);
        physicalRatings.sort((a, b) => b - a); // Higher is better
        const rank = physicalRatings.indexOf(currentPhysical) + 1;
        const percentile = Math.round(((physicalRatings.length - rank + 1) / physicalRatings.length) * 100);

        metrics.push({
          name: 'Fysisk bedömning',
          value: currentPhysical,
          average: physicalRatings.reduce((sum, r) => sum + r, 0) / physicalRatings.length,
          best: Math.max(...physicalRatings),
          worst: Math.min(...physicalRatings),
          percentile,
          unit: '/5',
          icon: <Star className="h-5 w-5" />
        });
      }
    }

    // Economic index comparison
    const currentEconomic = calculateEconomicIndex(currentEvaluation);
    const economicIndexes = comparisonEvaluations
      .map(calculateEconomicIndex)
      .filter(i => i > 0);
    
    if (economicIndexes.length > 0) {
      economicIndexes.push(currentEconomic);
      economicIndexes.sort((a, b) => b - a); // Higher is better
      const rank = economicIndexes.indexOf(currentEconomic) + 1;
      const percentile = Math.round(((economicIndexes.length - rank + 1) / economicIndexes.length) * 100);

      metrics.push({
        name: 'Ekonomisk bedömning',
        value: currentEconomic,
        average: economicIndexes.reduce((sum, i) => sum + i, 0) / economicIndexes.length,
        best: Math.max(...economicIndexes),
        worst: Math.min(...economicIndexes),
        percentile,
        unit: '/10',
        icon: <BarChart3 className="h-5 w-5" />
      });
    }

    return metrics;
  }, [currentEvaluation, comparisonEvaluations]);

  const formatValue = (value: number, unit: string): string => {
    if (unit === 'SEK/kvm') {
      return `${Math.round(value).toLocaleString()} ${unit}`;
    }
    return `${value.toFixed(1)}${unit}`;
  };

  const getTrendIcon = (value: number, average: number, higherIsBetter: boolean = true) => {
    const isAboveAverage = value > average;
    const isGood = higherIsBetter ? isAboveAverage : !isAboveAverage;
    
    if (Math.abs(value - average) < 0.01) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    
    return isGood ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getComparisonBaseLabel = (base: ComparisonBase): string => {
    switch (base) {
      case 'last-month': return 'Senaste månadens utvärderingar';
      case 'similar-price': return 'Liknande pris per kvadratmeter';
      case 'custom': return 'Anpassad jämförelse';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentEvaluation) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Utvärdering hittades inte</h2>
          <Button onClick={() => navigate('/evaluations')}>
            Tillbaka till utvärderingar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/evaluations')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tillbaka
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Automatisk jämförelse</h1>
              <p className="text-muted-foreground">
                {currentEvaluation.address || 'Ingen adress'}
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Base Selection */}
        <StandardizedCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Jämförelsesgrund</h3>
            <Filter className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'last-month' as ComparisonBase, label: 'Senaste månaden', icon: <RotateCcw className="h-4 w-4" /> },
              { key: 'similar-price' as ComparisonBase, label: 'Liknande pris/kvm', icon: <Euro className="h-4 w-4" /> },
            ].map(option => (
              <Button
                key={option.key}
                variant={comparisonBase === option.key ? "default" : "outline"}
                size="sm"
                onClick={() => setComparisonBase(option.key)}
                className="flex items-center gap-2"
              >
                {option.icon}
                {option.label}
              </Button>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground">
            Jämför mot: <span className="font-medium">{getComparisonBaseLabel(comparisonBase)}</span>
            <br />
            Antal jämförelseobjekt: <span className="font-medium">{comparisonEvaluations.length}</span>
          </div>
        </StandardizedCard>

        {/* Metrics Overview */}
        {comparisonMetrics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comparisonMetrics.map((metric, index) => (
              <StandardizedCard key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {metric.icon}
                      <h3 className="font-semibold text-foreground">{metric.name}</h3>
                    </div>
                    <Badge variant={metric.percentile >= 70 ? "default" : metric.percentile >= 30 ? "secondary" : "destructive"}>
                      Top {100 - metric.percentile}%
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ditt värde:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-foreground">
                          {formatValue(metric.value, metric.unit)}
                        </span>
                        {getTrendIcon(
                          metric.value, 
                          metric.average, 
                          metric.name !== 'Pris per kvadratmeter' // Price per sqm: lower is better
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Snitt:</span>
                        <span>{formatValue(metric.average, metric.unit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bästa:</span>
                        <span>{formatValue(metric.best, metric.unit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sämsta:</span>
                        <span>{formatValue(metric.worst, metric.unit)}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="w-full h-20">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="90%"
                            data={[{ value: metric.percentile, max: 100 }]}
                            startAngle={180}
                            endAngle={0}
                          >
                            <RadialBar
                              dataKey="value"
                              cornerRadius={10}
                              fill={metric.percentile >= 70 ? '#22c55e' : metric.percentile >= 30 ? '#f59e0b' : '#ef4444'}
                            />
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 text-center">
                        Bättre än {metric.percentile}% av jämförelserna
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedMetric(selectedMetric === metric.name ? null : metric.name)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {selectedMetric === metric.name ? 'Dölj detaljer' : 'Visa detaljer'}
                  </Button>
                </div>
              </StandardizedCard>
            ))}
          </div>
        ) : (
          <StandardizedCard>
            <div className="text-center py-8">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Inga jämförelser tillgängliga</h3>
              <p className="text-muted-foreground mb-4">
                Det finns inga andra utvärderingar att jämföra med baserat på din valda jämförelsesgrund.
              </p>
              <Button onClick={() => navigate('/evaluate')}>
                Skapa ny utvärdering
              </Button>
            </div>
          </StandardizedCard>
        )}

        {/* Detailed View */}
        {selectedMetric && (
          <StandardizedCard>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Detaljerad vy: {selectedMetric}
            </h3>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Kommer snart: Detaljerad lista över alla jämförelseobjekt med rangordning och exakta värden.
              </div>
            </div>
          </StandardizedCard>
        )}
      </div>
    </div>
  );
};

export default AutoComparison;