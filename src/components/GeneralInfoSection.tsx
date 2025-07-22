import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ValidatedInput } from '@/components/ValidatedInput';
import { MapPin, Home, CreditCard, Users } from 'lucide-react';

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

      <div className="grid gap-4">
        <Card className="p-4 bg-card border-border">
          <Label htmlFor="address" className="flex items-center gap-2 text-foreground font-medium mb-2">
            <MapPin className="h-4 w-4" />
            Adress
          </Label>
          <Input
            id="address"
            value={data.address}
            onChange={(e) => updateData({ address: e.target.value })}
            placeholder="Storgatan 15, Stockholm"
            className="text-lg bg-background"
          />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-card border-border">
            <ValidatedInput
              id="size"
              label="Storlek (kvm)"
              value={data.size || ''}
              onChange={(e) => updateData({ size: e.target.value })}
              validation={data.validationResults?.size}
              placeholder="75"
              type="number"
              className="h-11 text-base"
            />
          </Card>

          <Card className="p-4 bg-card border-border">
            <ValidatedInput
              id="rooms"
              label="Antal rum"
              value={data.rooms || ''}
              onChange={(e) => updateData({ rooms: e.target.value })}
              validation={data.validationResults?.rooms}
              placeholder="3"
              type="number"
              className="h-11 text-base"
            />
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-card border-border">
            <ValidatedInput
              id="price"
              label="Utgångspris (SEK)"
              value={data.price || ''}
              onChange={handlePriceChange}
              validation={data.validationResults?.price}
              placeholder="4 500 000"
              className="text-base font-semibold h-11"
            />
          </Card>

          <Card className="p-4 bg-card border-border">
            <ValidatedInput
              id="finalPrice"
              label="Slutpris (SEK)"
              value={data.finalPrice || ''}
              onChange={(e) => {
                const formatted = formatNumber(e.target.value);
                updateData({ finalPrice: formatted });
              }}
              validation={data.validationResults?.finalPrice}
              placeholder="4 200 000"
              className="text-base font-semibold h-11"
            />
          </Card>
        </div>

        <Card className="p-4 bg-card border-border">
          <ValidatedInput
            id="monthlyFee"
            label="Månadsavgift (SEK)"
            value={data.monthlyFee || ''}
            onChange={handleFeeChange}
            validation={data.validationResults?.monthlyFee}
            placeholder="4 200"
            className="text-base h-11"
          />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.size && data.price && (
            <Card className="p-4 bg-secondary border-border">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Pris per kvm</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(parseInt(data.price.replace(/\s/g, '')) / parseInt(data.size)).toLocaleString()} SEK
                </p>
              </div>
            </Card>
          )}

          {feePerSqm && (
            <Card className="p-4 bg-secondary border-border">
              <div className="text-center">
                <p className="text-sm text-foreground mb-1">Avgift per kvm</p>
                <p className="text-2xl font-bold text-primary">
                  {feePerSqm.toLocaleString()} SEK/månad
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};