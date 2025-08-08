
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link2, FileText, Loader2, Globe } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AutoInputSectionProps {
  data: any;
  updateData: (data: any) => void;
}

export const AutoInputSection = ({ data, updateData }: AutoInputSectionProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
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
          const formatNumber = (value: string) => {
            const number = value.replace(/\D/g, '');
            return number.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
          };

          const updateFields: any = {};
          
          if (scrapedData.address) updateFields.address = scrapedData.address;
          if (scrapedData.size) updateFields.size = scrapedData.size;
          if (scrapedData.rooms) updateFields.rooms = scrapedData.rooms;
          if (scrapedData.startPrice) updateFields.price = formatNumber(scrapedData.startPrice);
          if (scrapedData.finalPrice) updateFields.finalPrice = formatNumber(scrapedData.finalPrice);
          if (scrapedData.monthlyFee) updateFields.monthlyFee = formatNumber(scrapedData.monthlyFee);
          
          updateData(updateFields);
          
          toast({
            title: "Data hämtad från Booli",
            description: "Validerad lägenhetsinformation har automatiskt fyllts i",
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

  const parseAnnualReport = async (url: string) => {
    setIsParsing(true);
    
    try {
      console.log('Parsing annual report PDF:', url);
      
      const { data, error } = await supabase.functions.invoke('parse-annual-report', {
        body: { url }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Kunde inte anropa PDF-parsningsfunktionen');
      }
      
      if (data.success && data.metrics) {
        const formatNumber = (value: number) => {
          return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        };

        const parseNum = (v: any): number | null => {
          const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
          return isNaN(n) ? null : n;
        };

        const toKrIfTkrDebt = (v: any) => {
          const n = parseNum(v);
          if (n === null) return null;
          // Debt is sometimes tkr/kvm; upscale if clearly too small
          return n > 0 && n < 1000 ? n * 1000 : n;
        };

        const updateFields: any = {};
        
        if (data.metrics.debt_per_sqm !== undefined) {
          const val = toKrIfTkrDebt(data.metrics.debt_per_sqm);
          if (val !== null) updateFields.debtPerSqm = formatNumber(Math.round(val));
        }
        if (data.metrics.fee_per_sqm !== undefined) {
          const n = parseNum(data.metrics.fee_per_sqm);
          if (n !== null) updateFields.feePerSqm = formatNumber(Math.round(n));
        }
        if (data.metrics.cashflow_per_sqm !== undefined) {
          const n = parseNum(data.metrics.cashflow_per_sqm);
          if (n !== null) updateFields.cashflowPerSqm = formatNumber(Math.round(n));
        }
        
        updateData(updateFields);
        
        toast({
          title: "Årsredovisning bearbetad",
          description: data.message || "Ekonomiska nyckeltal har extraheras från PDF:en",
        });
      } else {
        toast({
          title: "Kunde inte extrahera data",
          description: data.error || "Inga ekonomiska nyckeltal kunde hittas i PDF:en",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('PDF parsing error:', error);
      toast({
        title: "Fel vid PDF-parsning",
        description: error instanceof Error ? error.message : "Något gick fel vid bearbetning av årsredovisningen",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
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
      
      // If annual report URL exists, parse the PDF
      if (data.annualReportUrl) {
        await parseAnnualReport(data.annualReportUrl);
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
        disabled={isProcessing || isScraping || isParsing || (!data.apartmentUrl && !data.annualReportUrl)}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
      >
        {isProcessing || isScraping || isParsing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {isScraping 
              ? "Hämtar data från Booli..." 
              : isParsing 
              ? "Bearbetar årsredovisning..." 
              : "Bearbetar data..."
            }
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
