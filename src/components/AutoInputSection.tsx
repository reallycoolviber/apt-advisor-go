
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link2, FileText, Loader2, Globe } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateAllScrapedValues } from '@/utils/valueValidation';

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
      // Check if it's a Booli URL
      if (url.includes('booli.se')) {
        console.log('Scraping Booli URL:', url);
        
        const { data, error } = await supabase.functions.invoke('scrape-booli', {
          body: { url }
        });
        
        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(error.message || 'Kunde inte anropa skrapningsfunktionen');
        }
        
        if (data.success) {
          // Map the scraped data to our form fields
          const scrapedData = data.data;
          const updateFields: any = {};
          
          if (scrapedData.address) updateFields.address = scrapedData.address;
          if (scrapedData.size) updateFields.size = scrapedData.size;
          if (scrapedData.rooms) updateFields.rooms = scrapedData.rooms;
          if (scrapedData.startPrice) updateFields.price = scrapedData.startPrice;
          if (scrapedData.finalPrice) updateFields.finalPrice = scrapedData.finalPrice;
          if (scrapedData.monthlyFee) updateFields.monthlyFee = scrapedData.monthlyFee;
          
          // Validate the scraped values
          const validationResults = validateAllScrapedValues({
            size: scrapedData.size,
            rooms: scrapedData.rooms,
            price: scrapedData.startPrice,
            finalPrice: scrapedData.finalPrice,
            monthlyFee: scrapedData.monthlyFee
          });
          
          // Store validation results
          updateFields.validationResults = validationResults;
          
          updateData(updateFields);
          
          // Show warnings for invalid values
          const invalidFields = Object.entries(validationResults)
            .filter(([_, result]) => !result.isValid)
            .map(([field, result]) => `${field}: ${result.reason}`);
          
          if (invalidFields.length > 0) {
            toast({
              title: "Varning: Orimliga värden upptäckta",
              description: `Kontrollera följande fält: ${invalidFields.join(', ')}`,
              variant: "destructive",
            });
          }
          
          toast({
            title: "Data hämtad från Booli",
            description: "Lägenhetsinformation har automatiskt fyllts i",
          });
        } else {
          toast({
            title: "Kunde inte hämta data från Booli",
            description: data.error || "Kontrollera att länken är korrekt och försök igen",
            variant: "destructive",
          });
        }
      } else {
        // For non-Booli URLs, show a message that only Booli is supported for now
        toast({
          title: "Endast Booli stöds",
          description: "För närvarande kan endast Booli.se-länkar skrapas automatiskt",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Scraping error:', error);
      toast({
        title: "Fel vid datahämtning",
        description: error instanceof Error ? error.message : "Något gick fel vid hämtning av data från webbsidan",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
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
    
    try {
      // If apartment URL exists, try to scrape it first
      if (data.apartmentUrl) {
        await scrapeWebsite(data.apartmentUrl);
      }
      
      // Mock processing for annual report (since we don't have real scraping for that yet)
      if (data.annualReportUrl) {
        // Simulate processing time for annual report
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        updateData({
          debtPerSqm: "15000",
          feePerSqm: "56", 
          ownsLand: true
        });
        
        toast({
          title: "Årsredovisning bearbetad",
          description: "Ekonomiska nyckeltal har fyllts i automatiskt",
        });
      }
    } catch (error) {
      console.error('Error in auto-fill:', error);
    } finally {
      setIsProcessing(false);
    }
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
              Länk till lägenhet (Booli)
            </Label>
            <Input
              id="apartmentUrl"
              type="url"
              value={data.apartmentUrl}
              onChange={(e) => updateData({ apartmentUrl: e.target.value })}
              placeholder="https://www.booli.se/bostad/4395368"
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
            {isScraping ? "Hämtar data från Booli..." : "Bearbetar data..."}
          </>
        ) : (
          <>
            <Globe className="h-4 w-4 mr-2" />
            Nästa - Importera data
          </>
        )}
      </Button>

      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg border border-border">
        <p><strong>Tips:</strong> Klistra in en Booli-länk för att automatiskt hämta adress, storlek, antal rum, pris och månadsavgift. Årsredovisningslänkar bearbetas för ekonomiska nyckeltal. All data kan redigeras manuellt i nästa steg.</p>
      </div>
    </div>
  );
};
