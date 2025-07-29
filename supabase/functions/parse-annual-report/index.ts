import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation rules for financial metrics
const VALIDATION_RULES = {
  debt_per_sqm: { min: 1000, max: 25000 },
  fee_per_sqm: { min: 10, max: 150 },
  cashflow_per_sqm: { min: -50, max: 100 }
};

const MAX_RETRIES = 3;

interface ParsedMetrics {
  debt_per_sqm?: number;
  fee_per_sqm?: number;
  cashflow_per_sqm?: number;
}

interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

function validateMetrics(metrics: ParsedMetrics): ValidationResult {
  const issues: string[] = [];
  
  if (metrics.debt_per_sqm !== undefined) {
    const { min, max } = VALIDATION_RULES.debt_per_sqm;
    if (metrics.debt_per_sqm < min || metrics.debt_per_sqm > max) {
      issues.push(`Skuld per kvm (${metrics.debt_per_sqm}) är utanför normalt intervall (${min}-${max})`);
    }
  }
  
  if (metrics.fee_per_sqm !== undefined) {
    const { min, max } = VALIDATION_RULES.fee_per_sqm;
    if (metrics.fee_per_sqm < min || metrics.fee_per_sqm > max) {
      issues.push(`Avgift per kvm (${metrics.fee_per_sqm}) är utanför normalt intervall (${min}-${max})`);
    }
  }
  
  if (metrics.cashflow_per_sqm !== undefined) {
    const { min, max } = VALIDATION_RULES.cashflow_per_sqm;
    if (metrics.cashflow_per_sqm < min || metrics.cashflow_per_sqm > max) {
      issues.push(`Kassaflöde per kvm (${metrics.cashflow_per_sqm}) är utanför normalt intervall (${min}-${max})`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

async function downloadPDF(url: string): Promise<ArrayBuffer> {
  console.log('Downloading PDF from:', url);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('pdf')) {
    console.warn('Content-Type is not PDF:', contentType);
  }
  
  return await response.arrayBuffer();
}

async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  console.log('Extracting text from PDF buffer of size:', pdfBuffer.byteLength);
  
  // Using pdf-parse library via npm CDN
  const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');
  
  try {
    const data = await pdfParse.default(Buffer.from(pdfBuffer));
    console.log('Successfully extracted text, length:', data.text.length);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

function parseMetricsFromText(text: string, attempt: number = 1): ParsedMetrics {
  console.log(`Parsing metrics from text (attempt ${attempt})`);
  
  const metrics: ParsedMetrics = {};
  
  // Patterns for different metrics with variations based on attempt
  const patterns = {
    debt_per_sqm: [
      /skuld\s+per\s+kvm?\s*[:\-]?\s*(\d+(?:\s?\d+)*(?:[,\.]\d+)?)/gi,
      /belåning(?:sgrad)?\s+per\s+kvm?\s*[:\-]?\s*(\d+(?:\s?\d+)*(?:[,\.]\d+)?)/gi,
      /total\s+skuld.{0,50}per\s+kvm?\s*[:\-]?\s*(\d+(?:\s?\d+)*(?:[,\.]\d+)?)/gi,
      /skuldsättning\s+per\s+kvm?\s*[:\-]?\s*(\d+(?:\s?\d+)*(?:[,\.]\d+)?)/gi
    ],
    fee_per_sqm: [
      /avgift\s+per\s+kvm?\s*[:\-]?\s*(\d+(?:\s?\d+)*(?:[,\.]\d+)?)/gi,
      /månadsavgift.{0,30}per\s+kvm?\s*[:\-]?\s*(\d+(?:\s?\d+)*(?:[,\.]\d+)?)/gi,
      /föreningsavgift\s+per\s+kvm?\s*[:\-]?\s*(\d+(?:\s?\d+)*(?:[,\.]\d+)?)/gi,
      /avgift.{0,20}kvm?\s*[:\-]?\s*(\d+(?:\s?\d+)*(?:[,\.]\d+)?)/gi
    ],
    cashflow_per_sqm: [
      /kassaflöde\s+per\s+kvm?\s*[:\-]?\s*(\d+(?:\s?\d+)*(?:[,\.]\d+)?)/gi,
      /(?:årligt\s+)?kassaflöde.{0,30}per\s+kvm?\s*[:\-]?\s*(\d+(?:\s?\d+)*(?:[,\.]\d+)?)/gi,
      /netto(?:kassaflöde)?\s+per\s+kvm?\s*[:\-]?\s*(\d+(?:\s?\d+)*(?:[,\.]\d+)?)/gi,
      /resultat\s+per\s+kvm?\s*[:\-]?\s*(\d+(?:\s?\d+)*(?:[,\.]\d+)?)/gi
    ]
  };
  
  // Try each pattern for each metric
  for (const [metricKey, metricPatterns] of Object.entries(patterns)) {
    const values: number[] = [];
    
    for (const pattern of metricPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        if (match[1]) {
          // Clean and parse the number
          const cleanNumber = match[1]
            .replace(/\s+/g, '') // Remove spaces
            .replace(/,/g, '.'); // Replace comma with dot for decimal
          
          const value = parseFloat(cleanNumber);
          if (!isNaN(value) && value > 0) {
            values.push(value);
          }
        }
      }
    }
    
    if (values.length > 0) {
      // Use median value if multiple found, or first value
      values.sort((a, b) => a - b);
      const medianIndex = Math.floor(values.length / 2);
      metrics[metricKey as keyof ParsedMetrics] = values[medianIndex];
      console.log(`Found ${metricKey}:`, values[medianIndex], 'from values:', values);
    }
  }
  
  return metrics;
}

async function parseAnnualReportWithRetries(url: string): Promise<ParsedMetrics> {
  console.log('Starting PDF parsing with retries for URL:', url);
  
  // Download PDF once
  const pdfBuffer = await downloadPDF(url);
  const text = await extractTextFromPDF(pdfBuffer);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`Parsing attempt ${attempt} of ${MAX_RETRIES}`);
    
    const metrics = parseMetricsFromText(text, attempt);
    const validation = validateMetrics(metrics);
    
    console.log('Parsed metrics:', metrics);
    console.log('Validation result:', validation);
    
    if (validation.isValid && Object.keys(metrics).length > 0) {
      console.log('Successfully parsed and validated metrics');
      return metrics;
    }
    
    if (attempt < MAX_RETRIES) {
      console.log(`Validation failed, retrying... Issues: ${validation.issues.join(', ')}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Progressive delay
    }
  }
  
  // Return whatever we have, even if not fully validated
  const finalMetrics = parseMetricsFromText(text);
  console.log('Final metrics after all retries:', finalMetrics);
  return finalMetrics;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'PDF URL är obligatorisk' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Processing annual report:', url);
    
    const metrics = await parseAnnualReportWithRetries(url);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        metrics,
        message: Object.keys(metrics).length > 0 
          ? `Extraherade ${Object.keys(metrics).length} nyckeltal från årsredovisningen`
          : 'Kunde inte extrahera några nyckeltal från årsredovisningen'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in parse-annual-report function:', error);
    
    let errorMessage = 'Ett oväntat fel uppstod vid parsning av årsredovisningen';
    
    if (error instanceof Error) {
      if (error.message.includes('download')) {
        errorMessage = 'Kunde inte ladda ner PDF-filen. Kontrollera att länken är korrekt och tillgänglig.';
      } else if (error.message.includes('extract')) {
        errorMessage = 'Kunde inte läsa innehållet i PDF-filen. Filen kan vara skadad eller lösenordsskyddad.';
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});