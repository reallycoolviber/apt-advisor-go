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
  Filter,
  Banknote,
  Wallet
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
  betterCount: number;
  total: number;
  higherIsBetter: boolean;
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

  // Hjälpfunktioner
  const getFeePerSqm = (e: Evaluation): number | null => {
    if (e.fee_per_sqm !== null && e.fee_per_sqm !== undefined) return e.fee_per_sqm;
    if (e.monthly_fee && e.size) return e.monthly_fee / e.size;
    return null;
  };

  const computeStats = (
    values: number[],
    current: number,
    higherIsBetter: boolean
  ) => {
    const clean = values.filter(v => Number.isFinite(v));
    const total = clean.length;
    if (total === 0) return null as any;
    const average = clean.reduce((s, v) => s + v, 0) / total;
    const best = higherIsBetter ? Math.max(...clean) : Math.min(...clean);
    const worst = higherIsBetter ? Math.min(...clean) : Math.max(...clean);
    const betterCount = higherIsBetter
      ? clean.filter(v => v < current).length
      : clean.filter(v => v > current).length;
    const percentile = (betterCount / total) * 100;
    return { average, best, worst, betterCount, total, percentile };
  };

  const comparisonMetrics = useMemo(() => {
    if (!currentEvaluation || comparisonEvaluations.length === 0) return [] as ComparisonMetric[];

    const metrics: ComparisonMetric[] = [];

    // 1) Pris per kvm (lägre är bättre)
    if (currentEvaluation.price_per_sqm) {
      const arr = comparisonEvaluations
        .map(e => e.price_per_sqm as number | null)
        .filter((v): v is number => v !== null && v !== undefined);
      const stats = computeStats(arr, currentEvaluation.price_per_sqm, false);
      if (stats) {
        metrics.push({
          name: 'Pris per kvm',
          value: currentEvaluation.price_per_sqm,
          average: stats.average,
          best: stats.best,
          worst: stats.worst,
          percentile: stats.percentile,
          unit: 'SEK/kvm',
          icon: <Euro className="h-4 w-4" />,
          betterCount: stats.betterCount,
          total: stats.total,
          higherIsBetter: false,
        });
      }
    }

    // 2) Avgift per kvm (lägre är bättre)
    const currentFee = getFeePerSqm(currentEvaluation);
    if (currentFee !== null) {
      const arr = comparisonEvaluations
        .map(getFeePerSqm)
        .filter((v): v is number => v !== null);
      const stats = computeStats(arr, currentFee, false);
      if (stats) {
        metrics.push({
          name: 'Avgift per kvm',
          value: currentFee,
          average: stats.average,
          best: stats.best,
          worst: stats.worst,
          percentile: stats.percentile,
          unit: 'SEK/kvm',
          icon: <Home className="h-4 w-4" />,
          betterCount: stats.betterCount,
          total: stats.total,
          higherIsBetter: false,
        });
      }
    }

    // 3) Skuld per kvm (lägre är bättre)
    if (currentEvaluation.debt_per_sqm !== null && currentEvaluation.debt_per_sqm !== undefined) {
      const currentDebt = currentEvaluation.debt_per_sqm as number;
      const arr = comparisonEvaluations
        .map(e => e.debt_per_sqm as number | null)
        .filter((v): v is number => v !== null && v !== undefined);
      const stats = computeStats(arr, currentDebt, false);
      if (stats) {
        metrics.push({
          name: 'Skuld per kvm',
          value: currentDebt,
          average: stats.average,
          best: stats.best,
          worst: stats.worst,
          percentile: stats.percentile,
          unit: 'SEK/kvm',
          icon: <Banknote className="h-4 w-4" />,
          betterCount: stats.betterCount,
          total: stats.total,
          higherIsBetter: false,
        });
      }
    }

    // 4) Kassaflöde per kvm (högre är bättre)
    if (currentEvaluation.cashflow_per_sqm !== null && currentEvaluation.cashflow_per_sqm !== undefined) {
      const currentCash = currentEvaluation.cashflow_per_sqm as number;
      const arr = comparisonEvaluations
        .map(e => e.cashflow_per_sqm as number | null)
        .filter((v): v is number => v !== null && v !== undefined);
      const stats = computeStats(arr, currentCash, true);
      if (stats) {
        metrics.push({
          name: 'Kassaflöde per kvm',
          value: currentCash,
          average: stats.average,
          best: stats.best,
          worst: stats.worst,
          percentile: stats.percentile,
          unit: 'SEK/kvm',
          icon: <Wallet className="h-4 w-4" />,
          betterCount: stats.betterCount,
          total: stats.total,
          higherIsBetter: true,
        });
      }
    }

    // 5) Fysisk bedömning (högre är bättre)
    const currentPhysical = calculatePhysicalAverage(currentEvaluation);
    if (currentPhysical > 0) {
      const arr = comparisonEvaluations
        .map(calculatePhysicalAverage)
        .filter(v => v > 0);
      const stats = computeStats(arr, currentPhysical, true);
      if (stats) {
        metrics.push({
          name: 'Fysisk bedömning',
          value: currentPhysical,
          average: stats.average,
          best: stats.best,
          worst: stats.worst,
          percentile: stats.percentile,
          unit: '/5',
          icon: <Star className="h-4 w-4" />,
          betterCount: stats.betterCount,
          total: stats.total,
          higherIsBetter: true,
        });
      }
    }

    return metrics;
  }, [currentEvaluation, comparisonEvaluations]);

  const getComparisonText = (metric: ComparisonMetric): string => {
    if (metric.total <= 10) {
      return `bättre än ${metric.betterCount} av ${metric.total}`;
    }
    return `${Math.round(metric.percentile)}:e percentilen`;
  };

  const formatValue = (value: number, unit: string): string => {
    if (unit === 'SEK/kvm') {
      return `${Math.round(value).toLocaleString()} ${unit}`;
    }
    return `${value.toFixed(1)}${unit}`;
  };

  const getTrendIcon = (metric: ComparisonMetric) => {
    const value = metric.value;
    const average = metric.average;
    const diff = Math.abs(value - average);
    const threshold = average * 0.05; // 5% threshold
    
    if (diff < threshold) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    
    const isBetter = metric.higherIsBetter ? value > average : value < average;
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
                  {getTrendIcon(metric)}
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
                      {getComparisonText(metric)}
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