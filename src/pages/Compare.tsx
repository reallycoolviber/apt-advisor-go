import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Home, 
  Plus, 
  Scale, 
  Star, 
  Euro, 
  MapPin, 
  CheckCircle2, 
  Settings,
  Save,
  Edit,
  Bookmark,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Evaluation, TimeFilterConfig, ComparisonField, SavedComparison } from '@/components/comparison/types';
import { COMPARISON_FIELDS_WITH_COMPUTED, DEFAULT_FIELDS } from '@/components/comparison/constants';
import TimeFilterComponent from '@/components/comparison/TimeFilter';
import InteractiveComparisonTable from '@/components/comparison/InteractiveComparisonTable';
import { SaveComparisonModal } from '@/components/comparison/SaveComparisonModal';
import { ComparisonFilters, FilterValues } from '@/components/comparison/ComparisonFilters';
import { SavedComparisons } from '@/components/comparison/SavedComparisons';

type ViewMode = 'method-selection' | 'new-comparison' | 'saved-comparisons' | 'comparison-result';
type NewComparisonStep = 'apartment-selection' | 'criteria-selection' | 'results';

const Compare = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Core state
  const [viewMode, setViewMode] = useState<ViewMode>('method-selection');
  const [newComparisonStep, setNewComparisonStep] = useState<NewComparisonStep>('apartment-selection');
  
  // Data state
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_FIELDS);
  
  // Filter state
  const [timeFilter, setTimeFilter] = useState<TimeFilterConfig>({ type: 'all' });
  const [comparisonFilters, setComparisonFilters] = useState<FilterValues>({
    minRating: 0,
    priceRange: [0, 10000000],
    sizeRange: [0, 200],
    minPricePerSqm: 0
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Current comparison data
  const [currentComparison, setCurrentComparison] = useState<{
    name?: string;
    evaluations: Evaluation[];
    fields: ComparisonField[];
  } | null>(null);

  // Helper functions
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

  // Apply filters to evaluations
  const applyFilters = (evaluations: Evaluation[]): Evaluation[] => {
    return evaluations.filter(evaluation => {
      const physicalAvg = calculatePhysicalAverage(evaluation);
      const pricePerSqm = calculatePricePerSqm(evaluation);

      // Rating filter
      if (physicalAvg < comparisonFilters.minRating) return false;

      // Price range filter
      if (evaluation.price !== null) {
        if (evaluation.price < comparisonFilters.priceRange[0] || 
            evaluation.price > comparisonFilters.priceRange[1]) return false;
      }

      // Size range filter
      if (evaluation.size !== null) {
        if (evaluation.size < comparisonFilters.sizeRange[0] || 
            evaluation.size > comparisonFilters.sizeRange[1]) return false;
      }

      // Price per sqm filter
      if (pricePerSqm !== null && pricePerSqm < comparisonFilters.minPricePerSqm) return false;

      return true;
    });
  };

  const formatValue = (value: any, type: ComparisonField['type']) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground text-sm">—</span>;
    }
    
    switch (type) {
      case 'currency':
        const numericValue = typeof value === 'number' ? value : parseInt(value.toString());
        return (
          <span className="font-medium text-emerald-700">
            {numericValue.toLocaleString('sv-SE')} kr
          </span>
        );
      case 'rating':
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
      case 'boolean':
        return value ? (
          <span className="text-emerald-600 font-medium">Ja</span>
        ) : (
          <span className="text-red-500 font-medium">Nej</span>
        );
      case 'number':
        const numberValue = typeof value === 'number' ? value : parseFloat(value);
        return (
          <span className="font-medium">
            {!isNaN(numberValue) ? numberValue.toLocaleString('sv-SE') : value}
          </span>
        );
      default:
        return <span className="text-left">{value}</span>;
    }
  };

  // Data fetching
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
        
        const enhancedData = (data || []).map(enhanceEvaluationWithComputed);
        setEvaluations(enhancedData);
        
        // Auto-select all evaluations when time filter changes
        if (timeFilter.type !== 'all' && enhancedData && enhancedData.length > 0) {
          setSelectedEvaluations(enhancedData.map(evaluation => evaluation.id));
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

  // Apply filters when evaluations or filters change
  useEffect(() => {
    const filtered = applyFilters(evaluations);
    setFilteredEvaluations(filtered);
  }, [evaluations, comparisonFilters]);

  // Event handlers
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

  const proceedToResults = () => {
    if (selectedEvaluations.length < 2) {
      toast({
        title: "Välja minst två utvärderingar",
        description: "Du måste välja minst två utvärderingar för att kunna jämföra.",
        variant: "destructive",
      });
      return;
    }

    const selectedEvaluationsData = filteredEvaluations.filter(
      evaluation => selectedEvaluations.includes(evaluation.id)
    );
    const selectedFieldsData = COMPARISON_FIELDS_WITH_COMPUTED.filter(
      field => selectedFields.includes(field.key as string)
    );

    setCurrentComparison({
      evaluations: selectedEvaluationsData,
      fields: selectedFieldsData
    });
    setNewComparisonStep('results');
  };

  const saveComparison = async (name: string) => {
    if (!user || !currentComparison) return;

    setSaveLoading(true);
    try {
      const { error } = await supabase
        .from('saved_comparisons')
        .insert({
          user_id: user.id,
          name,
          selected_evaluations: selectedEvaluations,
          selected_fields: selectedFields
        });

      if (error) throw error;

      toast({
        title: "Sparat",
        description: `Jämförelsen "${name}" har sparats.`,
      });
      setShowSaveModal(false);
    } catch (err) {
      console.error('Error saving comparison:', err);
      toast({
        title: "Fel",
        description: "Kunde inte spara jämförelsen. Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const loadSavedComparison = async (comparison: SavedComparison) => {
    try {
      // Fetch the evaluations for this comparison
      const { data: evaluationData, error } = await supabase
        .from('apartment_evaluations')
        .select('*')
        .in('id', comparison.selected_evaluations)
        .eq('user_id', user?.id);

      if (error) throw error;

      const enhancedData = (evaluationData || []).map(enhanceEvaluationWithComputed);
      const selectedFieldsData = COMPARISON_FIELDS_WITH_COMPUTED.filter(
        field => comparison.selected_fields.includes(field.key as string)
      );

      setCurrentComparison({
        name: comparison.name,
        evaluations: enhancedData,
        fields: selectedFieldsData
      });
      setViewMode('comparison-result');

      toast({
        title: "Jämförelse laddad",
        description: `"${comparison.name}" har laddats.`,
      });
    } catch (err) {
      console.error('Error loading comparison:', err);
      toast({
        title: "Fel",
        description: "Kunde inte ladda jämförelsen. Försök igen senare.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground p-4 shadow-lg">
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
            <h1 className="text-xl font-bold">Jämför lägenheter</h1>
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="text-foreground">Laddar dina utvärderingar...</div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (viewMode === 'method-selection') {
                navigate('/');
              } else {
                setViewMode('method-selection');
                setNewComparisonStep('apartment-selection');
                setCurrentComparison(null);
              }
            }}
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
          <h1 className="text-xl font-bold">Jämför lägenheter</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {evaluations.length === 0 ? (
          <Card className="bg-card shadow-lg border-0 p-6 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Inga utvärderingar att jämföra
            </h2>
            <p className="text-muted-foreground mb-6">
              Du behöver minst två utvärderingar för att kunna använda jämförelsefunktionen.
            </p>
            <Button
              onClick={() => navigate('/evaluate')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Skapa utvärdering
            </Button>
          </Card>
        ) : (
          <>
            {/* Method Selection */}
            {viewMode === 'method-selection' && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card 
                  className="bg-card shadow-lg border-0 p-8 cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => {
                    setViewMode('new-comparison');
                    setNewComparisonStep('apartment-selection');
                  }}
                >
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Plus className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Gör en ny jämförelse
                    </h2>
                    <p className="text-muted-foreground">
                      Välj lägenheter och kriterier för att skapa en ny jämförelse med avancerade filtreringsalternativ.
                    </p>
                  </div>
                </Card>

                <Card 
                  className="bg-card shadow-lg border-0 p-8 cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => setViewMode('saved-comparisons')}
                >
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Bookmark className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Använd sparad jämförelse
                    </h2>
                    <p className="text-muted-foreground">
                      Ladda en tidigare sparad jämförelse för att snabbt komma åt dina resultat.
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {/* Saved Comparisons View */}
            {viewMode === 'saved-comparisons' && (
              <SavedComparisons onLoadComparison={loadSavedComparison} />
            )}

            {/* New Comparison Process */}
            {viewMode === 'new-comparison' && (
              <>
                {/* Step Indicator */}
                <Card className="bg-card shadow-lg border-0 p-4">
                  <div className="flex items-center justify-center space-x-8">
                    <div className={`flex items-center gap-2 ${
                      newComparisonStep === 'apartment-selection' ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        newComparisonStep === 'apartment-selection' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        1
                      </div>
                      <span className="font-medium">Välj lägenheter</span>
                    </div>
                    <div className="w-8 h-px bg-border"></div>
                    <div className={`flex items-center gap-2 ${
                      newComparisonStep === 'criteria-selection' ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        newComparisonStep === 'criteria-selection' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        2
                      </div>
                      <span className="font-medium">Välj kriterier</span>
                    </div>
                    <div className="w-8 h-px bg-border"></div>
                    <div className={`flex items-center gap-2 ${
                      newComparisonStep === 'results' ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        newComparisonStep === 'results' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        3
                      </div>
                      <span className="font-medium">Resultat</span>
                    </div>
                  </div>
                </Card>

                {/* Step 1: Apartment Selection */}
                {newComparisonStep === 'apartment-selection' && (
                  <>
                    {/* Time Filter */}
                    <TimeFilterComponent 
                      timeFilter={timeFilter}
                      onTimeFilterChange={setTimeFilter}
                    />

                    {/* Comparison Filters */}
                    <ComparisonFilters
                      filters={comparisonFilters}
                      onFiltersChange={setComparisonFilters}
                      evaluations={evaluations}
                    />

                    {/* Selection Interface */}
                    <Card className="bg-card shadow-lg border-0 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Scale className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold text-foreground">
                          Välj utvärderingar att jämföra
                        </h2>
                      </div>
                      <p className="text-muted-foreground mb-6">
                        Välj minst två utvärderingar för att fortsätta till nästa steg.
                        {filteredEvaluations.length !== evaluations.length && (
                          <span className="block text-sm text-blue-600 mt-1">
                            Visar {filteredEvaluations.length} av {evaluations.length} utvärderingar (filtrerade)
                          </span>
                        )}
                      </p>

                      {filteredEvaluations.length === 0 ? (
                        <div className="text-center py-8">
                          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            Inga utvärderingar matchar filtren
                          </h3>
                          <p className="text-muted-foreground">
                            Justera filtren ovan för att visa fler utvärderingar.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2 mb-6">
                            {filteredEvaluations.map((evaluation) => {
                              const physicalAvg = calculatePhysicalAverage(evaluation);
                              const isSelected = selectedEvaluations.includes(evaluation.id);
                              
                              return (
                                <div 
                                  key={evaluation.id} 
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                    isSelected 
                                      ? 'border-primary bg-secondary' 
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                  onClick={() => toggleEvaluationSelection(evaluation.id)}
                                >
                                  <Checkbox 
                                    checked={isSelected}
                                    onCheckedChange={() => toggleEvaluationSelection(evaluation.id)}
                                  />
                                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-4">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-foreground truncate">
                                          {evaluation.address || 'Ingen adress'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                          {new Date(evaluation.created_at).toLocaleDateString('sv-SE')}
                                          {evaluation.size && ` • ${evaluation.size} kvm`}
                                          {evaluation.rooms && ` • ${evaluation.rooms} rum`}
                                          {evaluation.price_per_sqm && ` • ${Math.round(evaluation.price_per_sqm).toLocaleString('sv-SE')} kr/kvm`}
                                        </p>
                                      </div>
                                      
                                      {evaluation.price && (
                                        <div className="flex items-center gap-1 text-accent">
                                          <Euro className="h-4 w-4" />
                                          <span className="text-sm font-semibold">
                                            {parseInt(evaluation.price.toString()).toLocaleString('sv-SE')} kr
                                          </span>
                                        </div>
                                      )}

                                      <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-semibold text-primary">
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
                              onClick={() => setNewComparisonStep('criteria-selection')}
                              disabled={selectedEvaluations.length < 2}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Fortsätt till kriterier ({selectedEvaluations.length})
                            </Button>
                          </div>
                        </>
                      )}
                    </Card>
                  </>
                )}

                {/* Step 2: Criteria Selection */}
                {newComparisonStep === 'criteria-selection' && (
                  <Card className="bg-card shadow-lg border-0 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Settings className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">
                        Välj jämförelsekriterier
                      </h3>
                    </div>
                    <p className="text-muted-foreground mb-6">
                      Välj vilka fält som ska visas i jämförelsen. Standardkriterierna är förvalda.
                    </p>

                    {['basic', 'physical', 'financial'].map((category) => {
                      const categoryFields = COMPARISON_FIELDS_WITH_COMPUTED.filter(field => field.category === category);
                      const allCategorySelected = categoryFields.every(field => selectedFields.includes(field.key as string));
                      const someCategorySelected = categoryFields.some(field => selectedFields.includes(field.key as string));
                      
                      const toggleCategorySelection = () => {
                        if (allCategorySelected) {
                          // Unselect all in category
                          const categoryKeys = categoryFields.map(f => f.key as string);
                          setSelectedFields(prev => prev.filter(fieldKey => !categoryKeys.includes(fieldKey)));
                        } else {
                          // Select all in category
                          const categoryKeys = categoryFields.map(f => f.key as string);
                          setSelectedFields(prev => [...new Set([...prev, ...categoryKeys])]);
                        }
                      };
                      
                      return (
                        <div key={category} className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Checkbox
                              checked={allCategorySelected}
                              onCheckedChange={toggleCategorySelection}
                              className={someCategorySelected && !allCategorySelected ? 'opacity-50' : ''}
                            />
                            <h4 className="font-medium text-foreground cursor-pointer" onClick={toggleCategorySelection}>
                              {category === 'basic' && 'Grundläggande information'}
                              {category === 'physical' && 'Fysisk bedömning'}
                              {category === 'financial' && 'Ekonomi'}
                            </h4>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ml-6">
                            {categoryFields.map((field) => (
                              <label key={field.key as string} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={selectedFields.includes(field.key as string)}
                                  onCheckedChange={() => toggleFieldSelection(field.key as string)}
                                />
                                <span className="text-sm text-muted-foreground">{field.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setNewComparisonStep('apartment-selection')}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Tillbaka
                      </Button>
                      <Button
                        onClick={proceedToResults}
                        disabled={selectedFields.length === 0}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Scale className="h-4 w-4 mr-2" />
                        Visa jämförelse
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Step 3: Results */}
                {newComparisonStep === 'results' && currentComparison && (
                  <Card className="bg-card shadow-lg border-0 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold text-foreground">
                          Jämförelse av {currentComparison.evaluations.length} lägenheter
                        </h2>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setNewComparisonStep('criteria-selection')}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Redigera
                        </Button>
                        <Button
                          onClick={() => setShowSaveModal(true)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Spara jämförelse
                        </Button>
                      </div>
                    </div>

                    <InteractiveComparisonTable
                      evaluations={currentComparison.evaluations}
                      fields={currentComparison.fields}
                      calculatePhysicalAverage={calculatePhysicalAverage}
                      formatValue={formatValue}
                    />
                  </Card>
                )}
              </>
            )}

            {/* Comparison Result View (for loaded saved comparisons) */}
            {viewMode === 'comparison-result' && currentComparison && (
              <Card className="bg-card shadow-lg border-0 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">
                      {currentComparison.name || `Jämförelse av ${currentComparison.evaluations.length} lägenheter`}
                    </h2>
                  </div>
                </div>

                <InteractiveComparisonTable
                  evaluations={currentComparison.evaluations}
                  fields={currentComparison.fields}
                  calculatePhysicalAverage={calculatePhysicalAverage}
                  formatValue={formatValue}
                />
              </Card>
            )}
          </>
        )}
      </div>

      {/* Save Comparison Modal */}
      <SaveComparisonModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={saveComparison}
        loading={saveLoading}
      />
    </div>
  );
};

export default Compare;