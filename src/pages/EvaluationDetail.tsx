import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Home, MapPin, Euro, Star, Calendar, BarChart3 } from 'lucide-react';

interface EvaluationDetail {
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
  underhållsplan: string | null;
  created_at: string;
  comments: string | null;
  apartment_url: string | null;
  annual_report_url: string | null;
}

const EvaluationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluation = async () => {
      if (!user || !id) return;

      try {
        const { data, error } = await supabase
          .from('apartment_evaluations')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setEvaluation(data);
      } catch (err) {
        console.error('Error fetching evaluation:', err);
        setError('Kunde inte ladda utvärderingen. Försök igen senare.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [user, id]);

  const calculatePhysicalAverage = (evaluation: EvaluationDetail) => {
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

  const renderRatingStars = (rating: number | null) => {
    if (rating === null) return <span className="text-gray-400">-</span>;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
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
            <h1 className="text-xl font-bold">Utvärderingsdetaljer</h1>
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="text-blue-900">Laddar utvärdering...</div>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
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
            <h1 className="text-xl font-bold">Utvärderingsdetaljer</h1>
          </div>
        </div>
        <div className="p-4">
          <Card className="bg-red-50 border-red-200 p-4 text-center">
            <p className="text-red-700">{error || 'Utvärderingen kunde inte hittas.'}</p>
          </Card>
        </div>
      </div>
    );
  }

  const physicalAvg = calculatePhysicalAverage(evaluation);

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
          <h1 className="text-xl font-bold">Utvärderingsdetaljer</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {/* Basic Info */}
        <Card className="bg-white shadow-lg border-0 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            Skapad: {new Date(evaluation.created_at).toLocaleDateString('sv-SE')}
          </div>
          
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="h-6 w-6 text-blue-900 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">
                {evaluation.address || 'Ingen adress angiven'}
              </h2>
              <div className="flex flex-wrap gap-4 text-gray-600">
                {evaluation.size && (
                  <Badge variant="secondary">{evaluation.size} kvm</Badge>
                )}
                {evaluation.rooms && (
                  <Badge variant="secondary">{evaluation.rooms} rum</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Links */}
          {(evaluation.apartment_url || evaluation.annual_report_url) && (
            <div className="flex flex-wrap gap-3 mt-4">
              {evaluation.apartment_url && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(evaluation.apartment_url!, '_blank')}
                >
                  Visa lägenhetsannons
                </Button>
              )}
              {evaluation.annual_report_url && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(evaluation.annual_report_url!, '_blank')}
                >
                  Visa årsredovisning
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Financial Info */}
        <Card className="bg-white shadow-lg border-0 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Euro className="h-5 w-5 text-emerald-700" />
            <h3 className="text-xl font-semibold text-blue-900">Ekonomisk information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evaluation.price && (
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-600 mb-1">Köpeskilling</p>
                <p className="text-xl font-bold text-emerald-700">
                  {parseInt(evaluation.price.toString()).toLocaleString()} SEK
                </p>
              </div>
            )}
            
            {evaluation.monthly_fee && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Månadsavgift</p>
                <p className="text-xl font-bold text-blue-700">
                  {parseInt(evaluation.monthly_fee.toString()).toLocaleString()} SEK/mån
                </p>
              </div>
            )}
            
            {evaluation.debt_per_sqm && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-600 mb-1">Skuld per kvm</p>
                <p className="text-xl font-bold text-orange-700">
                  {parseInt(evaluation.debt_per_sqm.toString()).toLocaleString()} SEK/kvm
                </p>
              </div>
            )}
            
            {evaluation.fee_per_sqm && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 mb-1">Avgift per kvm</p>
                <p className="text-xl font-bold text-purple-700">
                  {parseInt(evaluation.fee_per_sqm.toString()).toLocaleString()} SEK/kvm
                </p>
              </div>
            )}
            
            {evaluation.cashflow_per_sqm && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 mb-1">Kassaflöde per kvm</p>
                <p className="text-xl font-bold text-green-700">
                  {parseInt(evaluation.cashflow_per_sqm.toString()).toLocaleString()} SEK/kvm
                </p>
              </div>
            )}
            
            {evaluation.owns_land !== null && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Äger mark</p>
                <p className="text-xl font-bold text-gray-700">
                  {evaluation.owns_land ? 'Ja' : 'Nej'}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Physical Assessment */}
        <Card className="bg-white shadow-lg border-0 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-yellow-600" />
            <h3 className="text-xl font-semibold text-blue-900">Fysisk bedömning</h3>
            <div className="ml-auto flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-700">
                Genomsnitt: {physicalAvg.toFixed(1)}/5
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-gray-700 mb-2">Planlösning</p>
                {renderRatingStars(evaluation.planlösning)}
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-gray-700 mb-2">Kök</p>
                {renderRatingStars(evaluation.kitchen)}
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-gray-700 mb-2">Badrum</p>
                {renderRatingStars(evaluation.bathroom)}
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-gray-700 mb-2">Sovrum</p>
                {renderRatingStars(evaluation.bedrooms)}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-gray-700 mb-2">Ytor</p>
                {renderRatingStars(evaluation.surfaces)}
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-gray-700 mb-2">Förvaring</p>
                {renderRatingStars(evaluation.förvaring)}
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-gray-700 mb-2">Ljusinsläpp</p>
                {renderRatingStars(evaluation.ljusinsläpp)}
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-gray-700 mb-2">Balkong</p>
                {renderRatingStars(evaluation.balcony)}
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Info */}
        {(evaluation.underhållsplan || evaluation.comments) && (
          <Card className="bg-white shadow-lg border-0 p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">Ytterligare information</h3>
            
            {evaluation.underhållsplan && (
              <div className="mb-4">
                <p className="font-medium text-gray-700 mb-2">Underhållsplan</p>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {evaluation.underhållsplan}
                </p>
              </div>
            )}
            
            {evaluation.comments && (
              <div>
                <p className="font-medium text-gray-700 mb-2">Kommentarer</p>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {evaluation.comments}
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default EvaluationDetail;