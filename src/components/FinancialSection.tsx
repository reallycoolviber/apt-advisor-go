import { StandardizedInput } from '@/components/StandardizedInput';
import { StandardizedTextarea } from '@/components/StandardizedTextarea';
import { StandardizedCard } from '@/components/StandardizedCard';
import { StandardizedFieldGroup } from '@/components/StandardizedFieldGroup';
import { Button } from '@/components/ui/button';
import { InfoButton } from '@/components/ui/info-button';
import { TrendingUp, DollarSign, PiggyBank, Building2, CheckCircle, XCircle, Settings, Activity } from 'lucide-react';

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


  const handleCashflowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    updateData({ cashflowPerSqm: formatted });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-3 leading-tight">Ekonomisk analys</h2>
        <p className="text-muted-foreground text-lg">Finansiella nyckeltal för lägenheten och bostadsrättsföreningen</p>
      </div>

      <div className="space-y-6">
        <StandardizedFieldGroup
          title="Skuld per kvm (SEK)"
          description="Föreningens totala skuld dividerat med total yta"
          icon={TrendingUp}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <StandardizedInput
                id="debtPerSqm"
                label=""
                value={data.debtPerSqm || ''}
                onChange={handleDebtChange}
                placeholder="15 000"
                size="lg"
              />
            </div>
            <InfoButton
              content="Att enbart fokusera på köpeskillingen kan vara en fälla; en kritisk faktor är föreningens skuld per kvadratmeter. En betydande skuldbörda kan signalera framtida avgiftshöjningar eller behov av kapitaltillskott, vilket ingen vill uppleva post-inflyttning. En låg skuld är ett starkt indikativt tecken på en ekonomiskt välskött förening med solid finansiell framförhållning. Det är en avgörande parameter för den långsiktiga ekonomiska tryggheten i boendet, och en djupdykning i detta är alltid att rekommendera."
            />
          </div>
        </StandardizedFieldGroup>


        <StandardizedFieldGroup
          title="Kassaflöde per kvm (SEK)"
          description="Föreningens årliga kassaflöde per kvm"
          icon={PiggyBank}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <StandardizedInput
                id="cashflowPerSqm"
                label=""
                value={data.cashflowPerSqm || ''}
                onChange={handleCashflowChange}
                placeholder="12"
                size="lg"
              />
            </div>
            <InfoButton
              content="Ett robust och positivt kassaflöde per kvadratmeter utgör föreningens finansiella ryggrad, vilket signalerar en ekonomi kapabel att hantera både oförutsedda utgifter och strategiska investeringar. Att granska detta är av yttersta vikt; ett starkt kassaflöde ger föreningen den handlingsfrihet som minskar risken för att medlemmarna behöver tillföra extra kapital vid oväntade reparationer. Det är en primär indikator på långsiktig ekonomisk stabilitet och ett tecken på att föreningen inte opererar på marginalen."
            />
          </div>
        </StandardizedFieldGroup>

        <StandardizedFieldGroup
          title="Alla stora underhåll är gjorda?"
          description="Kunskap om genomförda stora underhållsarbeten är fundamental för att undvika oväntade och kostsamma överraskningar"
          icon={Settings}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={data.majorMaintenanceDone === true ? "default" : "outline"}
                  onClick={() => updateData({ majorMaintenanceDone: true })}
                  className={`flex-1 h-12 ${
                    data.majorMaintenanceDone === true 
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                      : 'border-primary text-primary hover:bg-primary/10'
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
                      ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                      : 'border-destructive text-destructive hover:bg-destructive/10'
                  }`}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Nej
                </Button>
              </div>
            </div>
            <InfoButton
              content="Kunskap om genomförda stora underhållsarbeten är fundamental för att undvika oväntade och kostsamma överraskningar efter ett förvärv. Projekt som stambyten, takrenoveringar och fasadarbeten representerar betydande investeringar. Om dessa redan är genomförda, reduceras risken markant för framtida kapitaltillskott eller betydande avgiftshöjningar för de boende. Detta är en proaktiv granskning som säkrar den ekonomiska framtiden i bostaden och signalerar en väl underhållen fastighet."
            />
          </div>
        </StandardizedFieldGroup>

        <StandardizedFieldGroup
          title="Äger föreningen marken?"
          description="Frågan om föreningen innehar marken med äganderätt eller tomträtt är avgörande för ekonomisk stabilitet"
          icon={Building2}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={data.ownsLand === true ? "default" : "outline"}
                  onClick={() => updateData({ ownsLand: true })}
                  className={`flex-1 h-12 ${
                    data.ownsLand === true 
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                      : 'border-primary text-primary hover:bg-primary/10'
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
                      ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                      : 'border-destructive text-destructive hover:bg-destructive/10'
                  }`}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Nej
                </Button>
              </div>
            </div>
            <InfoButton
              content="Frågan om föreningen innehar marken med äganderätt eller tomträtt är avgörande för en bostadsrätts ekonomiska stabilitet. Om marken innehas med tomträtt, ådrar sig föreningen en årlig avgift till kommunen, en avgift som kan omförhandlas och därmed potentiellt höjas. Detta kan få direkta, negativa konsekvenser för månadsavgiften. Ett friköpt markinnehav ger föreningen en betydande ekonomisk fördel och långsiktig stabilitet, vilket är en grundläggande faktor för förutsägbara boendekostnader."
            />
          </div>
        </StandardizedFieldGroup>

        <StandardizedFieldGroup
          title="Sammanfattning underhållsplan"
          description="Kort sammanfattning av föreningens underhållsplan och kommande större investeringar"
          icon={Building2}
        >
          <StandardizedTextarea
            id="underhållsplan"
            label=""
            value={data.underhållsplan || ''}
            onChange={(e) => updateData({ underhållsplan: e.target.value })}
            placeholder="Kort sammanfattning av föreningens underhållsplan och kommande större investeringar..."
            rows={4}
          />
        </StandardizedFieldGroup>
      </div>

      {/* Financial Health Indicator */}
      {data.debtPerSqm && data.feePerSqm && (
        <StandardizedCard variant="secondary" className="text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-primary text-lg">Ekonomisk hälsa</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-4 rounded-lg bg-background border border-border">
              <p className="text-sm text-muted-foreground mb-2">Skuldrisk</p>
              <p className={`text-xl font-bold ${
                parseInt(data.debtPerSqm.replace(/\s/g, '')) > 20000 
                  ? 'text-destructive' 
                  : parseInt(data.debtPerSqm.replace(/\s/g, '')) > 10000 
                  ? 'text-warning' 
                  : 'text-success'
              }`}>
                {parseInt(data.debtPerSqm.replace(/\s/g, '')) > 20000 
                  ? 'Hög' 
                  : parseInt(data.debtPerSqm.replace(/\s/g, '')) > 10000 
                  ? 'Medel' 
                  : 'Låg'}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background border border-border">
              <p className="text-sm text-muted-foreground mb-2">Avgiftsnivå</p>
              <p className={`text-xl font-bold ${
                parseInt(data.feePerSqm.replace(/\s/g, '')) > 70 
                  ? 'text-destructive' 
                  : parseInt(data.feePerSqm.replace(/\s/g, '')) > 50 
                  ? 'text-warning' 
                  : 'text-success'
              }`}>
                {parseInt(data.feePerSqm.replace(/\s/g, '')) > 70 
                  ? 'Hög' 
                  : parseInt(data.feePerSqm.replace(/\s/g, '')) > 50 
                  ? 'Medel' 
                  : 'Låg'}
              </p>
            </div>
          </div>
        </StandardizedCard>
      )}
    </div>
  );
};