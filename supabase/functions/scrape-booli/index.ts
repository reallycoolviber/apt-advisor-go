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

    // Extract data using regex patterns that are robust to minor HTML changes
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

    console.log('Extracted data:', extractedData);

    // Return the extracted data
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData 
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