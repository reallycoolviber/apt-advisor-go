
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link2, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AutoInputSectionProps {
  data: any;
  updateData: (data: any) => void;
}

export const AutoInputSection = ({ data, updateData }: AutoInputSectionProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleAutoFill = async () => {
    if (!data.apartmentUrl && !data.annualReportUrl) {
      toast({
        title: "Saknar länkar",
        description: "Lägg till minst en länk för att fortsätta",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing time
    setTimeout(() => {
      // Mock auto-filled data
      updateData({
        address: "Storgatan 15, Stockholm",
        size: "75",
        price: "4500000",
        rooms: "3",
        monthlyFee: "4200",
        debtPerSqm: "15000",
        feePerSqm: "56",
        ownsLand: true
      });
      
      setIsProcessing(false);
      toast({
        title: "Data importerad",
        description: "Information har hämtats från länkarna",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Automatisk dataimport</h2>
        <p className="text-gray-600">Lägg till länkar för att automatiskt fylla i lägenhetsinformation</p>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="space-y-4">
          <div>
            <Label htmlFor="apartmentUrl" className="flex items-center gap-2 text-blue-900 font-medium">
              <Link2 className="h-4 w-4" />
              Länk till lägenhet (Booli/Hemnet)
            </Label>
            <Input
              id="apartmentUrl"
              type="url"
              value={data.apartmentUrl}
              onChange={(e) => updateData({ apartmentUrl: e.target.value })}
              placeholder="https://www.hemnet.se/bostad/..."
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="annualReportUrl" className="flex items-center gap-2 text-blue-900 font-medium">
              <FileText className="h-4 w-4" />
              Länk till årsredovisning
            </Label>
            <Input
              id="annualReportUrl"
              type="url"
              value={data.annualReportUrl}
              onChange={(e) => updateData({ annualReportUrl: e.target.value })}
              placeholder="https://www.brf.se/arsredovisning.pdf"
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      <Button
        onClick={handleAutoFill}
        disabled={isProcessing || (!data.apartmentUrl && !data.annualReportUrl)}
        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Importerar data...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4 mr-2" />
            Importera data automatiskt
          </>
        )}
      </Button>

      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p><strong>Tips:</strong> Funktionen hämtar automatiskt information som adress, pris, storlek, månadsavgift och ekonomiska nyckeltal från de angivna länkarna. All data kan redigeras manuellt i nästa steg.</p>
      </div>
    </div>
  );
};
