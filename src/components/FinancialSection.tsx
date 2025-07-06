
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp, DollarSign, PiggyBank, Building2, CheckCircle, XCircle } from 'lucide-react';

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
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Ekonomisk analys</h2>
        <p className="text-gray-600">Finansiella nyckeltal för lägenheten och bostadsrättsföreningen</p>
      </div>

      <div className="grid gap-4">
        <Card className="p-4">
          <Label htmlFor="debtPerSqm" className="flex items-center gap-2 text-blue-900 font-medium mb-2">
            <TrendingUp className="h-4 w-4" />
            Skuld per kvm (SEK)
          </Label>
          <Input
            id="debtPerSqm"
            value={data.debtPerSqm}
            onChange={handleDebtChange}
            placeholder="15 000"
            className="text-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Föreningens totala skuld dividerat med total yta</p>
        </Card>

        <Card className="p-4">
          <Label htmlFor="feePerSqm" className="flex items-center gap-2 text-blue-900 font-medium mb-2">
            <DollarSign className="h-4 w-4" />
            Avgift per kvm (SEK)
          </Label>
          <Input
            id="feePerSqm"
            value={data.feePerSqm}
            onChange={handleFeeChange}
            placeholder="56"
            className="text-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Månadsavgift dividerat med lägenhetens yta</p>
        </Card>

        <Card className="p-4">
          <Label htmlFor="cashflowPerSqm" className="flex items-center gap-2 text-blue-900 font-medium mb-2">
            <PiggyBank className="h-4 w-4" />
            Kassaflöde per kvm (SEK)
          </Label>
          <Input
            id="cashflowPerSqm"
            value={data.cashflowPerSqm}
            onChange={handleCashflowChange}
            placeholder="12"
            className="text-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Föreningens årliga kassaflöde per kvm</p>
        </Card>

        <Card className="p-4">
          <Label className="flex items-center gap-2 text-blue-900 font-medium mb-3">
            <Building2 className="h-4 w-4" />
            Äger föreningen marken?
          </Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={data.ownsLand === true ? "default" : "outline"}
              onClick={() => updateData({ ownsLand: true })}
              className={`flex-1 h-12 ${
                data.ownsLand === true 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'
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
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'border-red-600 text-red-600 hover:bg-red-50'
              }`}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Nej
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <Label htmlFor="underhållsplan" className="flex items-center gap-2 text-blue-900 font-medium mb-2">
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
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Ekonomisk hälsa</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-600">Skuldrisk</p>
                <p className={`font-bold ${
                  parseInt(data.debtPerSqm.replace(/\s/g, '')) > 20000 
                    ? 'text-red-600' 
                    : parseInt(data.debtPerSqm.replace(/\s/g, '')) > 10000 
                    ? 'text-yellow-600' 
                    : 'text-green-600'
                }`}>
                  {parseInt(data.debtPerSqm.replace(/\s/g, '')) > 20000 
                    ? 'Hög' 
                    : parseInt(data.debtPerSqm.replace(/\s/g, '')) > 10000 
                    ? 'Medel' 
                    : 'Låg'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Avgiftsnivå</p>
                <p className={`font-bold ${
                  parseInt(data.feePerSqm.replace(/\s/g, '')) > 70 
                    ? 'text-red-600' 
                    : parseInt(data.feePerSqm.replace(/\s/g, '')) > 50 
                    ? 'text-yellow-600' 
                    : 'text-green-600'
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
