import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { EvaluationFormData, EvaluationData, AutoSaveStatus } from '@/types/evaluation';
import { saveEvaluation, getEvaluationById, getOrCreateEvaluation, generateSourceId } from '@/services/evaluationService';
import { supabase } from '@/integrations/supabase/client';

interface EvaluationStore {
  // All evaluations list (for /evaluations page)
  evaluations: EvaluationData[];
  evaluationsLoading: boolean;
  evaluationsError: string | null;
  
  // Current evaluation being edited
  currentEvaluation: EvaluationFormData | null;
  currentEvaluationId: string | null;
  currentEvaluationLoading: boolean;
  currentEvaluationError: string | null;
  isDraft: boolean;
  hasUnsavedChanges: boolean;
  
  // Auto-save status
  autoSaveStatus: AutoSaveStatus;
  
  // Actions for evaluations list
  fetchEvaluations: (userId: string) => Promise<void>;
  deleteEvaluation: (evaluationId: string) => Promise<void>;
  
  // Actions for current evaluation
  loadEvaluation: (evaluationId: string) => Promise<void>;
  createNewEvaluation: () => void;
  updateField: (section: keyof EvaluationFormData, field: string, value: any) => void;
  saveCurrentEvaluation: () => Promise<void>;
  clearCurrentEvaluation: () => void;
  
  // Internal helpers
  _setAutoSaveStatus: (status: AutoSaveStatus) => void;
  _markSaved: () => void;
}

// Default empty form data
const defaultFormData: EvaluationFormData = {
  address: '',
  general: {
    size: '',
    rooms: '',
    price: '',
    finalPrice: '',
    monthlyFee: ''
  },
  financial: {
    debtPerSqm: '',
    cashflowPerSqm: '',
    majorMaintenanceDone: false,
    ownsLand: false,
    underhållsplan: ''
  },
  physical: {
    planlösning: 0,
    kitchen: 0,
    bathroom: 0,
    bedrooms: 0,
    surfaces: 0,
    förvaring: 0,
    ljusinsläpp: 0,
    balcony: 0,
    planlösning_comment: '',
    kitchen_comment: '',
    bathroom_comment: '',
    bedrooms_comment: '',
    surfaces_comment: '',
    förvaring_comment: '',
    ljusinsläpp_comment: '',
    balcony_comment: '',
    comments: ''
  }
};

// Conversion helpers
const parseFormattedNumber = (value: string): number | undefined => {
  if (!value || value.trim() === '') return undefined;
  const cleanValue = value.replace(/\s+/g, '').replace(',', '.');
  const num = parseFloat(cleanValue);
  return isNaN(num) ? undefined : num;
};

const normalizeNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const stringValue = typeof value === 'string' ? value : String(value);
  const cleanValue = stringValue.replace(/\s+/g, '').replace(',', '.');
  const num = parseFloat(cleanValue);
  return isNaN(num) ? null : num;
};

const normalizePrice = (v: any): number | null => {
  const n = normalizeNumber(v);
  if (n === null) return null;
  return n > 0 && n < 100000 ? n * 1_000_000 : n;
};

const normalizeDebtPerSqm = (v: any): number | null => {
  const n = normalizeNumber(v);
  if (n === null) return null;
  return n > 0 && n < 1000 ? n * 1000 : n;
};

const formDataToEvaluationData = (formData: EvaluationFormData): Partial<EvaluationData> => {
  return {
    address: formData.address,
    size: parseFormattedNumber(formData.general.size),
    rooms: formData.general.rooms,
    price: parseFormattedNumber(formData.general.price),
    monthly_fee: parseFormattedNumber(formData.general.monthlyFee),
    final_price: parseFormattedNumber(formData.general.finalPrice),
    debt_per_sqm: parseFormattedNumber(formData.financial.debtPerSqm),
    cashflow_per_sqm: parseFormattedNumber(formData.financial.cashflowPerSqm),
    major_maintenance_done: formData.financial.majorMaintenanceDone,
    owns_land: formData.financial.ownsLand,
    underhållsplan: formData.financial.underhållsplan,
    planlösning: formData.physical.planlösning || undefined,
    kitchen: formData.physical.kitchen || undefined,
    bathroom: formData.physical.bathroom || undefined,
    bedrooms: formData.physical.bedrooms || undefined,
    surfaces: formData.physical.surfaces || undefined,
    förvaring: formData.physical.förvaring || undefined,
    ljusinsläpp: formData.physical.ljusinsläpp || undefined,
    balcony: formData.physical.balcony || undefined,
    planlösning_comment: formData.physical.planlösning_comment,
    kitchen_comment: formData.physical.kitchen_comment,
    bathroom_comment: formData.physical.bathroom_comment,
    bedrooms_comment: formData.physical.bedrooms_comment,
    surfaces_comment: formData.physical.surfaces_comment,
    förvaring_comment: formData.physical.förvaring_comment,
    ljusinsläpp_comment: formData.physical.ljusinsläpp_comment,
    balcony_comment: formData.physical.balcony_comment,
    comments: formData.physical.comments,
  };
};

const evaluationDataToFormData = (data: EvaluationData): EvaluationFormData => {
  return {
    address: data.address || '',
    general: {
      size: data.size?.toString() || '',
      rooms: data.rooms || '',
      price: normalizePrice(data.price)?.toString() || '',
      finalPrice: data.final_price?.toString() || '',
      monthlyFee: normalizeNumber(data.monthly_fee)?.toString() || ''
    },
    financial: {
      debtPerSqm: normalizeDebtPerSqm(data.debt_per_sqm)?.toString() || '',
      cashflowPerSqm: normalizeNumber(data.cashflow_per_sqm)?.toString() || '',
      majorMaintenanceDone: data.major_maintenance_done || false,
      ownsLand: data.owns_land || false,
      underhållsplan: data.underhållsplan || ''
    },
    physical: {
      planlösning: data.planlösning || 0,
      kitchen: data.kitchen || 0,
      bathroom: data.bathroom || 0,
      bedrooms: data.bedrooms || 0,
      surfaces: data.surfaces || 0,
      förvaring: data.förvaring || 0,
      ljusinsläpp: data.ljusinsläpp || 0,
      balcony: data.balcony || 0,
      planlösning_comment: data.planlösning_comment || '',
      kitchen_comment: data.kitchen_comment || '',
      bathroom_comment: data.bathroom_comment || '',
      bedrooms_comment: data.bedrooms_comment || '',
      surfaces_comment: data.surfaces_comment || '',
      förvaring_comment: data.förvaring_comment || '',
      ljusinsläpp_comment: data.ljusinsläpp_comment || '',
      balcony_comment: data.balcony_comment || '',
      comments: data.comments || ''
    }
  };
};

export const useEvaluationStore = create<EvaluationStore>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        // State
        evaluations: [],
        evaluationsLoading: false,
        evaluationsError: null,
        
        currentEvaluation: null,
        currentEvaluationId: null,
        currentEvaluationLoading: false,
        currentEvaluationError: null,
        isDraft: true,
        hasUnsavedChanges: false,
        
        autoSaveStatus: {
          saving: false,
          saved: false,
          error: null
        },

        // Actions for evaluations list
        fetchEvaluations: async (userId: string) => {
          set({ evaluationsLoading: true, evaluationsError: null });
          
          try {
            const { data, error } = await supabase
              .from('apartment_evaluations')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false });

            if (error) throw error;
            
            set({ 
              evaluations: data || [],
              evaluationsLoading: false
            });
          } catch (error) {
            console.error('Error fetching evaluations:', error);
            set({ 
              evaluationsError: 'Kunde inte ladda utvärderingar',
              evaluationsLoading: false
            });
          }
        },

        deleteEvaluation: async (evaluationId: string) => {
          try {
            const { error } = await supabase
              .from('apartment_evaluations')
              .delete()
              .eq('id', evaluationId);

            if (error) throw error;
            
            // Remove from local state
            set(state => ({
              evaluations: state.evaluations.filter(e => e.id !== evaluationId)
            }));
          } catch (error) {
            console.error('Error deleting evaluation:', error);
            throw new Error('Kunde inte ta bort utvärderingen');
          }
        },

        // Actions for current evaluation
        loadEvaluation: async (evaluationId: string) => {
          set({ currentEvaluationLoading: true, currentEvaluationError: null });
          
          try {
            const evaluationData = await getEvaluationById(evaluationId);
            
            if (!evaluationData) {
              throw new Error('Utvärderingen kunde inte hittas');
            }

            const formData = evaluationDataToFormData(evaluationData);
            
            set({
              currentEvaluation: formData,
              currentEvaluationId: evaluationId,
              isDraft: evaluationData.is_draft ?? true,
              hasUnsavedChanges: false,
              currentEvaluationLoading: false
            });
          } catch (error) {
            console.error('Error loading evaluation:', error);
            set({
              currentEvaluationError: 'Kunde inte ladda utvärderingen',
              currentEvaluationLoading: false
            });
          }
        },

        createNewEvaluation: () => {
          set({
            currentEvaluation: { ...defaultFormData },
            currentEvaluationId: null,
            isDraft: true,
            hasUnsavedChanges: false,
            currentEvaluationError: null
          });
        },

        updateField: (section: keyof EvaluationFormData, field: string, value: any) => {
          set(state => {
            if (!state.currentEvaluation) return state;
            
            let newEvaluation: EvaluationFormData;
            
            if (section === 'address') {
              // Special case for address field
              newEvaluation = {
                ...state.currentEvaluation,
                address: value
              };
            } else {
              newEvaluation = {
                ...state.currentEvaluation,
                [section]: {
                  ...state.currentEvaluation[section],
                  [field]: value
                }
              };
            }
            
            return {
              currentEvaluation: newEvaluation,
              hasUnsavedChanges: true
            };
          });
        },

        saveCurrentEvaluation: async () => {
          const state = get();
          if (!state.currentEvaluation) return;
          
          set(state => ({
            autoSaveStatus: { saving: true, saved: false, error: null }
          }));
          
          try {
            let evaluationId = state.currentEvaluationId;
            
            // Create new evaluation if needed
            if (!evaluationId) {
              const sourceId = generateSourceId(undefined, state.currentEvaluation.address || 'manual-entry');
              const evaluationData = formDataToEvaluationData(state.currentEvaluation);
              const result = await getOrCreateEvaluation(sourceId, evaluationData);
              evaluationId = result.data.id!;
              
              set({
                currentEvaluationId: evaluationId
              });
            }
            
            // Save the evaluation
            const evaluationData = formDataToEvaluationData(state.currentEvaluation);
            await saveEvaluation(evaluationId, evaluationData);
            
            // Update the evaluations list
            const updatedEvaluations = state.evaluations.map(e => 
              e.id === evaluationId 
                ? { ...e, ...evaluationData, id: evaluationId }
                : e
            );
            
            // If it's a new evaluation, add it to the list
            if (!state.evaluations.find(e => e.id === evaluationId)) {
              updatedEvaluations.unshift({ 
                ...evaluationData, 
                id: evaluationId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
            
            set({
              evaluations: updatedEvaluations,
              hasUnsavedChanges: false,
              autoSaveStatus: { saving: false, saved: true, error: null }
            });
            
            // Clear saved status after 2 seconds
            setTimeout(() => {
              set(state => ({
                autoSaveStatus: { ...state.autoSaveStatus, saved: false }
              }));
            }, 2000);
            
          } catch (error) {
            console.error('Error saving evaluation:', error);
            const errorMessage = error instanceof Error ? error.message : 'Kunde inte spara utvärderingen';
            set({
              autoSaveStatus: { saving: false, saved: false, error: errorMessage }
            });
          }
        },

        clearCurrentEvaluation: () => {
          set({
            currentEvaluation: null,
            currentEvaluationId: null,
            isDraft: true,
            hasUnsavedChanges: false,
            currentEvaluationError: null
          });
        },

        // Internal helpers
        _setAutoSaveStatus: (status: AutoSaveStatus) => {
          set({ autoSaveStatus: status });
        },

        _markSaved: () => {
          set({ hasUnsavedChanges: false });
        }
      })
    ),
    { name: 'evaluation-store' }
  )
);