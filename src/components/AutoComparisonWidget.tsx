import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Star, 
  Euro, 
  Home,
  BarChart3,
  Filter
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts';
import { Evaluation } from '@/components/comparison/types';

type ComparisonBase = 'last-month' | 'similar-price';

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

interface AutoComparisonWidgetProps {
  evaluationId: string;
}

const AutoComparisonWidget: React.FC<AutoComparisonWidgetProps> = ({ evaluationId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [comparisonEvaluations, setComparisonEvaluations] = useState<Evaluation[]>([]);
  const [comparisonBase, setComparisonBase] = useState<ComparisonBase>('last-month');

  // Fetch current evaluation
  useEffect(() => {
    const fetchCurrentEvaluation = async () => {
      if (!user || !evaluationId) return;

      try {
        const { data: evaluation, error } = await supabase
          .from('apartment_evaluations')
          .select('*')
          .eq('id', evaluationId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        
        if (evaluation) {
          const enhanced = enhanceEvaluationWithComputed(evaluation);
          setCurrentEvaluation(enhanced);
        }
      } catch (error) {
        console.error('Error fetching current evaluation:', error);
      }
    };

    fetchCurrentEvaluation();
  }, [user, evaluationId]);

  // Fetch comparison evaluations
  useEffect(() => {
    const fetchComparisonEvaluations = async () => {
      if (!user || !currentEvaluation) return;

      try {
        let query = supabase
          .from('apartment_evaluations')
          .select('*')
          .eq('user_id', user.id)
          .neq('id', evaluationId)
          .eq('is_draft', false);

        if (comparisonBase === 'last-month') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          query = query.gte('created_at', oneMonthAgo.toISOString());
        } else if (comparisonBase === 'similar-price' && currentEvaluation.price) {
          const priceRange = currentEvaluation.price * 0.2; // ±20%
          query = query
            .gte('price', currentEvaluation.price - priceRange)
            .lte('price', currentEvaluation.price + priceRange);
        }

        const { data: evaluations, error } = await query.limit(10);

        if (error) throw error;

        const enhanced = evaluations?.map(enhanceEvaluationWithComputed) || [];
        setComparisonEvaluations(enhanced);
      } catch (error) {
        console.error('Error fetching comparison evaluations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonEvaluations();
  }, [user, currentEvaluation, comparisonBase, evaluationId]);

  const enhanceEvaluationWithComputed = (evaluation: any): Evaluation => {
    const enhanced = { ...evaluation };
    if (enhanced.size && enhanced.price) {
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
    ].filter(rating => rating && rating > 0);
    
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  };

  const calculateEconomicIndex = (evaluation: Evaluation): number => {
    let score = 0;
    let factors = 0;

    if (evaluation.debt_per_sqm !== null && evaluation.debt_per_sqm !== undefined) {
      score += Math.max(0, 5 - (evaluation.debt_per_sqm / 10000));
      factors++;
    }

    if (evaluation.fee_per_sqm !== null && evaluation.fee_per_sqm !== undefined) {
      score += Math.max(0, 5 - (evaluation.fee_per_sqm / 100));
      factors++;
    }

    if (evaluation.cashflow_per_sqm !== null && evaluation.cashflow_per_sqm !== undefined) {
      score += Math.min(5, Math.max(0, (evaluation.cashflow_per_sqm + 500) / 100));
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  };

  const comparisonMetrics = useMemo(() => {
    if (!currentEvaluation || comparisonEvaluations.length === 0) return [];

    const metrics: ComparisonMetric[] = [];

    // Price per sqm metric
    if (currentEvaluation.price_per_sqm) {
      const pricesPerSqm = comparisonEvaluations
        .map(e => e.price_per_sqm)
        .filter(p => p !== null && p !== undefined) as number[];
      
      if (pricesPerSqm.length > 0) {
        const average = pricesPerSqm.reduce((sum, p) => sum + p, 0) / pricesPerSqm.length;
        const best = Math.min(...pricesPerSqm);
        const worst = Math.max(...pricesPerSqm);
        const sorted = [...pricesPerSqm].sort((a, b) => a - b);
        const rank = sorted.filter(p => p <= currentEvaluation.price_per_sqm!).length;
        const percentile = (rank / sorted.length) * 100;

        metrics.push({
          name: 'Pris per kvm',
          value: currentEvaluation.price_per_sqm,
          average,
          best,
          worst,
          percentile,
          unit: 'SEK/kvm',
          icon: <Euro className="h-4 w-4" />
        });
      }
    }

    // Physical rating metric
    const currentPhysical = calculatePhysicalAverage(currentEvaluation);
    if (currentPhysical > 0) {
      const physicalRatings = comparisonEvaluations
        .map(calculatePhysicalAverage)
        .filter(r => r > 0);
      
      if (physicalRatings.length > 0) {
        const average = physicalRatings.reduce((sum, r) => sum + r, 0) / physicalRatings.length;
        const best = Math.max(...physicalRatings);
        const worst = Math.min(...physicalRatings);
        const sorted = [...physicalRatings].sort((a, b) => b - a);
        const rank = sorted.filter(r => r <= currentPhysical).length;
        const percentile = ((sorted.length - rank) / sorted.length) * 100;

        metrics.push({
          name: 'Fysisk bedömning',
          value: currentPhysical,
          average,
          best,
          worst,
          percentile,
          unit: '/5',
          icon: <Star className="h-4 w-4" />
        });
      }
    }

    // Economic index metric
    const currentEconomic = calculateEconomicIndex(currentEvaluation);
    if (currentEconomic > 0) {
      const economicRatings = comparisonEvaluations
        .map(calculateEconomicIndex)
        .filter(r => r > 0);
      
      if (economicRatings.length > 0) {
        const average = economicRatings.reduce((sum, r) => sum + r, 0) / economicRatings.length;
        const best = Math.max(...economicRatings);
        const worst = Math.min(...economicRatings);
        const sorted = [...economicRatings].sort((a, b) => b - a);
        const rank = sorted.filter(r => r <= currentEconomic).length;
        const percentile = ((sorted.length - rank) / sorted.length) * 100;

        metrics.push({
          name: 'Ekonomisk bedömning',
          value: currentEconomic,
          average,
          best,
          worst,
          percentile,
          unit: '/5',
          icon: <BarChart3 className="h-4 w-4" />
        });
      }
    }

    return metrics;
  }, [currentEvaluation, comparisonEvaluations]);

  const formatValue = (value: number, unit: string): string => {
    if (unit === 'SEK/kvm') {
      return `${Math.round(value).toLocaleString()} ${unit}`;
    }
    return `${value.toFixed(1)}${unit}`;
  };

  const getTrendIcon = (value: number, average: number, isHigherBetter: boolean = false) => {
    const diff = Math.abs(value - average);
    const threshold = average * 0.05; // 5% threshold
    
    if (diff < threshold) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    
    const isBetter = isHigherBetter ? value > average : value < average;
    return isBetter 
      ? <TrendingUp className="h-4 w-4 text-green-500" />
      : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getComparisonBaseLabel = (base: ComparisonBase): string => {
    switch (base) {
      case 'last-month': return 'Senaste månaden';
      case 'similar-price': return 'Liknande pris';
      default: return 'Anpassad';
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border shadow-md">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!currentEvaluation) {
    return (
      <Card className="bg-card border shadow-md">
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Kunde inte ladda utvärderingen</p>
        </div>
      </Card>
    );
  }

  if (comparisonEvaluations.length === 0) {
    return (
      <Card className="bg-card border shadow-md">
        <div className="p-6 text-center">
          <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Ingen jämförelsedata tillgänglig</p>
          <p className="text-xs text-muted-foreground mt-1">
            Skapa fler utvärderingar för att se jämförelser
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card border shadow-md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Jämförelse</h3>
          <Badge variant="secondary" className="text-xs">
            {getComparisonBaseLabel(comparisonBase)} ({comparisonEvaluations.length})
          </Badge>
        </div>

        {/* Comparison Base Selection */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={comparisonBase === 'last-month' ? "default" : "outline"}
            size="sm"
            onClick={() => setComparisonBase('last-month')}
            className="text-xs"
          >
            Senaste månaden
          </Button>
          <Button
            variant={comparisonBase === 'similar-price' ? "default" : "outline"}
            size="sm"
            onClick={() => setComparisonBase('similar-price')}
            className="text-xs"
            disabled={!currentEvaluation.price}
          >
            Liknande pris
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4">
          {comparisonMetrics.map((metric, index) => {
            const isHigherBetter = metric.name === 'Fysisk bedömning' || metric.name === 'Ekonomisk bedömning';
            const chartData = [{
              name: metric.name,
              value: metric.percentile,
              fill: metric.percentile >= 50 ? '#10b981' : '#ef4444'
            }];

            return (
              <div key={index} className="p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {metric.icon}
                    <span className="text-sm font-medium">{metric.name}</span>
                  </div>
                  {getTrendIcon(metric.value, metric.average, isHigherBetter)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-lg font-bold text-foreground">
                      {formatValue(metric.value, metric.unit)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Snitt: {formatValue(metric.average, metric.unit)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metric.percentile.toFixed(0)}:e percentilen
                    </div>
                  </div>
                  
                  <div className="h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={chartData}>
                        <RadialBar dataKey="value" fill={chartData[0].fill} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default AutoComparisonWidget;