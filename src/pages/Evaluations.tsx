
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Home, Plus, MapPin, Euro, Star, Calendar, Edit, FileText, Download } from 'lucide-react';

import { exportToExcel, exportToCSV } from '@/utils/exportUtils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

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
  created_at: string;
  comments: string | null;
  is_draft: boolean | null;
}

const Evaluations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'drafts'>('all');

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('apartment_evaluations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEvaluations(data || []);
      } catch (err) {
        console.error('Error fetching evaluations:', err);
        setError('Kunde inte ladda dina utvärderingar. Försök igen senare.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [user]);

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

  const filteredEvaluations = evaluations.filter(evaluation => {
    if (filter === 'completed') return !evaluation.is_draft;
    if (filter === 'drafts') return evaluation.is_draft;
    return true;
  });

  const handleExport = (format: 'excel' | 'csv') => {
    if (format === 'excel') {
      exportToExcel(evaluations as any);
    } else {
      exportToCSV(evaluations as any);
    }
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
            <h1 className="text-xl font-bold">Mina utvärderingar</h1>
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
      

      {/* Main Content */}
      <div className="pt-20 px-6 pb-8">
        {error && (
          <Card className="bg-red-50 border-red-200 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        {evaluations.length === 0 ? (
          <Card className="bg-white shadow-lg border-0 p-6 text-center">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Inga utvärderingar än
            </h2>
            <p className="text-gray-600 mb-6">
              Du har inte skapat några lägenhetsuvärderingar än. Kom igång genom att skapa din första utvärdering!
            </p>
            <Button
              onClick={() => navigate('/evaluate')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Skapa första utvärderingen
            </Button>
          </Card>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="text-blue-900 hover:bg-blue-50 p-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-3xl font-bold text-blue-900">
                    Mina Utvärderingar
                  </h2>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {evaluations.length}
                  </span>
                </div>
                
                {/* Filter buttons */}
                <div className="flex gap-3">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="px-4"
                  >
                    Alla
                  </Button>
                  <Button
                    variant={filter === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('completed')}
                    className="px-4"
                  >
                    Slutförda
                  </Button>
                  <Button
                    variant={filter === 'drafts' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('drafts')}
                    className="px-4"
                  >
                    Utkast
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {evaluations.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="px-4">
                        <Download className="h-4 w-4 mr-2" />
                        Exportera
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExport('excel')}>
                        Ladda ner Excel (.xlsx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('csv')}>
                        Ladda ner CSV (.csv)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  onClick={() => navigate('/evaluate')}
                  className="bg-blue-900 hover:bg-blue-800 text-white px-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ny utvärdering
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvaluations.map((evaluation) => {
                const physicalAvg = calculatePhysicalAverage(evaluation);
                return (
                  <Card key={evaluation.id} className="bg-white shadow-md border-0 rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="p-5">
                      {/* Header with date and status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {new Date(evaluation.created_at).toLocaleDateString('sv-SE')}
                        </div>
                        {evaluation.is_draft && (
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 font-medium">
                            <FileText className="h-3 w-3" />
                            Utkast
                          </span>
                        )}
                      </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-blue-900 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-blue-900 text-lg">
                          {evaluation.address || 'Ingen adress'}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {evaluation.size && `${evaluation.size} kvm`}
                          {evaluation.rooms && ` • ${evaluation.rooms} rum`}
                        </p>
                      </div>
                    </div>

                    {/* Price info */}
                    {(evaluation.price || evaluation.monthly_fee) && (
                      <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 rounded-lg">
                        <Euro className="h-5 w-5 text-emerald-700" />
                        <div>
                          {evaluation.price && (
                            <p className="font-semibold text-emerald-700">
                              {parseInt(evaluation.price.toString()).toLocaleString()} SEK
                            </p>
                          )}
                          {evaluation.monthly_fee && (
                            <p className="text-sm text-emerald-600">
                              {parseInt(evaluation.monthly_fee.toString()).toLocaleString()} SEK/mån
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Physical rating */}
                    <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-50 rounded-lg">
                      <Star className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-yellow-700">
                          Fysisk bedömning: {physicalAvg.toFixed(1)}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${star <= physicalAvg ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Comments preview */}
                    {evaluation.comments && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {evaluation.comments}
                        </p>
                      </div>
                    )}

                      {/* Action buttons */}
                      <div className="flex gap-3 mt-5">
                        <Button
                          variant="outline"
                          className="flex-1 py-2.5"
                          onClick={() => navigate(`/evaluation/${evaluation.id}`)}
                        >
                          Visa detaljer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/evaluate/${evaluation.id}`)}
                          className="px-3 py-2.5"
                          title="Redigera"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Evaluations;
