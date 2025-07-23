import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BooliData {
  address?: string;
  size?: string;
  rooms?: string;
  startPrice?: string;
  finalPrice?: string;
  monthlyFee?: string;
}

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

const VALIDATION_THRESHOLDS: ValidationThresholds = {
  size: { min: 15, max: 500 }, // 15-500 kvm
  rooms: { min: 1, max: 20 }, // 1-20 rum
  price: { min: 100000, max: 50000000 }, // 100k-50M SEK
  monthlyFee: { min: 500, max: 20000 }, // 500-20k SEK/månad
  pricePerSqm: { min: 10000, max: 150000 }, // 10k-150k SEK/kvm
  feePerSqm: { min: 10, max: 1000 } // 10-1000 SEK/kvm/månad
};

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

const validateScrapedValue = (
  field: keyof ValidationThresholds,
  value: string | number,
  relatedValues?: { size?: string | number; price?: string | number; monthlyFee?: string | number }
): ValidationResult => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue) || numValue <= 0) {
    return { isValid: false, reason: 'Ogiltigt eller negativt värde' };
  }

  const thresholds = VALIDATION_THRESHOLDS[field];
  
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
      if (pricePerSqm < VALIDATION_THRESHOLDS.pricePerSqm.min || pricePerSqm > VALIDATION_THRESHOLDS.pricePerSqm.max) {
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
      if (feePerSqm < VALIDATION_THRESHOLDS.feePerSqm.min || feePerSqm > VALIDATION_THRESHOLDS.feePerSqm.max) {
        return { 
          isValid: false, 
          reason: `Månadsavgiften per kvm (${Math.round(feePerSqm)} kr/kvm/mån) verkar orimlig` 
        };
      }
    }
  }

  return { isValid: true };
};

const validateAllScrapedValues = (data: BooliData): { isValid: boolean; invalidFields: string[] } => {
  const invalidFields: string[] = [];
  
  if (data.size) {
    const result = validateScrapedValue('size', data.size);
    if (!result.isValid) {
      invalidFields.push(`size: ${result.reason}`);
    }
  }
  
  if (data.rooms) {
    const result = validateScrapedValue('rooms', data.rooms, { size: data.size });
    if (!result.isValid) {
      invalidFields.push(`rooms: ${result.reason}`);
    }
  }
  
  if (data.startPrice) {
    const result = validateScrapedValue('price', data.startPrice, { size: data.size });
    if (!result.isValid) {
      invalidFields.push(`startPrice: ${result.reason}`);
    }
  }
  
  if (data.finalPrice) {
    const result = validateScrapedValue('price', data.finalPrice, { size: data.size });
    if (!result.isValid) {
      invalidFields.push(`finalPrice: ${result.reason}`);
    }
  }
  
  if (data.monthlyFee) {
    const result = validateScrapedValue('monthlyFee', data.monthlyFee, { size: data.size });
    if (!result.isValid) {
      invalidFields.push(`monthlyFee: ${result.reason}`);
    }
  }
  
  return { isValid: invalidFields.length === 0, invalidFields };
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const scrapeDataFromHtml = (html: string): BooliData => {
  const extractedData: BooliData = {};

  // Extract address - look for structured data or common patterns
  const addressPatterns = [
    /<h1[^>]*>([^<]+)<\/h1>/i,
    /<title>([^|]+)\|/i,
    /property-address[^>]*>([^<]+)</i,
    /\"streetAddress\":\"([^\"]+)\"/i
  ];

  for (const pattern of addressPatterns) {
    const addressMatch = html.match(pattern);
    if (addressMatch && addressMatch[1]) {
      extractedData.address = addressMatch[1].trim();
      break;
    }
  }

  // Extract size (square meters)
  const sizePatterns = [
    /(\d+)\s*m²/i,
    /(\d+)\s*kvm/i,
    /\"size\":(\d+)/i,
    /boarea[^>]*>(\d+)/i
  ];

  for (const pattern of sizePatterns) {
    const sizeMatch = html.match(pattern);
    if (sizeMatch && sizeMatch[1]) {
      extractedData.size = sizeMatch[1];
      break;
    }
  }

  // Extract number of rooms
  const roomsPatterns = [
    /(\d+)\s*rum/i,
    /(\d+)\s*r\s*o\s*k/i,
    /\"rooms\":(\d+)/i,
    /antal rum[^>]*>(\d+)/i
  ];

  for (const pattern of roomsPatterns) {
    const roomsMatch = html.match(pattern);
    if (roomsMatch && roomsMatch[1]) {
      extractedData.rooms = roomsMatch[1];
      break;
    }
  }

  // Extract starting price
  const startPricePatterns = [
    /utgångspris[^>]*>[\s\S]*?(\d+(?:\s\d{3})*)/i,
    /startpris[^>]*>[\s\S]*?(\d+(?:\s\d{3})*)/i,
    /\"startingPrice\":(\d+)/i,
    /pris[^>]*>[\s\S]*?(\d+(?:\s\d{3})*)/i
  ];

  for (const pattern of startPricePatterns) {
    const priceMatch = html.match(pattern);
    if (priceMatch && priceMatch[1]) {
      extractedData.startPrice = priceMatch[1].replace(/\s/g, '');
      break;
    }
  }

  // Extract final price (sold price)
  const finalPricePatterns = [
    /slutpris[^>]*>[\s\S]*?(\d+(?:\s\d{3})*)/i,
    /såld för[^>]*>[\s\S]*?(\d+(?:\s\d{3})*)/i,
    /\"finalPrice\":(\d+)/i,
    /sold.*?(\d+(?:\s\d{3})*)/i
  ];

  for (const pattern of finalPricePatterns) {
    const finalPriceMatch = html.match(pattern);
    if (finalPriceMatch && finalPriceMatch[1]) {
      extractedData.finalPrice = finalPriceMatch[1].replace(/\s/g, '');
      break;
    }
  }

  // Extract monthly fee
  const feePatterns = [
    /månadsavgift[^>]*>[\s\S]*?(\d+(?:\s\d{3})*)/i,
    /avgift[^>]*>[\s\S]*?(\d+(?:\s\d{3})*)/i,
    /\"monthlyFee\":(\d+)/i,
    /\/månad[^>]*>[\s\S]*?(\d+(?:\s\d{3})*)/i
  ];

  for (const pattern of feePatterns) {
    const feeMatch = html.match(pattern);
    if (feeMatch && feeMatch[1]) {
      extractedData.monthlyFee = feeMatch[1].replace(/\s/g, '');
      break;
    }
  }

  return extractedData;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url || !url.includes('booli.se')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Ogiltig Booli URL' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Scraping Booli URL:', url);

    let extractedData: BooliData = {};
    let attempt = 0;
    let validationResult = { isValid: false, invalidFields: [] };

    // Retry mechanism with validation
    while (attempt < MAX_RETRY_ATTEMPTS && !validationResult.isValid) {
      attempt++;
      console.log(`Scraping attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`);

      try {
        // Fetch the Booli page
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        console.log('Received HTML response, length:', html.length);

        // Extract data from HTML
        extractedData = scrapeDataFromHtml(html);
        console.log(`Attempt ${attempt} extracted data:`, extractedData);

        // Validate the extracted data
        validationResult = validateAllScrapedValues(extractedData);
        
        if (validationResult.isValid) {
          console.log('Validation passed, data is valid');
          break;
        } else {
          console.log(`Validation failed on attempt ${attempt}:`, validationResult.invalidFields);
          
          // If this isn't the last attempt, wait before retrying
          if (attempt < MAX_RETRY_ATTEMPTS) {
            console.log(`Waiting ${RETRY_DELAY_MS}ms before retry...`);
            await sleep(RETRY_DELAY_MS);
          }
        }
      } catch (error) {
        console.error(`Error on scraping attempt ${attempt}:`, error);
        
        // If this isn't the last attempt, wait before retrying
        if (attempt < MAX_RETRY_ATTEMPTS) {
          console.log(`Waiting ${RETRY_DELAY_MS}ms before retry...`);
          await sleep(RETRY_DELAY_MS);
        }
      }
    }

    // Filter out invalid fields from the final result
    const cleanedData: BooliData = {};
    
    // Only include address (always valid if found)
    if (extractedData.address) {
      cleanedData.address = extractedData.address;
    }
    
    // Only include validated numeric fields
    if (extractedData.size && validateScrapedValue('size', extractedData.size).isValid) {
      cleanedData.size = extractedData.size;
    }
    
    if (extractedData.rooms && validateScrapedValue('rooms', extractedData.rooms, { size: extractedData.size }).isValid) {
      cleanedData.rooms = extractedData.rooms;
    }
    
    if (extractedData.startPrice && validateScrapedValue('price', extractedData.startPrice, { size: extractedData.size }).isValid) {
      cleanedData.startPrice = extractedData.startPrice;
    }
    
    if (extractedData.finalPrice && validateScrapedValue('price', extractedData.finalPrice, { size: extractedData.size }).isValid) {
      cleanedData.finalPrice = extractedData.finalPrice;
    }
    
    if (extractedData.monthlyFee && validateScrapedValue('monthlyFee', extractedData.monthlyFee, { size: extractedData.size }).isValid) {
      cleanedData.monthlyFee = extractedData.monthlyFee;
    }

    console.log('Final cleaned data after validation:', cleanedData);
    
    // Log final validation status
    if (attempt >= MAX_RETRY_ATTEMPTS && !validationResult.isValid) {
      console.log(`Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Some values may be invalid:`, validationResult.invalidFields);
    }

    // Return the cleaned and validated data
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: cleanedData 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error scraping Booli:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Kunde inte hämta data från Booli. Kontrollera att länken är korrekt.' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});