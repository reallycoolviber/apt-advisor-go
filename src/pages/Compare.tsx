
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Home, Plus, MapPin, Euro, Star, Calendar, BarChart3, Crown } from 'lucide-react';

interface Evaluation {
  id: string;
  address: string | null;
  size: number | null;
  price: number | null;
  rooms: string | null;
  monthly_fee: number | null;
  planlösning: number | null;
  kitchen: number | null;
  bathroom: number | null;
  bedrooms: number | null;
  surfaces: number | null;
  förvaring: number | null;
  ljusinsläpp: number | null;
  balcony: number | null;
  debt_per_sqm: number | null;
  fee_per_sqm: number | null;
  cashflow_per_sqm: number | null;
  owns_land: boolean | null;
  created_at: string;
  comments: string | null;
}

type SortCriteria = 'physical_rating' | 'price_per_sqm' | 'monthly_fee' | 'size' | 'price' | 'created_at';

const Compare = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('physical_rating');

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user) return;

      const ids = searchParams.get('ids')?.split(',') || [];
      
      if (ids.length < 2) {
        setError('Minst 2 utvärderingar krävs för jämförelse.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('apartment_evaluations')
          .select('*')
          .eq('user_id', user.id)
          .in('id', ids);

        if (error) throw error;
        setEvaluations(data || []);
      } catch (err) {
        console.error('Error fetching evaluations:', err);
        setError('Kunde inte ladda utvärderingarna för jämförelse.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [user, searchParams]);

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

  const calculatePricePerSqm = (evaluation: Evaluation) => {
    if (!evaluation.price || !evaluation.size) return null;
    return evaluation.price / evaluation.size;
  };

  const getSortedEvaluations = () => {
    const sorted = [...evaluations].sort((a, b) => {
      switch (sortCriteria) {
        case 'physical_rating':
          return calculatePhysicalAverage(b) - calculatePhysicalAverage(a);
        case 'price_per_sqm':
          const pricePerSqmA = calculatePricePerSqm(a);
          const pricePerSqmB = calculatePricePerSqm(b);
          if (pricePerSqmA === null && pricePerSqmB === null) return 0;
          if (pricePerSqmA === null) return 1;
          if (pricePerSqmB === null) return -1;
          return pricePerSqmA - pricePerSqmB;
        case 'monthly_fee':
          const feeA = a.monthly_fee || 0;
          const feeB = b.monthly_fee || 0;
          return feeA - feeB;
        case 'size':
          const sizeA = a.size || 0;
          const sizeB = b.size || 0;
          return sizeB - sizeA;
        case 'price':
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceA - priceB;
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
    return sorted;
  };

  const renderRatingStars = (rating: number | null) => {
    if (rating === null) return <span className="text-gray-400">-</span>;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getBestValue = (evaluations: Evaluation[], getValue: (evaluation: Evaluation) => number | null, isHigherBetter = true) => {
    const values = evaluations.map(getValue).filter(v => v !== null) as number[];
    if (values.length === 0) return null;
    return isHigherBetter ? Math.max(...values) : Math.min(...values);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-blue-900 text-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/evaluations')}
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
          <div className="text-blue-900">Laddar jämförelse...</div>
        </div>
      </div>
    );
  }

  if (error || evaluations.length < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-blue-900 text-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/evaluations')}
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
        <div className="p-4">
          <Card className="bg-white shadow-lg border-0 p-6 text-center">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              {error || 'Otillräckligt antal utvärderingar'}
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Du behöver minst 2 utvärderingar för att kunna jämföra dem.'}
            </p>
            <Button
              onClick={() => navigate('/evaluations')}
              className="bg-blue-900 hover:bg-blue-800 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka till utvärderingar
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const sortedEvaluations = getSortedEvaluations();
  const bestPhysicalRating = getBestValue(evaluations, calculatePhysicalAverage, true);
  const bestPricePerSqm = getBestValue(evaluations, calculatePricePerSqm, false);
  const bestMonthlyFee = getBestValue(evaluations, (e) => e.monthly_fee, false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/evaluations')}
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
      <div className="p-4 max-w-7xl mx-auto">
        {/* Controls */}
        <Card className="bg-white shadow-lg border-0 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-2">
                Jämför {evaluations.length} lägenheter
              </h2>
              <p className="text-gray-600">
                Sortera och jämför dina utvärderingar baserat på olika kriterier
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={sortCriteria} onValueChange={(value: SortCriteria) => setSortCriteria(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sortera efter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical_rating">Fysisk bedömning</SelectItem>
                  <SelectItem value="price_per_sqm">Pris per kvm</SelectItem>
                  <SelectItem value="monthly_fee">Månadsavgift</SelectItem>
                  <SelectItem value="size">Storlek</SelectItem>
                  <SelectItem value="price">Pris</SelectItem>
                  <SelectItem value="created_at">Senast skapad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedEvaluations.map((evaluation, index) => {
            const physicalAvg = calculatePhysicalAverage(evaluation);
            const pricePerSqm = calculatePricePerSqm(evaluation);
            const isBestPhysical = physicalAvg === bestPhysicalRating;
            const isBestPrice = pricePerSqm === bestPricePerSqm;
            const isBestFee = evaluation.monthly_fee === bestMonthlyFee;

            return (
              <Card 
                key={evaluation.id} 
                className={`bg-white shadow-lg border-0 p-6 relative ${
                  index === 0 ? 'ring-2 ring-emerald-500 ring-opacity-50' : ''
                }`}
              >
                {/* Winner badge */}
                {index === 0 && (
                  <div className="absolute -top-2 -right-2 bg-emerald-600 text-white p-2 rounded-full">
                    <Crown className="h-4 w-4" />
                  </div>
                )}

                {/* Rank badge */}
                <div className="flex items-center justify-between mb-4">
                  <Badge 
                    variant={index === 0 ? "default" : "secondary"}
                    className={index === 0 ? "bg-emerald-600" : ""}
                  >
                    #{index + 1}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {new Date(evaluation.created_at).toLocaleDateString('sv-SE')}
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-blue-900 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 text-lg">
                      {evaluation.address || 'Ingen adress'}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {evaluation.size && (
                        <Badge variant="outline">{evaluation.size} kvm</Badge>
                      )}
                      {evaluation.rooms && (
                        <Badge variant="outline">{evaluation.rooms} rum</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial metrics */}
                <div className="space-y-3 mb-4">
                  {evaluation.price && (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <span className="text-sm font-medium text-emerald-700">Köpeskilling</span>
                      <span className="font-bold text-emerald-700">
                        {parseInt(evaluation.price.toString()).toLocaleString()} SEK
                      </span>
                    </div>
                  )}
                  
                  {pricePerSqm && (
                    <div className={`flex items-center justify-between p-3 rounded-lg ${
                      isBestPrice ? 'bg-green-100 border border-green-300' : 'bg-blue-50'
                    }`}>
                      <span className="text-sm font-medium text-blue-700">Pris per kvm</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-700">
                          {Math.round(pricePerSqm).toLocaleString()} SEK/kvm
                        </span>
                        {isBestPrice && <Crown className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>
                  )}

                  {evaluation.monthly_fee && (
                    <div className={`flex items-center justify-between p-3 rounded-lg ${
                      isBestFee ? 'bg-green-100 border border-green-300' : 'bg-orange-50'
                    }`}>
                      <span className="text-sm font-medium text-orange-700">Månadsavgift</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-orange-700">
                          {parseInt(evaluation.monthly_fee.toString()).toLocaleString()} SEK/mån
                        </span>
                        {isBestFee && <Crown className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>
                  )}
                </div>

                {/* Physical rating */}
                <div className={`p-3 rounded-lg mb-4 ${
                  isBestPhysical ? 'bg-green-100 border border-green-300' : 'bg-yellow-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-yellow-700">Fysisk bedömning</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-yellow-700">{physicalAvg.toFixed(1)}/5</span>
                      {isBestPhysical && <Crown className="h-4 w-4 text-green-600" />}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${star <= physicalAvg ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {/* Physical breakdown */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Planlösning:</span>
                    {renderRatingStars(evaluation.planlösning)}
                  </div>
                  <div className="flex justify-between">
                    <span>Kök:</span>
                    {renderRatingStars(evaluation.kitchen)}
                  </div>
                  <div className="flex justify-between">
                    <span>Badrum:</span>
                    {renderRatingStars(evaluation.bathroom)}
                  </div>
                  <div className="flex justify-between">
                    <span>Sovrum:</span>
                    {renderRatingStars(evaluation.bedrooms)}
                  </div>
                  <div className="flex justify-between">
                    <span>Ytor:</span>
                    {renderRatingStars(evaluation.surfaces)}
                  </div>
                  <div className="flex justify-between">
                    <span>Förvaring:</span>
                    {renderRatingStars(evaluation.förvaring)}
                  </div>
                  <div className="flex justify-between">
                    <span>Ljus:</span>
                    {renderRatingStars(evaluation.ljusinsläpp)}
                  </div>
                  <div className="flex justify-between">
                    <span>Balkong:</span>
                    {renderRatingStars(evaluation.balcony)}
                  </div>
                </div>

                {/* Action button */}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate(`/evaluations/${evaluation.id}`)}
                >
                  Visa detaljer
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Compare;
