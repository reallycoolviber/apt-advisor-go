
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, MapPin, Home, CreditCard, TrendingUp, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SummarySectionProps {
  data: any;
  updateData: (data: any) => void;
}

export const SummarySection = ({ data, updateData }: SummarySectionProps) => {
  const { toast } = useToast();

  const handleSave = () => {
    // Here you would typically save to a database
    console.log('Saving apartment data:', data);
    
    toast({
      title: "Lägenhet sparad!",
      description: "Din lägenhetsbedömning har sparats framgångsrikt.",
    });
  };

  const physicalRatings = ['planlösning', 'kitchen', 'bathroom', 'bedrooms', 'surfaces', 'förvaring', 'ljusinsläpp', 'balcony'];
  const averageRating = physicalRatings.reduce((sum, field) => sum + (data[field] || 0), 0) / physicalRatings.length;

  const isComplete = data.address && data.size && data.price && data.monthlyFee;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Sammanfattning</h2>
        <p className="text-gray-600">Överblick av din lägenhetsbedömning</p>
      </div>

      {/* Quick Overview */}
      {isComplete && (
        <Card className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">{data.address}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Home className="h-3 w-3" />
                {data.size} kvm, {data.rooms} rum
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-3 w-3" />
                {data.price} SEK
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-blue-400">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>Genomsnitt: {averageRating.toFixed(1)}/5</span>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-90">Pris/kvm</div>
                <div className="font-bold">
                  {Math.round(parseInt(data.price.replace(/\s/g, '')) / parseInt(data.size)).toLocaleString()} SEK
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <div className="text-sm text-gray-600 mb-1">Fysiskt betyg</div>
          <div className="text-xl font-bold text-blue-900">{averageRating.toFixed(1)}/5</div>
        </Card>

        <Card className="p-4 text-center">
          <CreditCard className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <div className="text-sm text-gray-600 mb-1">Månadsavgift/kvm</div>
          <div className="text-xl font-bold text-blue-900">
            {data.size && data.monthlyFee 
              ? Math.round(parseInt(data.monthlyFee.replace(/\s/g, '')) / parseInt(data.size))
              : '—'
            } SEK
          </div>
        </Card>
      </div>

      {/* Financial Overview */}
      {(data.debtPerSqm || data.ownsLand !== null) && (
        <Card className="p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Ekonomisk översikt</h3>
          <div className="space-y-2 text-sm">
            {data.debtPerSqm && (
              <div className="flex justify-between">
                <span className="text-gray-600">Skuld per kvm:</span>
                <span className="font-medium">{data.debtPerSqm} SEK</span>
              </div>
            )}
            {data.feePerSqm && (
              <div className="flex justify-between">
                <span className="text-gray-600">Avgift per kvm:</span>
                <span className="font-medium">{data.feePerSqm} SEK</span>
              </div>
            )}
            {data.ownsLand !== null && (
              <div className="flex justify-between">
                <span className="text-gray-600">Äger mark:</span>
                <span className={`font-medium ${data.ownsLand ? 'text-emerald-600' : 'text-red-600'}`}>
                  {data.ownsLand ? 'Ja' : 'Nej'}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Comments */}
      <Card className="p-4">
        <Label htmlFor="comments" className="text-blue-900 font-medium mb-2 block">
          Allmänna kommentarer
        </Label>
        <Textarea
          id="comments"
          value={data.comments}
          onChange={(e) => updateData({ comments: e.target.value })}
          placeholder="Lägg till dina egna reflektioner om lägenheten, visningen, känsla, särskilda observationer..."
          className="min-h-[120px]"
        />
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={!isComplete}
        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
      >
        <Save className="h-4 w-4 mr-2" />
        Spara lägenhetsbedömning
      </Button>

      {!isComplete && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg text-center">
          Fyll i grundläggande information (adress, storlek, pris, månadsavgift) för att kunna spara bedömningen.
        </div>
      )}
    </div>
  );
};
