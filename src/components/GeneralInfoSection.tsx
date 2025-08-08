import { StandardizedInput } from '@/components/StandardizedInput';
import { StandardizedCard } from '@/components/StandardizedCard';
import { StandardizedFieldGroup } from '@/components/StandardizedFieldGroup';
import { ValidatedInput } from '@/components/ValidatedInput';
import { MapPin, Home, CreditCard, Users, Calculator, DollarSign } from 'lucide-react';
import { formatValue as formatDisplayValue } from '@/utils/formatValue';

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
    const rawValue = e.target.value.replace(/\D/g, ''); // Remove non-digits
    const formatted = formatNumber(rawValue); // For display
    updateData({ price: rawValue }); // Store base unit (raw number string)
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // Remove non-digits
    const formatted = formatNumber(rawValue); // For display
    updateData({ monthlyFee: rawValue }); // Store base unit (raw number string)
  };

  const handleFinalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // Remove non-digits
    const formatted = formatNumber(rawValue); // For display
    updateData({ finalPrice: rawValue }); // Store base unit (raw number string)
  };

  // Calculate fee per square meter
  const calculateFeePerSqm = () => {
    console.log('Calculating feePerSqm:', { monthlyFee: data.monthlyFee, size: data.size });
    if (data.monthlyFee && data.size) {
      const fee = parseInt(data.monthlyFee.replace(/\s/g, ''));
      const size = parseInt(data.size);
      console.log('Parsed values:', { fee, size });
      if (fee && size) {
        const result = Math.round(fee / size);
        console.log('Calculated feePerSqm:', result);
        return result;
      }
    }
    console.log('Cannot calculate feePerSqm - missing data');
    return null;
  };

  const feePerSqm = calculateFeePerSqm();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-prominent font-semibold">Allmän information</h2>
        <p className="text-small text-muted-foreground">Grundläggande uppgifter om lägenheten</p>
      </div>

      <div className="space-y-3">
        <div className="grid md:grid-cols-1 gap-3">
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

        <div className="grid md:grid-cols-1 gap-3">
          <StandardizedFieldGroup
            title="Utgångspris (SEK)"
            description="Ursprungligt utgångspris"
            icon={CreditCard}
          >
            <ValidatedInput
              id="price"
              label=""
               value={data.price ? formatNumber(data.price) : ''}
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
               value={data.finalPrice ? formatNumber(data.finalPrice) : ''}
               onChange={handleFinalPriceChange}
               placeholder="3 200 000"
              validation={data.validationResults?.finalPrice}
            />
        </StandardizedFieldGroup>

        <StandardizedFieldGroup
          title="Månadsavgift (SEK)"
          description="Månatlig avgift"
          icon={DollarSign}
        >
          <ValidatedInput
            id="monthlyFee"
            label=""
               value={data.monthlyFee ? formatNumber(data.monthlyFee) : ''}
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
                  <p className="text-small text-muted-foreground mb-1">Pris per kvm</p>
                  <p className="text-prominent font-bold text-primary">
                    {formatDisplayValue(Math.round(parseInt(data.price.replace(/\s/g, '')) / parseInt(data.size)), 'price_per_sqm')}
                  </p>
                </div>
              )}
              
              {feePerSqm && (
                <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <DollarSign className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-small text-muted-foreground mb-1">Avgift per kvm</p>
                  <p className="text-prominent font-bold text-primary">
                    {formatDisplayValue(feePerSqm, 'fee_per_sqm')}
                  </p>
                </div>
              )}
            </div>
          </StandardizedCard>
        )}
        </div>
      </div>
    </div>
  );
};