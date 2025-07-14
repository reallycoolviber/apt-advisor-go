
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { InfoButton } from '@/components/ui/info-button';
import { TrendingUp, DollarSign, PiggyBank, Building2, CheckCircle, XCircle, Settings } from 'lucide-react';

interface FinancialSectionProps {
  data: any;
  updateData: (data: any) => void;
}

export const FinancialSection = ({ data, updateData }: FinancialSectionProps) => {
  const formatNumber = (value: string) => {
    const number = value.replace(/\D/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleDebtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    updateData({ debtPerSqm: formatted });
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    updateData({ feePerSqm: formatted });
  };

  const handleCashflowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    updateData({ cashflowPerSqm: formatted });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-primary mb-2">Ekonomisk analys</h2>
        <p className="text-muted-foreground">Finansiella nyckeltal för lägenheten och bostadsrättsföreningen</p>
      </div>

      <div className="grid gap-4">
        <Card className="p-4 bg-nature-subtle-beige border-nature-subtle-beige/20">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="debtPerSqm" className="flex items-center gap-2 text-primary font-medium">
              <TrendingUp className="h-4 w-4" />
              Skuld per kvm (SEK)
            </Label>
            <InfoButton
              content="Att enbart fokusera på köpeskillingen kan vara en fälla; en kritisk faktor är föreningens skuld per kvadratmeter. En betydande skuldbörda kan signalera framtida avgiftshöjningar eller behov av kapitaltillskott, vilket ingen vill uppleva post-inflyttning. En låg skuld är ett starkt indikativt tecken på en ekonomiskt välskött förening med solid finansiell framförhållning. Det är en avgörande parameter för den långsiktiga ekonomiska tryggheten i boendet, och en djupdykning i detta är alltid att rekommendera."
            />
          </div>
          <Input
            id="debtPerSqm"
            value={data.debtPerSqm}
            onChange={handleDebtChange}
            placeholder="15 000"
            className="text-lg"
          />
          <p className="text-xs text-muted-foreground mt-1">Föreningens totala skuld dividerat med total yta</p>
        </Card>

        <Card className="p-4 bg-nature-subtle-beige border-nature-subtle-beige/20">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="feePerSqm" className="flex items-center gap-2 text-primary font-medium">
              <DollarSign className="h-4 w-4" />
              Avgift per kvm (SEK)
            </Label>
            <InfoButton
              content="Den månatliga avgiften per kvadratmeter har en direkt inverkan på hushållets disponibla inkomst. En extremt låg avgift kan vara missvisande; den kan indikera att föreningen underfinansierar nödvändigt underhåll, vilket i sin tur kan leda till framtida kostnader. Det eftersträvas en sund balans: en avgift som är tillräcklig för att täcka löpande kostnader och långsiktigt underhållsbehov, utan att vara oproportionerligt hög. Optimering av denna post är central för en stabil vardagsekonomi."
            />
          </div>
          <Input
            id="feePerSqm"
            value={data.feePerSqm}
            onChange={handleFeeChange}
            placeholder="56"
            className="text-lg"
          />
          <p className="text-xs text-muted-foreground mt-1">Månadsavgift dividerat med lägenhetens yta</p>
        </Card>

        <Card className="p-4 bg-nature-subtle-beige border-nature-subtle-beige/20">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="cashflowPerSqm" className="flex items-center gap-2 text-primary font-medium">
              <PiggyBank className="h-4 w-4" />
              Kassaflöde per kvm (SEK)
            </Label>
            <InfoButton
              content="Ett robust och positivt kassaflöde per kvadratmeter utgör föreningens finansiella ryggrad, vilket signalerar en ekonomi kapabel att hantera både oförutsedda utgifter och strategiska investeringar. Att granska detta är av yttersta vikt; ett starkt kassaflöde ger föreningen den handlingsfrihet som minskar risken för att medlemmarna behöver tillföra extra kapital vid oväntade reparationer. Det är en primär indikator på långsiktig ekonomisk stabilitet och ett tecken på att föreningen inte opererar på marginalen."
            />
          </div>
          <Input
            id="cashflowPerSqm"
            value={data.cashflowPerSqm}
            onChange={handleCashflowChange}
            placeholder="12"
            className="text-lg"
          />
          <p className="text-xs text-muted-foreground mt-1">Föreningens årliga kassaflöde per kvm</p>
        </Card>

        <Card className="p-4 bg-nature-subtle-beige border-nature-subtle-beige/20">
          <div className="flex items-center justify-between mb-3">
            <Label className="flex items-center gap-2 text-primary font-medium">
              <Settings className="h-4 w-4" />
              Alla stora underhåll är gjorda?
            </Label>
            <InfoButton
              content="Kunskap om genomförda stora underhållsarbeten är fundamental för att undvika oväntade och kostsamma överraskningar efter ett förvärv. Projekt som stambyten, takrenoveringar och fasadarbeten representerar betydande investeringar. Om dessa redan är genomförda, reduceras risken markant för framtida kapitaltillskott eller betydande avgiftshöjningar för de boende. Detta är en proaktiv granskning som säkrar den ekonomiska framtiden i bostaden och signalerar en väl underhållen fastighet."
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={data.majorMaintenanceDone === true ? "default" : "outline"}
              onClick={() => updateData({ majorMaintenanceDone: true })}
              className={`flex-1 h-12 ${
                data.majorMaintenanceDone === true 
                  ? 'bg-nature-calm-green hover:bg-nature-calm-green/90 text-nature-light-grey' 
                  : 'border-nature-calm-green text-nature-calm-green hover:bg-nature-calm-green/10'
              }`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Ja
            </Button>
            <Button
              type="button"
              variant={data.majorMaintenanceDone === false ? "default" : "outline"}
              onClick={() => updateData({ majorMaintenanceDone: false })}
              className={`flex-1 h-12 ${
                data.majorMaintenanceDone === false 
                  ? 'bg-nature-dark-terracotta hover:bg-nature-dark-terracotta/90 text-nature-light-grey' 
                  : 'border-nature-dark-terracotta text-nature-dark-terracotta hover:bg-nature-dark-terracotta/10'
              }`}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Nej
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-nature-subtle-beige border-nature-subtle-beige/20">
          <div className="flex items-center justify-between mb-3">
            <Label className="flex items-center gap-2 text-primary font-medium">
              <Building2 className="h-4 w-4" />
              Äger föreningen marken?
            </Label>
            <InfoButton
              content="Frågan om föreningen innehar marken med äganderätt eller tomträtt är avgörande för en bostadsrätts ekonomiska stabilitet. Om marken innehas med tomträtt, ådrar sig föreningen en årlig avgift till kommunen, en avgift som kan omförhandlas och därmed potentiellt höjas. Detta kan få direkta, negativa konsekvenser för månadsavgiften. Ett friköpt markinnehav ger föreningen en betydande ekonomisk fördel och långsiktig stabilitet, vilket är en grundläggande faktor för förutsägbara boendekostnader."
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={data.ownsLand === true ? "default" : "outline"}
              onClick={() => updateData({ ownsLand: true })}
              className={`flex-1 h-12 ${
                data.ownsLand === true 
                  ? 'bg-nature-calm-green hover:bg-nature-calm-green/90 text-nature-light-grey' 
                  : 'border-nature-calm-green text-nature-calm-green hover:bg-nature-calm-green/10'
              }`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Ja
            </Button>
            <Button
              type="button"
              variant={data.ownsLand === false ? "default" : "outline"}
              onClick={() => updateData({ ownsLand: false })}
              className={`flex-1 h-12 ${
                data.ownsLand === false 
                  ? 'bg-nature-dark-terracotta hover:bg-nature-dark-terracotta/90 text-nature-light-grey' 
                  : 'border-nature-dark-terracotta text-nature-dark-terracotta hover:bg-nature-dark-terracotta/10'
              }`}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Nej
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-nature-subtle-beige border-nature-subtle-beige/20">
          <Label htmlFor="underhållsplan" className="flex items-center gap-2 text-primary font-medium mb-2">
            <Building2 className="h-4 w-4" />
            Sammanfattning underhållsplan
          </Label>
          <Textarea
            id="underhållsplan"
            value={data.underhållsplan}
            onChange={(e) => updateData({ underhållsplan: e.target.value })}
            placeholder="Kort sammanfattning av föreningens underhållsplan och kommande större investeringar..."
            className="min-h-[100px]"
          />
        </Card>

        {/* Financial Health Indicator */}
        {data.debtPerSqm && data.feePerSqm && (
          <Card className="p-4 bg-gradient-to-r from-nature-light-grey to-nature-subtle-beige border-nature-subtle-beige/20">
            <h3 className="font-semibold text-primary mb-3">Ekonomisk hälsa</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground">Skuldrisk</p>
                <p className={`font-bold ${
                  parseInt(data.debtPerSqm.replace(/\s/g, '')) > 20000 
                    ? 'text-nature-dark-terracotta' 
                    : parseInt(data.debtPerSqm.replace(/\s/g, '')) > 10000 
                    ? 'text-amber-600' 
                    : 'text-nature-calm-green'
                }`}>
                  {parseInt(data.debtPerSqm.replace(/\s/g, '')) > 20000 
                    ? 'Hög' 
                    : parseInt(data.debtPerSqm.replace(/\s/g, '')) > 10000 
                    ? 'Medel' 
                    : 'Låg'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Avgiftsnivå</p>
                <p className={`font-bold ${
                  parseInt(data.feePerSqm.replace(/\s/g, '')) > 70 
                    ? 'text-nature-dark-terracotta' 
                    : parseInt(data.feePerSqm.replace(/\s/g, '')) > 50 
                    ? 'text-amber-600' 
                    : 'text-nature-calm-green'
                }`}>
                  {parseInt(data.feePerSqm.replace(/\s/g, '')) > 70 
                    ? 'Hög' 
                    : parseInt(data.feePerSqm.replace(/\s/g, '')) > 50 
                    ? 'Medel' 
                    : 'Låg'}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
