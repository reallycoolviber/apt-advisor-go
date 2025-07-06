
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Allmän information</h2>
        <p className="text-gray-600">Grundläggande uppgifter om lägenheten</p>
      </div>

      <div className="grid gap-4">
        <Card className="p-4">
          <Label htmlFor="address" className="flex items-center gap-2 text-blue-900 font-medium mb-2">
            <MapPin className="h-4 w-4" />
            Adress
          </Label>
          <Input
            id="address"
            value={data.address}
            onChange={(e) => updateData({ address: e.target.value })}
            placeholder="Storgatan 15, Stockholm"
            className="text-lg"
          />
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <Label htmlFor="size" className="flex items-center gap-2 text-blue-900 font-medium mb-2">
              <Home className="h-4 w-4" />
              Storlek (kvm)
            </Label>
            <Input
              id="size"
              type="number"
              value={data.size}
              onChange={(e) => updateData({ size: e.target.value })}
              placeholder="75"
            />
          </Card>

          <Card className="p-4">
            <Label htmlFor="rooms" className="flex items-center gap-2 text-blue-900 font-medium mb-2">
              <Users className="h-4 w-4" />
              Antal rum
            </Label>
            <Input
              id="rooms"
              type="number"
              value={data.rooms}
              onChange={(e) => updateData({ rooms: e.target.value })}
              placeholder="3"
            />
          </Card>
        </div>

        <Card className="p-4">
          <Label htmlFor="price" className="flex items-center gap-2 text-blue-900 font-medium mb-2">
            <CreditCard className="h-4 w-4" />
            Pris (SEK)
          </Label>
          <Input
            id="price"
            value={data.price}
            onChange={handlePriceChange}
            placeholder="4 500 000"
            className="text-lg font-semibold"
          />
        </Card>

        <Card className="p-4">
          <Label htmlFor="monthlyFee" className="flex items-center gap-2 text-blue-900 font-medium mb-2">
            <CreditCard className="h-4 w-4" />
            Månadsavgift (SEK)
          </Label>
          <Input
            id="monthlyFee"
            value={data.monthlyFee}
            onChange={handleFeeChange}
            placeholder="4 200"
            className="text-lg"
          />
        </Card>

        {data.size && data.price && (
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="text-center">
              <p className="text-sm text-emerald-700 mb-1">Pris per kvm</p>
              <p className="text-2xl font-bold text-emerald-900">
                {Math.round(parseInt(data.price.replace(/\s/g, '')) / parseInt(data.size)).toLocaleString()} SEK
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
