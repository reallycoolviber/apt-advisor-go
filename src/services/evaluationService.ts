import { supabase } from '@/integrations/supabase/client';

export interface EvaluationData {
  id?: string;
  user_id?: string;
  source_id?: string;
  address?: string;
  size?: number;
  price?: number;
  rooms?: string;
  monthly_fee?: number;
  debt_per_sqm?: number;
  fee_per_sqm?: number;
  cashflow_per_sqm?: number;
  major_maintenance_done?: boolean;
  owns_land?: boolean;
  planlösning?: number;
  kitchen?: number;
  bathroom?: number;
  bedrooms?: number;
  surfaces?: number;
  förvaring?: number;
  ljusinsläpp?: number;
  balcony?: number;
  planlösning_comment?: string;
  kitchen_comment?: string;
  bathroom_comment?: string;
  bedrooms_comment?: string;
  surfaces_comment?: string;
  förvaring_comment?: string;
  ljusinsläpp_comment?: string;
  balcony_comment?: string;
  underhållsplan?: string;
  comments?: string;
  apartment_url?: string;
  annual_report_url?: string;
  final_price?: number;
  is_draft?: boolean;
}

/**
 * Genererar ett source_id baserat på URL eller adress
 */
export function generateSourceId(apartmentUrl?: string, address?: string): string {
  if (apartmentUrl) {
    // Extrahera ID från Hemnet/Booli URL
    const hemnetMatch = apartmentUrl.match(/hemnet\.se\/bostad\/(\d+)/);
    const booliMatch = apartmentUrl.match(/booli\.se\/bostad\/(\d+)/);
    
    if (hemnetMatch) return `hemnet:${hemnetMatch[1]}`;
    if (booliMatch) return `booli:${booliMatch[1]}`;
    
    // Fallback: använd hela URL:en som ID
    return `url:${apartmentUrl}`;
  }
  
  if (address) {
    // Normalisera adressen för konsekvent ID
    const normalizedAddress = address
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]/g, '');
    return `address:${normalizedAddress}`;
  }
  
  // Fallback: generera random ID (inte idealt för de-duplicering)
  return `manual:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Huvudfunktion för att hämta eller skapa en utvärdering
 * Implementerar de-duplicering baserat på source_id
 */
export async function getOrCreateEvaluation(
  sourceId: string,
  initialData?: Partial<EvaluationData>
): Promise<{ data: EvaluationData; created: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Användare inte inloggad');
  }

  try {
    // Försök hitta befintlig utvärdering
    const { data: existing, error: searchError } = await supabase
      .from('apartment_evaluations')
      .select('*')
      .eq('user_id', user.id)
      .eq('source_id', sourceId)
      .maybeSingle();

    if (searchError) {
      console.error('Error searching for existing evaluation:', searchError);
      throw new Error('Kunde inte söka efter befintlig utvärdering');
    }

    // Om utvärdering redan finns, returnera den
    if (existing) {
      console.log('Found existing evaluation:', existing.id);
      return { data: existing, created: false };
    }

    // Skapa ny utvärdering
    const newEvaluation = {
      user_id: user.id,
      source_id: sourceId,
      is_draft: true,
      ...initialData
    };

    const { data: created, error: createError } = await supabase
      .from('apartment_evaluations')
      .insert(newEvaluation)
      .select()
      .single();

    if (createError) {
      console.error('Error creating evaluation:', createError);
      throw new Error('Kunde inte skapa ny utvärdering');
    }

    console.log('Created new evaluation:', created.id);
    return { data: created, created: true };

  } catch (error) {
    console.error('getOrCreateEvaluation error:', error);
    throw error;
  }
}

/**
 * Sparar en befintlig utvärdering
 */
export async function saveEvaluation(
  evaluationId: string,
  data: Partial<EvaluationData>
): Promise<EvaluationData> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Användare inte inloggad');
  }

  try {
    // Ta bort user_id och id från data för att undvika konflikter
    const { user_id, id, ...updateData } = data;

    const { data: updated, error } = await supabase
      .from('apartment_evaluations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', evaluationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error saving evaluation:', error);
      throw new Error('Kunde inte spara utvärderingen');
    }

    return updated;

  } catch (error) {
    console.error('saveEvaluation error:', error);
    throw error;
  }
}

/**
 * Hämtar en utvärdering baserat på ID
 */
export async function getEvaluationById(evaluationId: string): Promise<EvaluationData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Användare inte inloggad');
  }

  try {
    const { data, error } = await supabase
      .from('apartment_evaluations')
      .select('*')
      .eq('id', evaluationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching evaluation:', error);
      throw new Error('Kunde inte hämta utvärderingen');
    }

    return data;

  } catch (error) {
    console.error('getEvaluationById error:', error);
    throw error;
  }
}

/**
 * Markerar en utvärdering som slutförd (inte längre draft)
 */
export async function finalizeEvaluation(evaluationId: string): Promise<EvaluationData> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Användare inte inloggad');
  }

  try {
    const { data: finalized, error } = await supabase
      .from('apartment_evaluations')
      .update({ 
        is_draft: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', evaluationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error finalizing evaluation:', error);
      throw new Error('Kunde inte slutföra utvärderingen');
    }

    return finalized;

  } catch (error) {
    console.error('finalizeEvaluation error:', error);
    throw error;
  }
}