import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Wallet,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
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

interface ChartField {
  key: string;
  label: string;
  type: 'currency' | 'number' | 'percentage' | 'stars';
  unit?: string;
}

const AutoComparisonWidget: React.FC<AutoComparisonWidgetProps> = ({ evaluationId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [comparisonEvaluations, setComparisonEvaluations] = useState<Evaluation[]>([]);
  const [comparisonBase, setComparisonBase] = useState<ComparisonBase>('last-month');
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'value' | 'difference'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const chartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
    const feeComparisonArray = comparisonEvaluations
      .map(getFeePerSqm)
      .filter((v): v is number => v !== null);
    
    if (currentFee !== null && feeComparisonArray.length > 0) {
      const stats = computeStats(feeComparisonArray, currentFee, false);
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
    } else if (currentFee === null && feeComparisonArray.length > 0) {
      // Show comparison data even if current evaluation doesn't have fee data
      const average = feeComparisonArray.reduce((s, v) => s + v, 0) / feeComparisonArray.length;
      const best = Math.min(...feeComparisonArray);
      const worst = Math.max(...feeComparisonArray);
      
      metrics.push({
        name: 'Avgift per kvm',
        value: 0,
        average: average,
        best: best,
        worst: worst,
        percentile: 0,
        unit: 'SEK/kvm',
        icon: <Home className="h-4 w-4" />,
        betterCount: 0,
        total: feeComparisonArray.length,
        higherIsBetter: false,
      });
    }

    // 3) Skuld per kvm (lägre är bättre)
    const currentDebt = currentEvaluation.debt_per_sqm;
    const debtComparisonArray = comparisonEvaluations
      .map(e => e.debt_per_sqm as number | null)
      .filter((v): v is number => v !== null && v !== undefined);
    
    if (currentDebt !== null && currentDebt !== undefined && debtComparisonArray.length > 0) {
      const stats = computeStats(debtComparisonArray, currentDebt as number, false);
      if (stats) {
        metrics.push({
          name: 'Skuld per kvm',
          value: currentDebt as number,
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
    } else if ((currentDebt === null || currentDebt === undefined) && debtComparisonArray.length > 0) {
      // Show comparison data even if current evaluation doesn't have debt data
      const average = debtComparisonArray.reduce((s, v) => s + v, 0) / debtComparisonArray.length;
      const best = Math.min(...debtComparisonArray);
      const worst = Math.max(...debtComparisonArray);
      
      metrics.push({
        name: 'Skuld per kvm',
        value: 0,
        average: average,
        best: best,
        worst: worst,
        percentile: 0,
        unit: 'SEK/kvm',
        icon: <Banknote className="h-4 w-4" />,
        betterCount: 0,
        total: debtComparisonArray.length,
        higherIsBetter: false,
      });
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

  const getChartField = (metricName: string): ChartField | null => {
    const fieldMap: { [key: string]: ChartField } = {
      'Pris per kvm': { key: 'price_per_sqm', label: 'Pris per kvm', type: 'currency', unit: 'SEK/kvm' },
      'Avgift per kvm': { key: 'fee_per_sqm', label: 'Avgift per kvm', type: 'currency', unit: 'SEK/kvm' },
      'Skuld per kvm': { key: 'debt_per_sqm', label: 'Skuld per kvm', type: 'currency', unit: 'SEK/kvm' },
      'Kassaflöde per kvm': { key: 'cashflow_per_sqm', label: 'Kassaflöde per kvm', type: 'currency', unit: 'SEK/kvm' },
      'Fysisk bedömning': { key: 'physical_average', label: 'Fysisk bedömning', type: 'stars' }
    };
    return fieldMap[metricName] || null;
  };

  const handleMetricToggle = (metricName: string) => {
    const newExpanded = expandedMetric === metricName ? null : metricName;
    setExpandedMetric(newExpanded);
    
    if (newExpanded && chartRefs.current[metricName]) {
      setTimeout(() => {
        chartRefs.current[metricName]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 300);
    }
  };

  const getPerformanceColor = (metric: ComparisonMetric): string => {
    const { percentile, higherIsBetter } = metric;
    // För lägre-är-bättre mått (pris, avgift, skuld): hög percentil = dåligt
    // För högre-är-bättre mått (fysisk, kassaflöde): hög percentil = bra
    const effectivePercentile = higherIsBetter ? percentile : 100 - percentile;
    
    if (effectivePercentile >= 70) return 'text-semantic-good';
    if (effectivePercentile >= 40) return 'text-semantic-average';
    return 'text-semantic-bad';
  };

  const getPerformanceIcon = (metric: ComparisonMetric) => {
    const { value, average, higherIsBetter } = metric;
    const diff = Math.abs(value - average);
    const threshold = average * 0.05;
    
    if (diff < threshold) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    
    const isBetter = higherIsBetter ? value > average : value < average;
    const colorClass = isBetter ? 'text-semantic-good' : 'text-semantic-bad';
    const IconComponent = isBetter ? TrendingUp : TrendingDown;
    
    return <IconComponent className={`h-4 w-4 ${colorClass}`} />;
  };

  const getCircleColor = (metric: ComparisonMetric): string => {
    const { percentile, higherIsBetter } = metric;
    const effectivePercentile = higherIsBetter ? percentile : 100 - percentile;
    
    if (effectivePercentile >= 70) return 'hsl(var(--semantic-good))';
    if (effectivePercentile >= 40) return 'hsl(var(--semantic-average))';
    return 'hsl(var(--semantic-bad))';
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
        <div className="space-y-3">
          {comparisonMetrics.map((metric, index) => {
            const isExpanded = expandedMetric === metric.name;
            const performanceColor = getPerformanceColor(metric);
            const circleColor = getCircleColor(metric);
            
            const chartField = getChartField(metric.name);
            
            return (
              <Collapsible
                key={index}
                open={isExpanded}
                onOpenChange={() => handleMetricToggle(metric.name)}
              >
                <CollapsibleTrigger asChild>
                  <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer">
                    {/* Main Content */}
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        {/* Left Side - Main Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              {metric.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-sm">{metric.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {getPerformanceIcon(metric)}
                                <span className={`text-xs font-medium ${performanceColor}`}>
                                  {getComparisonText(metric)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Primary Value - Prominent */}
                          <div className="mb-2">
                            <div className="text-2xl font-bold text-foreground">
                              {formatValue(metric.value, metric.unit)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Snitt: {formatValue(metric.average, metric.unit)}
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Visual Indicator */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative w-16 h-16">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadialBarChart 
                                cx="50%" 
                                cy="50%" 
                                innerRadius="70%" 
                                outerRadius="90%" 
                                data={[{ value: metric.higherIsBetter ? metric.percentile : 100 - metric.percentile }]}
                                startAngle={90}
                                endAngle={-270}
                              >
                                <RadialBar 
                                  dataKey="value" 
                                  fill={circleColor}
                                  cornerRadius={10}
                                />
                              </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-xs font-bold ${performanceColor}`}>
                                {Math.round(metric.higherIsBetter ? metric.percentile : 100 - metric.percentile)}%
                              </span>
                            </div>
                          </div>
                          
                          {/* Expand/Collapse Icon */}
                          <div className="text-muted-foreground">
                            {isExpanded ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <div 
                    ref={(el) => chartRefs.current[metric.name] = el}
                    className="border-t border-border bg-secondary/20 p-5"
                  >
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Bästa värde:</span>
                          <span className="ml-2 font-medium text-semantic-good">
                            {formatValue(metric.best, metric.unit)}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Sämsta värde:</span>
                          <span className="ml-2 font-medium text-semantic-bad">
                            {formatValue(metric.worst, metric.unit)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Jämförelsegrupp:</span>
                          <span className="ml-2 font-medium">{metric.total} lägenheter</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Ranking:</span>
                          <span className={`ml-2 font-medium ${performanceColor}`}>
                            {metric.betterCount + 1} av {metric.total + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded mb-4">
                      {metric.name === 'Pris per kvm' && 'Priset per kvadratmeter jämfört med liknande lägenheter. Lägre värde är bättre.'}
                      {metric.name === 'Avgift per kvm' && 'Månadskostnaden per kvadratmeter. Lägre avgift ger lägre löpande kostnader.'}
                      {metric.name === 'Skuld per kvm' && 'Föreningens skuldsättning per kvadratmeter. Lägre skuld innebär mindre risk.'}
                      {metric.name === 'Kassaflöde per kvm' && 'Nettoflödet per kvadratmeter. Högre värde innebär bättre ekonomi.'}
                      {metric.name === 'Fysisk bedömning' && 'Genomsnittlig bedömning av lägenhetens fysiska egenskaper. Högre betyg är bättre.'}
                    </div>

                    {/* Comparison Table */}
                    {chartField && (() => {
                      const allEvaluations = [currentEvaluation, ...comparisonEvaluations];
                      const tableData = allEvaluations.map((evaluation, index) => {
                        let value: number;
                        
                        if (chartField.key === 'physical_average') {
                          value = calculatePhysicalAverage(evaluation);
                        } else if (chartField.key === 'fee_per_sqm') {
                          value = getFeePerSqm(evaluation) || 0;
                        } else {
                          value = evaluation[chartField.key as keyof Evaluation] as number || 0;
                        }

                        // Calculate percentage difference vs current evaluation
                        const currentValue = index === 0 ? value : metric.value;
                        let percentageDiff: string = '';
                        
                        if (index === 0) {
                          percentageDiff = '0%';
                        } else if (currentValue === 0) {
                          percentageDiff = '–';
                        } else {
                          const diff = ((value - currentValue) / currentValue) * 100;
                          const sign = diff >= 0 ? '+' : '';
                          percentageDiff = `${sign}${diff.toFixed(1)}%`;
                        }
                        
                        return {
                          id: evaluation.id,
                          address: evaluation.address || `Lägenhet ${index + 1}`,
                          value: value,
                          percentageDiff: percentageDiff,
                          isCurrent: index === 0
                        };
                      }).filter(item => item.value > 0);

                      // Sort the data
                      const sortedData = [...tableData].sort((a, b) => {
                        if (sortBy === 'value') {
                          // For better values first, sort desc if higher is better, asc if lower is better
                          const defaultOrder = metric.higherIsBetter ? 'desc' : 'asc';
                          const actualOrder = sortOrder || defaultOrder;
                          return actualOrder === 'desc' ? b.value - a.value : a.value - b.value;
                        } else {
                          // Sort by percentage difference
                          const aNum = parseFloat(a.percentageDiff.replace(/[+%–]/g, '')) || 0;
                          const bNum = parseFloat(b.percentageDiff.replace(/[+%–]/g, '')) || 0;
                          return sortOrder === 'desc' ? bNum - aNum : aNum - bNum;
                        }
                      });

                      const formatTableValue = (value: number) => {
                        if (chartField.type === 'currency') return `${Math.round(value).toLocaleString()}`;
                        if (chartField.type === 'stars') return `${value.toFixed(1)}`;
                        return value.toFixed(1);
                      };

                      const handleSort = (column: 'value' | 'difference') => {
                        if (sortBy === column) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy(column);
                          setSortOrder(column === 'value' ? (metric.higherIsBetter ? 'desc' : 'asc') : 'desc');
                        }
                      };

                      const getSortIcon = (column: 'value' | 'difference') => {
                        if (sortBy !== column) return <ArrowUpDown className="h-3 w-3" />;
                        return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
                      };

                      return (
                        <div className="w-full">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-left">Adress</TableHead>
                                <TableHead 
                                  className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => handleSort('value')}
                                >
                                  <div className="flex items-center justify-end gap-1">
                                    {metric.name}
                                    {getSortIcon('value')}
                                  </div>
                                </TableHead>
                                <TableHead 
                                  className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => handleSort('difference')}
                                >
                                  <div className="flex items-center justify-end gap-1">
                                    Skillnad (%)
                                    {getSortIcon('difference')}
                                  </div>
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedData.map((row) => (
                                <TableRow 
                                  key={row.id}
                                  className={row.isCurrent ? 'bg-primary/5 border-primary/20' : ''}
                                >
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      {row.isCurrent && <Badge variant="secondary" className="text-xs">Aktuell</Badge>}
                                      <span className={row.isCurrent ? 'font-semibold' : ''}>{row.address}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {formatTableValue(row.value)} {chartField.unit}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    <span className={
                                      row.percentageDiff === '0%' ? 'text-muted-foreground' :
                                      row.percentageDiff === '–' ? 'text-muted-foreground' :
                                      row.percentageDiff.startsWith('+') ? 
                                        (metric.higherIsBetter ? 'text-semantic-good' : 'text-semantic-bad') :
                                        (metric.higherIsBetter ? 'text-semantic-bad' : 'text-semantic-good')
                                    }>
                                      {row.percentageDiff}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })()}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default AutoComparisonWidget;