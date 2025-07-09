
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Home, Plus, Scale, Star, Euro, MapPin, CheckCircle2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Evaluation, TimeFilterConfig, ComparisonField } from '@/components/comparison/types';
import { COMPARISON_FIELDS, DEFAULT_FIELDS } from '@/components/comparison/constants';
import TimeFilterComponent from '@/components/comparison/TimeFilter';
import InteractiveComparisonTable from '@/components/comparison/InteractiveComparisonTable';

const Compare = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_FIELDS);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilterConfig>({ type: 'all' });

  const getTimeFilterDate = (timeFilter: TimeFilterConfig): Date | null => {
    const now = new Date();
    switch (timeFilter.type) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3months':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case 'custom':
        return timeFilter.customStart || null;
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user) return;

      try {
        let query = supabase
          .from('apartment_evaluations')
          .select('*')
          .eq('user_id', user.id);

        const filterDate = getTimeFilterDate(timeFilter);
        if (filterDate) {
          query = query.gte('created_at', filterDate.toISOString());
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;
        setEvaluations(data || []);
        
        // Auto-select all evaluations when time filter changes
        if (timeFilter.type !== 'all' && data && data.length > 0) {
          setSelectedEvaluations(data.map(evaluation => evaluation.id));
        }
      } catch (err) {
        console.error('Error fetching evaluations:', err);
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
  }, [user, toast, timeFilter]);

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

  const formatValue = (value: any, type: ComparisonField['type']) => {
    if (value === null || value === undefined) return 'Ej angivet';
    
    switch (type) {
      case 'currency':
        return `${parseInt(value.toString()).toLocaleString()} SEK`;
      case 'rating':
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold">{value}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-sm ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        );
      case 'boolean':
        return value ? 'Ja' : 'Nej';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      default:
        return value;
    }
  };

  const toggleEvaluationSelection = (id: string) => {
    setSelectedEvaluations(prev => 
      prev.includes(id) 
        ? prev.filter(evalId => evalId !== id)
        : [...prev, id]
    );
  };

  const toggleFieldSelection = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey)
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const startComparison = () => {
    if (selectedEvaluations.length < 2) {
      toast({
        title: "Välja minst två utvärderingar",
        description: "Du måste välja minst två utvärderingar för att kunna jämföra.",
        variant: "destructive",
      });
      return;
    }
    setShowComparison(true);
  };

  const getSelectedEvaluationsData = () => {
    return evaluations.filter(evaluation => selectedEvaluations.includes(evaluation.id));
  };

  const getComparisonFields = () => {
    return COMPARISON_FIELDS.filter(field => selectedFields.includes(field.key));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-blue-900 text-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-white hover:bg-blue-800 p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-white hover:bg-blue-800 p-2"
            >
              <Home className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Jämför lägenheter</h1>
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="text-blue-900">Laddar dina utvärderingar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-blue-800 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-blue-800 p-2"
          >
            <Home className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Jämför lägenheter</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {evaluations.length === 0 ? (
          <Card className="bg-white shadow-lg border-0 p-6 text-center">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Inga utvärderingar att jämföra
            </h2>
            <p className="text-gray-600 mb-6">
              Du behöver minst två utvärderingar för att kunna använda jämförelsefunktionen.
            </p>
            <Button
              onClick={() => navigate('/evaluate')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Skapa utvärdering
            </Button>
          </Card>
        ) : !showComparison ? (
          <>
            {/* Time Filter */}
            <TimeFilterComponent 
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
            />

            {/* Selection Interface */}
            <Card className="bg-white shadow-lg border-0 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-5 w-5 text-blue-900" />
                <h2 className="text-xl font-semibold text-blue-900">
                  Välj utvärderingar att jämföra
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Välj minst två utvärderingar för att starta jämförelsen.
                {timeFilter.type !== 'all' && (
                  <span className="block text-sm text-blue-600 mt-1">
                    Filtrerat för {
                      timeFilter.type === 'week' ? 'senaste veckan' :
                      timeFilter.type === 'month' ? 'senaste månaden' :
                      timeFilter.type === '3months' ? 'senaste 3 månaderna' :
                      timeFilter.type === 'year' ? 'senaste året' : 'anpassat tidsintervall'
                    }
                  </span>
                )}
              </p>

              <div className="space-y-2 mb-6">
                {evaluations.map((evaluation) => {
                  const physicalAvg = calculatePhysicalAverage(evaluation);
                  const isSelected = selectedEvaluations.includes(evaluation.id);
                  
                  return (
                    <div 
                      key={evaluation.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => toggleEvaluationSelection(evaluation.id)}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onChange={() => toggleEvaluationSelection(evaluation.id)}
                      />
                      <MapPin className="h-4 w-4 text-blue-900 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-blue-900 truncate">
                              {evaluation.address || 'Ingen adress'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {new Date(evaluation.created_at).toLocaleDateString('sv-SE')}
                              {evaluation.size && ` • ${evaluation.size} kvm`}
                              {evaluation.rooms && ` • ${evaluation.rooms} rum`}
                            </p>
                          </div>
                          
                          {evaluation.price && (
                            <div className="flex items-center gap-1 text-emerald-700">
                              <Euro className="h-4 w-4" />
                              <span className="text-sm font-semibold">
                                {parseInt(evaluation.price.toString()).toLocaleString()} SEK
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-semibold text-yellow-700">
                              {physicalAvg.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={startComparison}
                  disabled={selectedEvaluations.length < 2}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                >
                  <Scale className="h-4 w-4 mr-2" />
                  Jämför utvärderingar ({selectedEvaluations.length})
                </Button>
              </div>
            </Card>

            {/* Field Selection */}
            <Card className="bg-white shadow-lg border-0 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-blue-900" />
                <h3 className="text-lg font-semibold text-blue-900">
                  Anpassa jämförelsekriterier
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Välj vilka fält som ska visas i jämförelsen.
              </p>

              {['basic', 'physical', 'financial'].map((category) => {
                const categoryFields = COMPARISON_FIELDS.filter(field => field.category === category);
                const allCategorySelected = categoryFields.every(field => selectedFields.includes(field.key));
                const someCategorySelected = categoryFields.some(field => selectedFields.includes(field.key));
                
                const toggleCategorySelection = () => {
                  if (allCategorySelected) {
                    // Unselect all in category
                    const categoryKeys = categoryFields.map(f => f.key);
                    setSelectedFields(prev => prev.filter(fieldKey => !categoryKeys.includes(fieldKey as any)));
                  } else {
                    // Select all in category
                    const categoryKeys = categoryFields.map(f => f.key);
                    setSelectedFields(prev => [...new Set([...prev, ...categoryKeys])]);
                  }
                };
                
                return (
                  <div key={category} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        checked={allCategorySelected}
                        onChange={toggleCategorySelection}
                        className={someCategorySelected && !allCategorySelected ? 'opacity-50' : ''}
                      />
                      <h4 className="font-medium text-gray-900 cursor-pointer" onClick={toggleCategorySelection}>
                        {category === 'basic' && 'Grundläggande information'}
                        {category === 'physical' && 'Fysisk bedömning'}
                        {category === 'financial' && 'Ekonomi'}
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ml-6">
                      {categoryFields.map((field) => (
                        <label key={field.key} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedFields.includes(field.key)}
                            onChange={() => toggleFieldSelection(field.key)}
                          />
                          <span className="text-sm text-gray-700">{field.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </Card>
          </>
        ) : (
          <>
            {/* Comparison View */}
            <Card className="bg-white shadow-lg border-0 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-xl font-semibold text-blue-900">
                    Jämförelse av {selectedEvaluations.length} lägenheter
                  </h2>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowComparison(false)}
                >
                  Ändra val
                </Button>
              </div>

              {/* Interactive Comparison Table */}
              <InteractiveComparisonTable
                evaluations={getSelectedEvaluationsData()}
                fields={getComparisonFields()}
                calculatePhysicalAverage={calculatePhysicalAverage}
                formatValue={formatValue}
              />

              {/* Selected Evaluations Overview */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Valda lägenheter i tabellen ({selectedEvaluations.length})
                </h3>
                <div className="space-y-2">
                  {getSelectedEvaluationsData().map((evaluation, index) => {
                    const physicalAvg = calculatePhysicalAverage(evaluation);
                    return (
                      <div key={evaluation.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-blue-900">Lägenhet {index + 1}</span>
                          <span className="text-gray-600">{evaluation.address || 'Ingen adress'}</span>
                          <span className="text-gray-500">
                            {new Date(evaluation.created_at).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {evaluation.price && evaluation.size && (
                            <span className="text-emerald-700 font-medium">
                              {Math.round(evaluation.price / evaluation.size).toLocaleString()} SEK/kvm
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-600" />
                            <span className="font-medium text-yellow-700">{physicalAvg.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Compare;
