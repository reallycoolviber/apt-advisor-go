import { StandardizedInput } from '@/components/StandardizedInput';
import { StandardizedCard } from '@/components/StandardizedCard';
import { StandardizedFieldGroup } from '@/components/StandardizedFieldGroup';
import { ValidatedInput } from '@/components/ValidatedInput';
import { MapPin, Home, CreditCard, Users, Calculator, DollarSign } from 'lucide-react';

interface GeneralInfoSectionProps {
  data: any;
  updateData: (data: any) => void;
}

export const GeneralInfoSection = ({ data, updateData }: GeneralInfoSectionProps) => {
  const formatNumber = (value: string) => {
    // Remove non-digits and format with spaces
    const number = value.replace(/\D/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    updateData({ price: formatted });
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    updateData({ monthlyFee: formatted });
  };

  const handleFinalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    updateData({ finalPrice: formatted });
  };

  // Calculate fee per square meter
  const calculateFeePerSqm = () => {
    if (data.monthlyFee && data.size) {
      const fee = parseInt(data.monthlyFee.replace(/\s/g, ''));
      const size = parseInt(data.size);
      if (fee && size) {
        return Math.round(fee / size);
      }
    }
    return null;
  };

  const feePerSqm = calculateFeePerSqm();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-3 leading-tight">Allmän information</h2>
        <p className="text-muted-foreground text-lg">Grundläggande uppgifter om lägenheten</p>
      </div>

      <div className="space-y-6">
        <StandardizedFieldGroup
          title="Adress"
          description="Fullständig adress för lägenheten"
          icon={MapPin}
        >
          <ValidatedInput
            id="address"
            label=""
            value={data.address || ''}
            onChange={(e) => updateData({ address: e.target.value })}
            placeholder="Kungsgatan 1, 111 43 Stockholm"
            validation={data.validationResults?.address}
          />
        </StandardizedFieldGroup>

        <div className="grid md:grid-cols-2 gap-6">
          <StandardizedFieldGroup
            title="Storlek (kvm)"
            description="Lägenhetens yta i kvadratmeter"
            icon={Home}
          >
            <ValidatedInput
              id="size"
              label=""
              value={data.size || ''}
              onChange={(e) => updateData({ size: e.target.value })}
              placeholder="75"
              type="number"
              validation={data.validationResults?.size}
            />
          </StandardizedFieldGroup>

          <StandardizedFieldGroup
            title="Antal rum"
            description="Totalt antal rum"
            icon={Users}
          >
            <ValidatedInput
              id="rooms"
              label=""
              value={data.rooms || ''}
              onChange={(e) => updateData({ rooms: e.target.value })}
              placeholder="3"
              type="number"
              validation={data.validationResults?.rooms}
            />
          </StandardizedFieldGroup>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <StandardizedFieldGroup
            title="Utgångspris (SEK)"
            description="Ursprungligt utgångspris"
            icon={CreditCard}
          >
            <ValidatedInput
              id="price"
              label=""
              value={data.price || ''}
              onChange={handlePriceChange}
              placeholder="3 500 000"
              validation={data.validationResults?.price}
            />
          </StandardizedFieldGroup>

          <StandardizedFieldGroup
            title="Slutpris (SEK)"
            description="Slutgiltigt försäljningspris"
            icon={CreditCard}
          >
            <ValidatedInput
              id="finalPrice"
              label=""
              value={data.finalPrice || ''}
              onChange={handleFinalPriceChange}
              placeholder="3 200 000"
              validation={data.validationResults?.finalPrice}
            />
          </StandardizedFieldGroup>
        </div>

        <StandardizedFieldGroup
          title="Månadsavgift (SEK)"
          description="Månatlig avgift"
          icon={DollarSign}
        >
          <ValidatedInput
            id="monthlyFee"
            label=""
            value={data.monthlyFee || ''}
            onChange={handleFeeChange}
            placeholder="4 200"
            validation={data.validationResults?.monthlyFee}
          />
        </StandardizedFieldGroup>

        {/* Calculated Values Section */}
        {data.price && data.size && (
          <StandardizedCard variant="secondary" className="text-center">
            <h3 className="font-semibold text-foreground mb-6">Beräknade värden</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {data.price && data.size && (
                <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Calculator className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Pris per kvm</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatNumber(Math.round(parseInt(data.price.replace(/\s/g, '')) / parseInt(data.size)).toString())} SEK
                  </p>
                </div>
              )}
              
              {feePerSqm && (
                <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <DollarSign className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Avgift per kvm</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatNumber(feePerSqm.toString())} SEK/månad
                  </p>
                </div>
              )}
            </div>
          </StandardizedCard>
        )}
      </div>
    </div>
  );
};