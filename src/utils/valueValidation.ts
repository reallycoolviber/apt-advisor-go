interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

interface ValidationThresholds {
  size: { min: number; max: number };
  rooms: { min: number; max: number };
  price: { min: number; max: number };
  monthlyFee: { min: number; max: number };
  pricePerSqm: { min: number; max: number };
  feePerSqm: { min: number; max: number };
}

const DEFAULT_THRESHOLDS: ValidationThresholds = {
  size: { min: 10, max: 500 }, // 10-500 kvm
  rooms: { min: 1, max: 10 }, // 1-10 rum
  price: { min: 100000, max: 50000000 }, // 100k-50M SEK
  monthlyFee: { min: 500, max: 50000 }, // 500-50k SEK/månad
  pricePerSqm: { min: 5000, max: 200000 }, // 5k-200k SEK/kvm
  feePerSqm: { min: 10, max: 1000 } // 10-1000 SEK/kvm/månad
};

export const validateScrapedValue = (
  field: keyof ValidationThresholds,
  value: string | number,
  relatedValues?: { size?: string | number; price?: string | number; monthlyFee?: string | number }
): ValidationResult => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue) || numValue <= 0) {
    return { isValid: false, reason: 'Ogiltigt eller negativt värde' };
  }

  const thresholds = DEFAULT_THRESHOLDS[field];
  
  // Basic range validation
  if (numValue < thresholds.min || numValue > thresholds.max) {
    return { 
      isValid: false, 
      reason: `Värdet ${numValue} ligger utanför rimligt intervall (${thresholds.min}-${thresholds.max})` 
    };
  }

  // Additional logic-based validations
  if (field === 'rooms' && relatedValues?.size) {
    const sizeNum = typeof relatedValues.size === 'string' ? parseFloat(relatedValues.size) : relatedValues.size;
    if (!isNaN(sizeNum) && sizeNum > 0) {
      const roomsPerSqm = numValue / sizeNum;
      if (roomsPerSqm > 0.2) { // Mer än 1 rum per 5 kvm är orimligt
        return { 
          isValid: false, 
          reason: 'För många rum i förhållande till storleken' 
        };
      }
    }
  }

  // Validate price per square meter if we have both price and size
  if (field === 'price' && relatedValues?.size) {
    const sizeNum = typeof relatedValues.size === 'string' ? parseFloat(relatedValues.size) : relatedValues.size;
    if (!isNaN(sizeNum) && sizeNum > 0) {
      const pricePerSqm = numValue / sizeNum;
      if (pricePerSqm < DEFAULT_THRESHOLDS.pricePerSqm.min || pricePerSqm > DEFAULT_THRESHOLDS.pricePerSqm.max) {
        return { 
          isValid: false, 
          reason: `Priset per kvm (${Math.round(pricePerSqm)} kr/kvm) verkar orimligt` 
        };
      }
    }
  }

  // Validate monthly fee per square meter
  if (field === 'monthlyFee' && relatedValues?.size) {
    const sizeNum = typeof relatedValues.size === 'string' ? parseFloat(relatedValues.size) : relatedValues.size;
    if (!isNaN(sizeNum) && sizeNum > 0) {
      const feePerSqm = numValue / sizeNum;
      if (feePerSqm < DEFAULT_THRESHOLDS.feePerSqm.min || feePerSqm > DEFAULT_THRESHOLDS.feePerSqm.max) {
        return { 
          isValid: false, 
          reason: `Månadsavgiften per kvm (${Math.round(feePerSqm)} kr/kvm/mån) verkar orimlig` 
        };
      }
    }
  }

  return { isValid: true };
};

export const validateAllScrapedValues = (data: {
  size?: string;
  rooms?: string;
  price?: string;
  finalPrice?: string;
  monthlyFee?: string;
}): Record<string, ValidationResult> => {
  const results: Record<string, ValidationResult> = {};
  
  if (data.size) {
    results.size = validateScrapedValue('size', data.size);
  }
  
  if (data.rooms) {
    results.rooms = validateScrapedValue('rooms', data.rooms, { size: data.size });
  }
  
  if (data.price) {
    results.price = validateScrapedValue('price', data.price, { size: data.size });
  }
  
  if (data.finalPrice) {
    results.finalPrice = validateScrapedValue('price', data.finalPrice, { size: data.size });
  }
  
  if (data.monthlyFee) {
    results.monthlyFee = validateScrapedValue('monthlyFee', data.monthlyFee, { size: data.size });
  }
  
  return results;
};