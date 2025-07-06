
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Home, MapPin, Euro, Star } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SummarySectionProps {
  data: any;
  updateData: (data: any) => void;
  userId?: string;
}

export const SummarySection = ({ data, updateData, userId }: SummarySectionProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!userId) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att spara",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const evaluationData = {
        user_id: userId,
        apartment_url: data.apartmentUrl || null,
        annual_report_url: data.annualReportUrl || null,
        address: data.address || null,
        size: data.size ? parseFloat(data.size) : null,
        price: data.price ? parseFloat(data.price) : null,
        rooms: data.rooms || null,
        monthly_fee: data.monthlyFee ? parseFloat(data.monthlyFee) : null,
        planlösning: data.planlösning,
        kitchen: data.kitchen,
        bathroom: data.bathroom,
        bedrooms: data.bedrooms,
        surfaces: data.surfaces,
        förvaring: data.förvaring,
        ljusinsläpp: data.ljusinsläpp,
        balcony: data.balcony,
        debt_per_sqm: data.debtPerSqm ? parseFloat(data.debtPerSqm) : null,
        fee_per_sqm: data.feePerSqm ? parseFloat(data.feePerSqm) : null,
        cashflow_per_sqm: data.cashflowPerSqm ? parseFloat(data.cashflowPerSqm) : null,
        owns_land: data.ownsLand,
        underhållsplan: data.underhållsplan || null,
        comments: data.comments || null,
      };

      const { error } = await supabase
        .from('apartment_evaluations')
        .insert([evaluationData]);

      if (error) throw error;

      toast({
        title: "Utvärdering sparad",
        description: "Din lägenhetsuvärdering har sparats framgångsrikt!",
      });

      // Navigate back to dashboard after successful save
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast({
        title: "Fel vid sparande",
        description: "Kunde inte spara utvärderingen. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const physicalAverage = [
    data.planlösning, data.kitchen, data.bathroom, data.bedrooms, 
    data.surfaces, data.förvaring, data.ljusinsläpp, data.balcony
  ].reduce((sum, rating) => sum + rating, 0) / 8;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Sammanfattning</h2>
        <p className="text-gray-600">Granska din utvärdering och lägg till slutkommentarer</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="h-5 w-5 text-blue-900" />
            <h3 className="font-semibold text-blue-900">Lägenhet</h3>
          </div>
          <p className="text-sm text-gray-700">{data.address || 'Ingen adress angiven'}</p>
          <p className="text-sm text-gray-600">
            {data.size && `${data.size} kvm`} 
            {data.rooms && ` • ${data.rooms} rum`}
          </p>
        </Card>

        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3 mb-2">
            <Euro className="h-5 w-5 text-emerald-700" />
            <h3 className="font-semibold text-emerald-700">Ekonomi</h3>
          </div>
          <p className="text-sm text-gray-700">
            {data.price ? `${parseInt(data.price).toLocaleString()} SEK` : 'Inget pris angivet'}
          </p>
          <p className="text-sm text-gray-600">
            {data.monthlyFee && `${parseInt(data.monthlyFee).toLocaleString()} SEK/mån`}
          </p>
        </Card>
      </div>

      {/* Physical Assessment Summary */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-center gap-3 mb-3">
          <Star className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold text-yellow-700">Fysisk bedömning</h3>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-700">{physicalAverage.toFixed(1)}</p>
          <p className="text-sm text-gray-600">Genomsnittligt betyg</p>
          <div className="flex justify-center mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-lg ${star <= physicalAverage ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Comments */}
      <Card className="p-4">
        <Label htmlFor="comments" className="text-blue-900 font-medium mb-2 block">
          Slutkommentarer
        </Label>
        <Textarea
          id="comments"
          value={data.comments}
          onChange={(e) => updateData({ comments: e.target.value })}
          placeholder="Lägg till dina reflektioner och slutsatser om lägenheten..."
          className="min-h-[120px] resize-none"
        />
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            Sparar utvärdering...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Spara utvärdering
          </>
        )}
      </Button>

      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg text-center">
        <p>När du sparar kommer utvärderingen att finnas tillgänglig i "Mina utvärderingar" där du kan se och jämföra alla dina lägenheter.</p>
      </div>
    </div>
  );
};
