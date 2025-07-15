
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link2, FileText, Loader2, Globe } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AutoInputSectionProps {
  data: any;
  updateData: (data: any) => void;
}

export const AutoInputSection = ({ data, updateData }: AutoInputSectionProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const { toast } = useToast();

  const scrapeWebsite = async (url: string) => {
    setIsScraping(true);
    
    try {
      // Mock scraping function - in real implementation, this would call a backend service
      // that scrapes Booli/Hemnet pages
      const response = await mockScrapeFunction(url);
      
      if (response.success) {
        updateData({
          address: response.data.address || data.address,
          size: response.data.size || data.size,
          price: response.data.price || data.price,
          rooms: response.data.rooms || data.rooms,
          monthlyFee: response.data.monthlyFee || data.monthlyFee,
        });
        
        toast({
          title: "Data hämtad",
          description: "Information har automatiskt fyllts i från webbsidan",
        });
      } else {
        toast({
          title: "Kunde inte hämta data",
          description: "Kontrollera att länken är korrekt och försök igen",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: "Något gick fel vid hämtning av data",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const mockScrapeFunction = async (url: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock response based on URL patterns
    if (url.includes('hemnet.se') || url.includes('booli.se')) {
      return {
        success: true,
        data: {
          address: "Storgatan 15, 112 36 Stockholm",
          size: "75",
          price: "4 500 000",
          rooms: "3",
          monthlyFee: "4 200"
        }
      };
    }
    
    return { success: false };
  };

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
    
    // If apartment URL exists, try to scrape it first
    if (data.apartmentUrl) {
      await scrapeWebsite(data.apartmentUrl);
    }
    
    // Simulate processing time for annual report
    setTimeout(() => {
      // Mock auto-filled data from annual report
      if (data.annualReportUrl) {
        updateData({
          debtPerSqm: "15000",
          feePerSqm: "56",
          ownsLand: true
        });
      }
      
      setIsProcessing(false);
      toast({
        title: "Data importerad",
        description: "Information har hämtats från länkarna",
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Automatisk dataimport</h2>
        <p className="text-muted-foreground">Lägg till länkar för att automatiskt fylla i lägenhetsinformation</p>
      </div>

      <Card className="p-4 bg-card border-border">
        <div className="space-y-4">
          <div>
            <Label htmlFor="apartmentUrl" className="flex items-center gap-2 text-foreground font-medium">
              <Link2 className="h-4 w-4" />
              Länk till lägenhet (Booli/Hemnet)
            </Label>
            <Input
              id="apartmentUrl"
              type="url"
              value={data.apartmentUrl}
              onChange={(e) => updateData({ apartmentUrl: e.target.value })}
              placeholder="https://www.hemnet.se/bostad/..."
              className="mt-2 bg-background"
            />
          </div>

          <div>
            <Label htmlFor="annualReportUrl" className="flex items-center gap-2 text-foreground font-medium">
              <FileText className="h-4 w-4" />
              Länk till årsredovisning
            </Label>
            <Input
              id="annualReportUrl"
              type="url"
              value={data.annualReportUrl}
              onChange={(e) => updateData({ annualReportUrl: e.target.value })}
              placeholder="https://www.brf.se/arsredovisning.pdf"
              className="mt-2 bg-background"
            />
          </div>
        </div>
      </Card>

      <Button
        onClick={handleAutoFill}
        disabled={isProcessing || isScraping || (!data.apartmentUrl && !data.annualReportUrl)}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
      >
        {isProcessing || isScraping ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {isScraping ? "Hämtar data från webbsida..." : "Importerar data..."}
          </>
        ) : (
          <>
            <Globe className="h-4 w-4 mr-2" />
            Importera data automatiskt
          </>
        )}
      </Button>

      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg border border-border">
        <p><strong>Tips:</strong> Funktionen hämtar automatiskt information som adress, pris, storlek, månadsavgift och ekonomiska nyckeltal från de angivna länkarna. All data kan redigeras manuellt i nästa steg.</p>
      </div>
    </div>
  );
};
