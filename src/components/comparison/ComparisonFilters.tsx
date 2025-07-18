import React from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, Star, Euro, Home, TrendingUp } from 'lucide-react';

export interface FilterValues {
  minRating: number;
  priceRange: [number, number];
  sizeRange: [number, number];
  minPricePerSqm: number;
}

interface ComparisonFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  evaluations: any[];
}

export const ComparisonFilters: React.FC<ComparisonFiltersProps> = ({
  filters,
  onFiltersChange,
  evaluations
}) => {
  // Calculate min/max values from evaluations
  const prices = evaluations.map(e => e.price).filter(p => p !== null);
  const sizes = evaluations.map(e => e.size).filter(s => s !== null);
  
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 10000000);
  const minSize = Math.min(...sizes, 0);
  const maxSize = Math.max(...sizes, 200);

  const updateFilters = (key: keyof FilterValues, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <Card className="bg-card shadow-lg border-0 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          Filtrera lägenheter
        </h3>
      </div>
      <p className="text-muted-foreground mb-6">
        Använd filtren nedan för att begränsa vilka lägenheter som ska jämföras.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rating Filter */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Star className="h-4 w-4 text-primary" />
            Minsta totalbetyg: {filters.minRating.toFixed(1)} stjärnor
          </Label>
          <Slider
            value={[filters.minRating]}
            onValueChange={([value]) => updateFilters('minRating', value)}
            max={5}
            min={0}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Price Range Filter */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Euro className="h-4 w-4 text-primary" />
            Prisintervall
          </Label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <Label htmlFor="min-price" className="text-xs text-muted-foreground">Från (kr)</Label>
              <Input
                id="min-price"
                type="number"
                value={filters.priceRange[0]}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  updateFilters('priceRange', [value, filters.priceRange[1]]);
                }}
                min={minPrice}
                max={maxPrice}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="max-price" className="text-xs text-muted-foreground">Till (kr)</Label>
              <Input
                id="max-price"
                type="number"
                value={filters.priceRange[1]}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || maxPrice;
                  updateFilters('priceRange', [filters.priceRange[0], value]);
                }}
                min={minPrice}
                max={maxPrice}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Size Range Filter */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Home className="h-4 w-4 text-primary" />
            Storleksintervall (kvm)
          </Label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <Label htmlFor="min-size" className="text-xs text-muted-foreground">Från (kvm)</Label>
              <Input
                id="min-size"
                type="number"
                value={filters.sizeRange[0]}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  updateFilters('sizeRange', [value, filters.sizeRange[1]]);
                }}
                min={minSize}
                max={maxSize}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="max-size" className="text-xs text-muted-foreground">Till (kvm)</Label>
              <Input
                id="max-size"
                type="number"
                value={filters.sizeRange[1]}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || maxSize;
                  updateFilters('sizeRange', [filters.sizeRange[0], value]);
                }}
                min={minSize}
                max={maxSize}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Price per SQM Filter */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-primary" />
            Minsta kvadratmeterpris: {filters.minPricePerSqm.toLocaleString('sv-SE')} kr/kvm
          </Label>
          <Slider
            value={[filters.minPricePerSqm]}
            onValueChange={([value]) => updateFilters('minPricePerSqm', value)}
            max={150000}
            min={0}
            step={1000}
            className="w-full"
          />
        </div>
      </div>
    </Card>
  );
};