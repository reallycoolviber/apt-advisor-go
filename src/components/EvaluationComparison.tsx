import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronUp, ChevronDown, Scale, Star, Euro, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Evaluation, ComparisonField, SortConfig, SortDirection } from '@/components/comparison/types';
import { useNavigate } from 'react-router-dom';

interface EvaluationComparisonProps {
  currentEvaluationId?: string | null;
  currentData: any;
}

const EvaluationComparison: React.FC<EvaluationComparisonProps> = ({ 
  currentEvaluationId, 
  currentData 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'address', direction: null });

  // Key comparison fields for the mini table
  const comparisonFields: ComparisonField[] = [
    { key: 'size', label: 'Storlek', type: 'number', category: 'basic' },
    { key: 'price', label: 'Pris', type: 'currency', category: 'basic' },
    { key: 'monthly_fee', label: 'Avgift', type: 'currency', category: 'basic' }
  ];

  const calculatePhysicalAverage = (evaluation: Evaluation | any): number => {
    const ratings = [
      evaluation.planlösning,
      evaluation.kitchen,
      evaluation.bathroom,
      evaluation.bedrooms,
      evaluation.surfaces,
      evaluation.förvaring,
      evaluation.ljusinsläpp,
      evaluation.balcony
    ].filter(rating => rating !== null && rating > 0) as number[];
    
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  };

  const calculatePricePerSqm = (evaluation: Evaluation | any): number | null => {
    const price = evaluation.price || evaluation.general?.price;
    const size = evaluation.size || evaluation.general?.size;
    if (!price || !size || size === 0) return null;
    return parseFloat(price) / parseFloat(size);
  };

  // Convert current evaluation data to evaluation format
  const getCurrentEvaluation = (): Evaluation | null => {
    if (!currentData.address && !currentData.general?.size && !currentData.general?.price) {
      return null;
    }

    return {
      id: currentEvaluationId || 'current',
      address: currentData.address || 'Aktuell utvärdering',
      size: currentData.general?.size ? parseFloat(currentData.general.size) : null,
      price: currentData.general?.price ? parseFloat(currentData.general.price) : null,
      rooms: currentData.general?.rooms || null,
      monthly_fee: currentData.general?.monthlyFee ? parseFloat(currentData.general.monthlyFee) : null,
      planlösning: currentData.physical?.planlösning || null,
      kitchen: currentData.physical?.kitchen || null,
      bathroom: currentData.physical?.bathroom || null,
      bedrooms: currentData.physical?.bedrooms || null,
      surfaces: currentData.physical?.surfaces || null,
      förvaring: currentData.physical?.förvaring || null,
      ljusinsläpp: currentData.physical?.ljusinsläpp || null,
      balcony: currentData.physical?.balcony || null,
      debt_per_sqm: currentData.financial?.debtPerSqm ? parseFloat(currentData.financial.debtPerSqm) : null,
      fee_per_sqm: currentData.financial?.feePerSqm ? parseFloat(currentData.financial.feePerSqm) : null,
      cashflow_per_sqm: currentData.financial?.cashflowPerSqm ? parseFloat(currentData.financial.cashflowPerSqm) : null,
      owns_land: currentData.financial?.ownsLand || null,
      created_at: new Date().toISOString()
    };
  };

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user) return;

      try {
        let query = supabase
          .from('apartment_evaluations')
          .select('*')
          .eq('user_id', user.id);

        // Exclude current evaluation if editing
        if (currentEvaluationId) {
          query = query.neq('id', currentEvaluationId);
        }

        query = query.order('created_at', { ascending: false }).limit(4);

        const { data, error } = await query;

        if (error) throw error;
        
        setEvaluations(data || []);
      } catch (err) {
        console.error('Error fetching evaluations for comparison:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [user, currentEvaluationId]);

  const allEvaluations = useMemo(() => {
    const current = getCurrentEvaluation();
    if (!current) return evaluations;
    return [current, ...evaluations];
  }, [evaluations, currentData, currentEvaluationId]);

  const sortedEvaluations = useMemo(() => {
    if (!sortConfig.direction) return allEvaluations;

    return [...allEvaluations].sort((a, b) => {
      const aValue = (sortConfig.field as string) === 'physicalAverage' 
        ? calculatePhysicalAverage(a) 
        : a[sortConfig.field];
      const bValue = (sortConfig.field as string) === 'physicalAverage' 
        ? calculatePhysicalAverage(b) 
        : b[sortConfig.field];

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue === null) return sortConfig.direction === 'asc' ? -1 : 1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [allEvaluations, sortConfig]);

  const handleSort = (field: string) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfig.field === field) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }

    setSortConfig({ field: field as keyof Evaluation, direction });
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field || !sortConfig.direction) return null;
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-3 w-3 ml-1" />
      : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  const formatValue = (value: any, type: ComparisonField['type']) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground text-xs">—</span>;
    }
    
    switch (type) {
      case 'currency':
        const numericValue = typeof value === 'number' ? value : parseInt(value.toString());
        return (
          <span className="font-medium text-emerald-700 text-xs">
            {numericValue.toLocaleString('sv-SE')} kr
          </span>
        );
      case 'rating':
        const numValue = typeof value === 'number' ? value : 0;
        return (
          <div className="flex items-center gap-1 justify-center">
            <span className="font-semibold text-xs min-w-6">{numValue.toFixed(1)}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-2 w-2 ${
                    star <= numValue 
                      ? 'text-yellow-500 fill-yellow-500' 
                      : 'text-gray-300 fill-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        );
      case 'number':
        const numberValue = typeof value === 'number' ? value : parseFloat(value);
        return (
          <span className="font-medium text-xs">
            {!isNaN(numberValue) ? numberValue.toLocaleString('sv-SE') : value}
          </span>
        );
      default:
        return <span className="text-xs">{value}</span>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border shadow-md mb-8">
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-4 text-center">
            Jämförelse
          </h3>
          <div className="text-center text-muted-foreground text-sm">
            Laddar jämförelse...
          </div>
        </div>
      </Card>
    );
  }

  if (allEvaluations.length < 2) {
    return (
      <Card className="bg-card border shadow-md mb-8">
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-4 text-center flex items-center justify-center gap-2">
            <Scale className="h-4 w-4" />
            Jämförelse
          </h3>
          <div className="text-center space-y-3">
            <p className="text-muted-foreground text-sm">
              Du behöver fler utvärderingar för att kunna jämföra
            </p>
            <Button
              onClick={() => navigate('/compare')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Gå till jämförelsesida
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card border shadow-md mb-8">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Jämförelse med andra utvärderingar
          </h3>
          <Button
            onClick={() => navigate('/compare')}
            variant="outline"
            size="sm"
          >
            Visa mer
          </Button>
        </div>
        
        <div className="overflow-x-auto border border-border rounded-lg bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/70">
                <TableHead className="min-w-32 font-semibold text-left text-xs">
                  Lägenhet
                </TableHead>
                {comparisonFields.map((field) => (
                  <TableHead 
                    key={field.key}
                    className="text-center cursor-pointer hover:bg-muted/70 select-none transition-colors duration-150 min-w-24 text-xs"
                    onClick={() => handleSort(field.key)}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-medium">{field.label}</span>
                      {getSortIcon(field.key)}
                    </div>
                  </TableHead>
                ))}
                <TableHead 
                  className="text-center cursor-pointer hover:bg-secondary/70 select-none bg-secondary min-w-32 transition-colors duration-150 text-xs"
                  onClick={() => handleSort('physicalAverage')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-medium">Fysiskt betyg</span>
                    {getSortIcon('physicalAverage')}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEvaluations.slice(0, 4).map((evaluation, index) => {
                const isCurrent = evaluation.id === (currentEvaluationId || 'current');
                const pricePerSqm = calculatePricePerSqm(evaluation);
                
                return (
                  <TableRow 
                    key={evaluation.id} 
                    className={`transition-colors duration-150 hover:bg-muted/30 ${
                      isCurrent ? 'bg-primary/10 border-primary/20' : 
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    }`}
                  >
                    <TableCell className="font-medium text-xs">
                      <div className="min-w-0">
                        <div className={`font-semibold text-xs ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                          {isCurrent ? 'Aktuell' : `Lägenhet ${index + 1}`}
                        </div>
                        <div 
                          className="text-xs text-muted-foreground overflow-hidden text-ellipsis" 
                          title={evaluation.address || 'Ingen adress'}
                        >
                          {evaluation.address || 'Ingen adress'}
                        </div>
                        {pricePerSqm && (
                          <div className="text-xs text-muted-foreground">
                            {Math.round(pricePerSqm).toLocaleString()} kr/kvm
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {comparisonFields.map((field) => {
                      const value = evaluation[field.key];
                      const isNumeric = field.type === 'currency' || field.type === 'number';
                      
                      return (
                        <TableCell 
                          key={`${evaluation.id}-${field.key}`} 
                          className={`${isNumeric ? 'text-right' : 'text-center'} px-2`}
                        >
                          <div 
                            className={`overflow-hidden text-ellipsis ${isNumeric ? 'text-right' : 'text-center'}`}
                            title={value ? String(value) : 'Ej angivet'}
                          >
                            {formatValue(value, field.type)}
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center bg-secondary px-2">
                      <div className="flex items-center justify-center">
                        {formatValue(calculatePhysicalAverage(evaluation), 'rating')}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {allEvaluations.length > 4 && (
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              Visar 4 av {allEvaluations.length} utvärderingar
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EvaluationComparison;