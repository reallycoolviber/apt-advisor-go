import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useEvaluationStore } from '@/stores/evaluationStore';
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
  ArrowDown,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  // No props needed - uses store as single source of truth
}

interface ChartField {
  key: string;
  label: string;
  type: 'currency' | 'number' | 'percentage' | 'stars';
  unit?: string;
}

const AutoComparisonWidget: React.FC<AutoComparisonWidgetProps> = () => {
  const { user } = useAuth();
  const { currentEvaluation, currentEvaluationId } = useEvaluationStore();
  
  console.log('AutoComparisonWidget: Using store evaluation:', currentEvaluation?.address, 'ID:', currentEvaluationId);
  
  const [loading, setLoading] = useState(true);
  const [comparisonEvaluations, setComparisonEvaluations] = useState<Evaluation[]>([]);
  const [comparisonBase, setComparisonBase] = useState<ComparisonBase>('last-month');
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'value' | 'difference'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const chartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Convert currentEvaluation to Evaluation type with computed fields
  const enhanceEvaluationWithComputed = (evaluation: any): Evaluation => {
    const enhanced = { ...evaluation };
    if (enhanced.size && enhanced.price) {
      enhanced.price_per_sqm = enhanced.price / enhanced.size;
    }
    return enhanced;
  };

  // Get enhanced current evaluation from store data
  const enhancedCurrentEvaluation = useMemo(() => {
    if (!currentEvaluation || !currentEvaluationId) return null;
    
    // Convert EvaluationFormData to Evaluation type
    const evaluation: Evaluation = {
      id: currentEvaluationId,
      address: currentEvaluation.address || '',
      size: parseFloat(currentEvaluation.general?.size || '0') || null,
      price: parseFloat(currentEvaluation.general?.price || '0') || null,
      monthly_fee: parseFloat(currentEvaluation.general?.monthlyFee || '0') || null,
      planlösning: currentEvaluation.physical?.planlösning || null,
      kitchen: currentEvaluation.physical?.kitchen || null,
      bathroom: currentEvaluation.physical?.bathroom || null,
      bedrooms: currentEvaluation.physical?.bedrooms || null,
      surfaces: currentEvaluation.physical?.surfaces || null,
      förvaring: currentEvaluation.physical?.förvaring || null,
      ljusinsläpp: currentEvaluation.physical?.ljusinsläpp || null,
      balcony: currentEvaluation.physical?.balcony || null,
      debt_per_sqm: parseFloat(currentEvaluation.financial?.debtPerSqm || '0') || null,
      fee_per_sqm: null, // Will be computed below
      cashflow_per_sqm: parseFloat(currentEvaluation.financial?.cashflowPerSqm || '0') || null,
      // Add other required fields with defaults
      rooms: currentEvaluation.general?.rooms || null,
      owns_land: currentEvaluation.financial?.ownsLand || null,
      created_at: new Date().toISOString()
    };
    
    return enhanceEvaluationWithComputed(evaluation);
  }, [currentEvaluation, currentEvaluationId, user?.id]);

  // Fetch comparison evaluations - no need to fetch current evaluation as it comes from store
  useEffect(() => {
    const fetchComparisonEvaluations = async () => {
      console.log('AutoComparisonWidget: fetchComparisonEvaluations called with:', { 
        user: !!user, 
        currentEvaluation: !!currentEvaluation,
        currentEvaluationId 
      });
      
      if (!user || !currentEvaluation || !currentEvaluationId) {
        console.log('AutoComparisonWidget: Missing required data, skipping fetch');
        setLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('apartment_evaluations')
          .select('*')
          .eq('user_id', user.id)
          .neq('id', currentEvaluationId);

        if (comparisonBase === 'last-month') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          query = query.gte('created_at', oneMonthAgo.toISOString());
        } else if (comparisonBase === 'similar-price' && enhancedCurrentEvaluation?.price) {
          const priceRange = enhancedCurrentEvaluation.price * 0.2; // ±20%
          query = query
            .gte('price', enhancedCurrentEvaluation.price - priceRange)
            .lte('price', enhancedCurrentEvaluation.price + priceRange);
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
  }, [user, currentEvaluation, currentEvaluationId, comparisonBase, enhancedCurrentEvaluation]);

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
    if (!enhancedCurrentEvaluation || comparisonEvaluations.length === 0) return [] as ComparisonMetric[];

    console.log('AutoComparison: Building metrics for', enhancedCurrentEvaluation.address);
    console.log('AutoComparison: Comparison evaluations count:', comparisonEvaluations.length);
    
    const metrics: ComparisonMetric[] = [];

    // 1) Pris per kvm (lägre är bättre)
    if (enhancedCurrentEvaluation.price_per_sqm) {
      const arr = comparisonEvaluations
        .map(e => e.price_per_sqm as number | null)
        .filter((v): v is number => v !== null && v !== undefined);
      const stats = computeStats(arr, enhancedCurrentEvaluation.price_per_sqm, false);
      if (stats) {
        metrics.push({
          name: 'Pris per kvm',
          value: enhancedCurrentEvaluation.price_per_sqm,
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
    console.log('AutoComparison: Checking avgift per kvm for', enhancedCurrentEvaluation.address);
    
    const currentFee = getFeePerSqm(enhancedCurrentEvaluation);
    const feeComparisonArray = comparisonEvaluations
      .map(getFeePerSqm)
      .filter((v): v is number => v !== null);
    
    console.log('AutoComparison: currentFee:', currentFee, 'feeComparisonArray:', feeComparisonArray);
    
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
    } else {
      // Show card even without comparison data to indicate missing information
      metrics.push({
        name: 'Avgift per kvm',
        value: currentFee || 0,
        average: 0,
        best: 0,
        worst: 0,
        percentile: 0,
        unit: 'SEK/kvm',
        icon: <Home className="h-4 w-4" />,
        betterCount: 0,
        total: 0,
        higherIsBetter: false,
      });
    }

    // 3) Skuld per kvm (lägre är bättre)
    console.log('AutoComparison: Checking skuld per kvm for', enhancedCurrentEvaluation.address);

    const currentDebt = enhancedCurrentEvaluation.debt_per_sqm;
    const debtComparisonArray = comparisonEvaluations
      .map(e => e.debt_per_sqm as number | null)
      .filter((v): v is number => v !== null && v !== undefined);
    
    console.log('AutoComparison: currentDebt:', currentDebt, 'debtComparisonArray:', debtComparisonArray);
    
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
    } else {
      // Show card even without comparison data to indicate missing information
      metrics.push({
        name: 'Skuld per kvm',
        value: 0,
        average: 0,
        best: 0,
        worst: 0,
        percentile: 0,
        unit: 'SEK/kvm',
        icon: <Banknote className="h-4 w-4" />,
        betterCount: 0,
        total: 0,
        higherIsBetter: false,
      });
    }

    // 4) Kassaflöde per kvm (högre är bättre)
    console.log('AutoComparison: Checking kassaflöde per kvm for', enhancedCurrentEvaluation.address);
    const currentCashflow = enhancedCurrentEvaluation.cashflow_per_sqm;
    const cashflowComparisonArray = comparisonEvaluations
      .map(e => e.cashflow_per_sqm as number | null)
      .filter((v): v is number => v !== null && v !== undefined);
    
    console.log('AutoComparison: currentCashflow:', currentCashflow, 'cashflowComparisonArray:', cashflowComparisonArray);
    
    if (currentCashflow !== null && currentCashflow !== undefined && cashflowComparisonArray.length > 0) {
      const stats = computeStats(cashflowComparisonArray, currentCashflow as number, true);
      if (stats) {
        metrics.push({
          name: 'Kassaflöde per kvm',
          value: currentCashflow as number,
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
    } else {
      // Show card even without comparison data to indicate missing information
      metrics.push({
        name: 'Kassaflöde per kvm',
        value: currentCashflow || 0,
        average: 0,
        best: 0,
        worst: 0,
        percentile: 0,
        unit: 'SEK/kvm',
        icon: <Wallet className="h-4 w-4" />,
        betterCount: 0,
        total: 0,
        higherIsBetter: true,
      });
    }

    // 5) Fysisk bedömning (högre är bättre)
    const currentPhysical = calculatePhysicalAverage(enhancedCurrentEvaluation);
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

    console.log('AutoComparison: Final metrics count:', metrics.length);
    return metrics;
  }, [enhancedCurrentEvaluation, comparisonEvaluations]);

  const getComparisonText = (metric: ComparisonMetric): string => {
    if (metric.total === 0) {
      return 'Ingen jämförelsedata';
    }
    if (metric.total <= 10) {
      return `${metric.betterCount + 1} av ${metric.total + 1} lägenheter`;
    }
    return `${Math.round(metric.higherIsBetter ? metric.percentile : 100 - metric.percentile)}:e percentilen`;
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
    const { percentile, higherIsBetter, total } = metric;
    
    // If no comparison data, return neutral
    if (total === 0) return 'text-muted-foreground';
    
    const effectivePercentile = higherIsBetter ? percentile : 100 - percentile;
    
    if (effectivePercentile >= 70) return 'text-emerald-600 dark:text-emerald-400';
    if (effectivePercentile >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceIcon = (metric: ComparisonMetric) => {
    const { percentile, higherIsBetter, total } = metric;
    
    // If no comparison data, show info icon
    if (total === 0) {
      return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
    
    const effectivePercentile = higherIsBetter ? percentile : 100 - percentile;
    
    if (effectivePercentile >= 70) {
      return <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
    }
    if (effectivePercentile >= 40) {
      return <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    }
    return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
  };

  const getPerformanceBgColor = (metric: ComparisonMetric): string => {
    const { percentile, higherIsBetter, total } = metric;
    
    // If no comparison data, return neutral
    if (total === 0) return 'bg-muted/20';
    
    const effectivePercentile = higherIsBetter ? percentile : 100 - percentile;
    
    if (effectivePercentile >= 70) return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800';
    if (effectivePercentile >= 40) return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800';
    return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
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

  if (!enhancedCurrentEvaluation) {
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
    <Card className="bg-card border shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg text-foreground">Jämförelse</h3>
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
            disabled={!enhancedCurrentEvaluation?.price}
          >
            Liknande pris
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="space-y-4">
          {comparisonMetrics.map((metric, index) => {
            const isExpanded = expandedMetric === metric.name;
            const performanceColor = getPerformanceColor(metric);
            const performanceBgColor = getPerformanceBgColor(metric);
            
            const chartField = getChartField(metric.name);
            
            return (
              <Collapsible
                key={index}
                open={isExpanded}
                onOpenChange={() => handleMetricToggle(metric.name)}
              >
                <CollapsibleTrigger asChild>
                  <div className={`rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md ${performanceBgColor}`}>
                    {/* Main Content */}
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        {/* Left Side - Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-background/60 backdrop-blur-sm">
                              {metric.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground text-base mb-1">{metric.name}</h3>
                              <div className="flex items-center gap-2">
                                {getPerformanceIcon(metric)}
                                <span className={`text-sm font-medium ${performanceColor}`}>
                                  {getComparisonText(metric)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Primary Value - Prominent */}
                          <div className="mb-2">
                            <div className="text-3xl font-bold text-foreground mb-1">
                              {formatValue(metric.value, metric.unit)}
                            </div>
                            {metric.total > 0 && (
                              <div className="text-sm text-muted-foreground">
                                Snitt: {formatValue(metric.average, metric.unit)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Side - Visual Indicator & Expand Button */}
                        <div className="flex flex-col items-center gap-3 ml-4">
                          {/* Performance Gauge */}
                          <div className="relative">
                            {metric.total > 0 ? (
                              <div className="relative w-16 h-16">
                                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                  {/* Background circle */}
                                  <path
                                    className="text-muted/20"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  />
                                  {/* Progress circle */}
                                  <path
                                    className={performanceColor}
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="none"
                                    strokeDasharray={`${metric.higherIsBetter ? metric.percentile : 100 - metric.percentile}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className={`text-xs font-bold ${performanceColor}`}>
                                    {Math.round(metric.higherIsBetter ? metric.percentile : 100 - metric.percentile)}%
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                                <span className="text-xs font-bold text-muted-foreground">N/A</span>
                              </div>
                            )}
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
                    className="border-t bg-background/30 p-6"
                  >
                    {/* Enhanced Statistics Grid */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Bästa värde:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {metric.total > 0 ? formatValue(metric.best, metric.unit) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Sämsta värde:</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {metric.total > 0 ? formatValue(metric.worst, metric.unit) : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Jämförelsegrupp:</span>
                          <span className="font-semibold">{metric.total} lägenheter</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Din position:</span>
                          <span className={`font-semibold ${performanceColor}`}>
                            {metric.total > 0 ? `${metric.betterCount + 1} av ${metric.total + 1}` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg mb-6">
                      {metric.name === 'Pris per kvm' && 'Priset per kvadratmeter jämfört med liknande lägenheter. Lägre värde indikerar bättre prisläge.'}
                      {metric.name === 'Avgift per kvm' && 'Månadskostnaden per kvadratmeter. Lägre avgift ger lägre löpande kostnader och bättre ekonomi.'}
                      {metric.name === 'Skuld per kvm' && 'Föreningens skuldsättning per kvadratmeter. Lägre skuld innebär mindre finansiell risk för framtida avgiftshöjningar.'}
                      {metric.name === 'Kassaflöde per kvm' && 'Nettoflödet per kvadratmeter efter alla kostnader. Högre värde innebär bättre ekonomisk stabilitet i föreningen.'}
                      {metric.name === 'Fysisk bedömning' && 'Genomsnittlig bedömning av lägenhetens fysiska egenskaper och skick. Högre betyg indikerar bättre standard och färre renoveringsbehov.'}
                    </div>

                    {/* Visual Comparison Chart */}
                    {metric.total > 0 && (
                      <div className="mb-6">
                        <h4 className="font-medium mb-3 text-foreground">Visuell jämförelse</h4>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                { name: 'Bästa', value: metric.best, fill: '#10b981' },
                                { name: 'Snitt', value: metric.average, fill: '#6b7280' },
                                { name: 'Din', value: metric.value, fill: '#3b82f6' },
                                { name: 'Sämsta', value: metric.worst, fill: '#ef4444' }
                              ]}
                            >
                              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip 
                                formatter={(value: number) => [formatValue(value, metric.unit), '']}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--popover))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '6px'
                                }}
                              />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                      {/* Comparison Table */}
                      {chartField && (() => {
                        const allEvaluations = [enhancedCurrentEvaluation, ...comparisonEvaluations];
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