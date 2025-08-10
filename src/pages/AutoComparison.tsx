import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ScoringResultDisplay } from '@/components/scoring/ScoringResultDisplay';
import { calculateScore } from '@/services/scoringService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  RotateCcw,
  Banknote,
  Wallet
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
  percentile: number; // 0-100
  unit: string;
  icon: React.ReactNode;
  betterCount: number; // X i "bättre än X av N"
  total: number; // N i jämförelsegruppen
  higherIsBetter: boolean; // kontextberoende
}

const AutoComparison = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  console.log('AutoComparison: Rendered with id:', id);
  console.log('AutoComparison: User:', user);

  const [loading, setLoading] = useState(true);
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [comparisonEvaluations, setComparisonEvaluations] = useState<Evaluation[]>([]);
  const [comparisonBase, setComparisonBase] = useState<ComparisonBase>('last-month');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [scoringResult, setScoringResult] = useState<any>(null);

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

  // Calculate scoring when data is available
  useEffect(() => {
    if (currentEvaluation && comparisonEvaluations.length > 0) {
      const result = calculateScore(currentEvaluation, comparisonEvaluations);
      setScoringResult(result);
    }
  }, [currentEvaluation, comparisonEvaluations]);

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

// Hjälpfunktioner för beräkningar
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
  const total = clean.length; // jämförelsegruppens N (exkl. current)
  if (total === 0) return null as any;
  const average = clean.reduce((s, v) => s + v, 0) / total;
  const best = higherIsBetter ? Math.max(...clean) : Math.min(...clean);
  const worst = higherIsBetter ? Math.min(...clean) : Math.max(...clean);
  const betterCount = higherIsBetter
    ? clean.filter(v => v < current).length // högre är bättre => bättre än de under current
    : clean.filter(v => v > current).length; // lägre är bättre => bättre än de över current
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
        icon: <Euro className="h-5 w-5" />,
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
        icon: <Home className="h-5 w-5" />,
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
        icon: <Banknote className="h-5 w-5" />,
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
        icon: <Wallet className="h-5 w-5" />,
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
        icon: <Star className="h-5 w-5" />,
        betterCount: stats.betterCount,
        total: stats.total,
        higherIsBetter: true,
      });
    }
  }

  return metrics;
}, [currentEvaluation, comparisonEvaluations]);

  const formatValue = (value: number, unit: string): string => {
    if (unit === 'SEK/kvm') {
      return `${Math.round(value).toLocaleString('sv-SE')} ${unit}`;
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
      <div className="min-h-screen bg-background relative p-4">
        {/* Background cityscape */}
        <div className="absolute inset-0 opacity-15 bg-no-repeat bg-center bg-cover"
             style={{ backgroundImage: "url('/src/assets/cityscape-neutral.png')" }}>
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
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
      <div className="min-h-screen bg-background relative p-4">
        {/* Background cityscape */}
        <div className="absolute inset-0 opacity-15 bg-no-repeat bg-center bg-cover"
             style={{ backgroundImage: "url('/src/assets/cityscape-neutral.png')" }}>
        </div>
        <div className="max-w-6xl mx-auto text-center py-12 relative z-10">
          <h2 className="text-2xl font-bold text-foreground mb-4">Utvärdering hittades inte</h2>
          <Button onClick={() => navigate('/evaluations')}>
            Tillbaka till utvärderingar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background cityscape */}
      <div className="absolute inset-0 opacity-15 bg-no-repeat bg-center bg-cover"
           style={{ backgroundImage: "url('/src/assets/cityscape-neutral.png')" }}>
      </div>
      <div className="max-w-6xl mx-auto p-4 space-y-6 relative z-10">
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

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Existing Metrics Overview */}
          <div>
            {comparisonMetrics.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
            {comparisonMetrics.map((metric, index) => (
              <StandardizedCard key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {metric.icon}
                      <h3 className="font-semibold text-foreground">{metric.name}</h3>
                    </div>
<Badge variant={metric.percentile >= 70 ? "default" : metric.percentile >= 30 ? "secondary" : "destructive"}>
  {metric.total <= 10
    ? `Bättre än ${metric.betterCount} av ${metric.total} lägenheter`
    : `${Math.round(metric.percentile)}:e percentilen`}
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
  metric.higherIsBetter
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
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1" style={{
                          color: metric.percentile >= 70 ? 'hsl(var(--semantic-good))' : 
                                 metric.percentile >= 30 ? 'hsl(var(--semantic-average))' : 
                                 'hsl(var(--semantic-bad))'
                        }}>
                          {Math.round(metric.higherIsBetter ? metric.percentile : 100 - metric.percentile)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {metric.total <= 10 ? `Bättre än ${metric.betterCount} av ${metric.total} lägenheter` : `${Math.round(metric.percentile)}:e percentilen`}
                        </div>
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
          </div>
          
          {/* New Scoring Section */}
          <div>
            {scoringResult && (
              <ScoringResultDisplay 
                result={scoringResult}
                apartmentAddress={currentEvaluation?.address || undefined}
              />
            )}
          </div>
        </div>

        {/* Detailed View */}
        {selectedMetric && (() => {
          const metric = comparisonMetrics.find(m => m.name === selectedMetric);
          if (!metric) return null;

          const chartField = {
            'Pris per kvm': { key: 'price_per_sqm', label: 'Pris per kvm', type: 'currency', unit: 'SEK/kvm' },
            'Avgift per kvm': { key: 'fee_per_sqm', label: 'Avgift per kvm', type: 'currency', unit: 'SEK/kvm' },
            'Skuld per kvm': { key: 'debt_per_sqm', label: 'Skuld per kvm', type: 'currency', unit: 'SEK/kvm' },
            'Kassaflöde per kvm': { key: 'cashflow_per_sqm', label: 'Kassaflöde per kvm', type: 'currency', unit: 'SEK/kvm' },
            'Fysisk bedömning': { key: 'physical_average', label: 'Fysisk bedömning', type: 'stars', unit: '/5' }
          }[selectedMetric];

          if (!chartField) return null;

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

          // Sort the data by value (best values first based on metric type)
          const sortedData = [...tableData].sort((a, b) => {
            return metric.higherIsBetter ? b.value - a.value : a.value - b.value;
          });

          const formatTableValue = (value: number) => {
            if (chartField.type === 'currency') return `${Math.round(value).toLocaleString('sv-SE')}`;
            if (chartField.type === 'stars') return `${value.toFixed(1)}`;
            return value.toFixed(1);
          };

          return (
            <StandardizedCard>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Detaljerad vy: {selectedMetric}
              </h3>
              <div className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Adress</TableHead>
                      <TableHead className="text-right">{metric.name}</TableHead>
                      <TableHead className="text-right">Skillnad (%)</TableHead>
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
            </StandardizedCard>
          );
        })()}
      </div>
    </div>
  );
};

export default AutoComparison;