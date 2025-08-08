import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { EvaluationFormData, EvaluationData, AutoSaveStatus } from '@/types/evaluation';
import { saveEvaluation, getEvaluationById, getOrCreateEvaluation, generateSourceId } from '@/services/evaluationService';
import { supabase } from '@/integrations/supabase/client';

interface ChecklistItem {
  id: string;
  user_id: string;
  evaluation_id: string | null;
  item_index: number;
  is_checked: boolean;
  comment: string | null;
  item_category: string;
  item_text: string;
  created_at: string;
  updated_at: string;
}

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
  
  // Checklist items (Single Source of Truth - Evaluation Specific)
  checklistItems: Record<string, ChecklistItem>;
  checklistLoading: boolean;
  checklistError: string | null;
  
  // Auto-save status
  autoSaveStatus: AutoSaveStatus;
  
  // Actions for evaluations list
  fetchEvaluations: (userId: string) => Promise<void>;
  deleteEvaluation: (evaluationId: string) => Promise<void>;
  
  // Actions for current evaluation
  loadEvaluation: (evaluationId: string) => Promise<void>;
  createNewEvaluation: () => Promise<void>;
  updateField: (section: keyof EvaluationFormData, field: string, value: any) => void;
  saveCurrentEvaluation: () => Promise<void>;
  clearCurrentEvaluation: () => void;
  
  // Actions for checklist (Single Source of Truth - Evaluation Specific)
  loadChecklistItems: (userId: string, evaluationId?: string) => Promise<void>;
  updateChecklistItem: (itemId: string, isChecked: boolean, comment?: string) => Promise<void>;
  getChecklistProgress: () => { filled: number; total: number };
  initializeChecklistForEvaluation: (evaluationId: string) => Promise<void>;
  
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
    majorMaintenanceDone: null, // Changed from false to null - no pre-filled value
    ownsLand: null, // Changed from false to null - no pre-filled value
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
        
        // Checklist state (Single Source of Truth)
        checklistItems: {},
        checklistLoading: false,
        checklistError: null,
        
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

            // Load checklist items for this specific evaluation
            const store = get();
            store.loadChecklistItems(evaluationData.user_id, evaluationId);
          } catch (error) {
            console.error('Error loading evaluation:', error);
            set({
              currentEvaluationError: 'Kunde inte ladda utvärderingen',
              currentEvaluationLoading: false
            });
          }
        },

        createNewEvaluation: async () => {
          try {
            // Get current user from auth context
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Create a new evaluation with minimal data to get an ID
            const { data: newEvaluation, error } = await supabase
              .from('apartment_evaluations')
              .insert({
                user_id: user.id,
                address: '',
                is_draft: true
              })
              .select()
              .single();

            if (error) throw error;

            set({
              currentEvaluation: { ...defaultFormData },
              currentEvaluationId: newEvaluation.id,
              isDraft: true,
              hasUnsavedChanges: false,
              currentEvaluationError: null,
              // Clear checklist when creating new evaluation
              checklistItems: {}
            });
          } catch (error) {
            console.error('Error creating new evaluation:', error);
            // Fallback to local state only if database creation fails
            set({
              currentEvaluation: { ...defaultFormData },
              currentEvaluationId: `temp-${Date.now()}`, // Temporary ID for offline use
              isDraft: true,
              hasUnsavedChanges: false,
              currentEvaluationError: null,
              checklistItems: {}
            });
          }
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

        // Checklist actions (Single Source of Truth - Evaluation Specific)
        loadChecklistItems: async (userId: string, evaluationId?: string) => {
          set({ checklistLoading: true, checklistError: null });
          
          try {
            if (evaluationId) {
              // Load checklist from the evaluation's checklist field
              const { data: evaluation, error } = await supabase
                .from('apartment_evaluations')
                .select('checklist')
                .eq('id', evaluationId)
                .single();

              if (error) throw error;

              const checklist = Array.isArray(evaluation?.checklist) ? evaluation.checklist : [];
              const checklistItems: Record<string, ChecklistItem> = {};

              // Convert checklist items to the expected format
              (checklist as any[]).forEach((item: any) => {
                const itemId = `${item.category}-${item.index}`;
                checklistItems[itemId] = {
                  id: `${evaluationId}-${itemId}`,
                  user_id: userId,
                  evaluation_id: evaluationId,
                  item_index: item.index,
                  is_checked: item.checked || false,
                  comment: item.comment || null,
                  item_category: item.category === 0 ? 'Föreningen - Viktiga Frågor till Mäklaren & Styrelsen' : 'Lägenheten - Din Personliga Inspektion',
                  item_text: item.text || '',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
              });

              set({ 
                checklistItems,
                checklistLoading: false 
              });
            } else {
              // Clear checklist if no evaluation specified
              set({ 
                checklistItems: {},
                checklistLoading: false 
              });
            }
          } catch (error) {
            console.error('Error loading checklist items:', error);
            set({
              checklistError: 'Kunde inte ladda checklistdata',
              checklistLoading: false
            });
          }
        },

        updateChecklistItem: async (itemId: string, isChecked: boolean, comment?: string) => {
          const state = get();
          const [categoryIndex, itemIndex] = itemId.split('-').map(Number);
          
          if (!state.currentEvaluationId) {
            throw new Error('No current evaluation - checklist items must be linked to an evaluation');
          }

          try {
            // Get current user from auth context
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Get the current evaluation's checklist
            const { data: currentEval, error: fetchError } = await supabase
              .from('apartment_evaluations')
              .select('checklist')
              .eq('id', state.currentEvaluationId)
              .single();

            if (fetchError) throw fetchError;

            // Initialize checklist if it doesn't exist
            let checklist = currentEval?.checklist || [];
            
            // Ensure checklist is an array
            if (!Array.isArray(checklist)) {
              checklist = [];
            }

            // Find existing item or create new one
            const existingItemIndex = checklist.findIndex(
              (item: any) => item.category === categoryIndex && item.index === itemIndex
            );

            const checklistCategories = [
              'Föreningen - Viktiga Frågor till Mäklaren & Styrelsen',
              'Lägenheten - Din Personliga Inspektion'
            ];
            
            const checklistTexts = [
              // Category 0: Föreningen
              ['När gjordes stambyte senast? När är nästa planerat?', 'När byttes fönster/tak/fasad senast?', 'Finns några stora planerade renoveringar eller avgiftshöjningar?', 'Vad ingår i avgiften (värme, vatten, TV, bredband)?', 'Finns det några kända problem med skadedjur, fukt eller buller i fastigheten?', 'Hur är situationen med förråd, tvättstuga, cykelrum och parkering?', 'Vilka regler gäller för husdjur, uthyrning och renovering?', 'Har föreningen några ekonomiska utmaningar eller skulder?'],
              // Category 1: Lägenheten
              ['Kontrollera badrummet noggrant: Finns tecken på fukt/mögel? Hur ser golvbrunnen ut? Fråga efter kvalitetsdokument/våtrumsintyg.', 'Kontrollera köket: Testa alla vitvaror. Kolla trycket i vattenkranen.', 'Öppna och stäng fönster och dörrar. Är de i gott skick?', 'Lyssna efter störande ljud från grannar, trapphus eller utifrån.', 'Kontrollera elen: Finns jordade uttag i alla rum? Ser elcentralen modern ut?', 'Undersök golv, väggar och tak efter sprickor, fläckar eller skador.', 'Testa ventilationen i badrum och kök. Fungerar den korrekt?', 'Kontrollera värmesystemet: Radiatorernas skick och temperaturkontroll.']
            ];

            const itemText = checklistTexts[categoryIndex]?.[itemIndex] || '';
            const category = checklistCategories[categoryIndex];

            const checklistItem = {
              category: categoryIndex,
              index: itemIndex,
              text: itemText,
              checked: isChecked,
              comment: comment || null
            };

            if (existingItemIndex >= 0) {
              // Update existing item
              checklist[existingItemIndex] = checklistItem;
            } else {
              // Add new item
              checklist.push(checklistItem);
            }

            // Update the evaluation with the new checklist
            const { error: updateError } = await supabase
              .from('apartment_evaluations')
              .update({
                checklist: checklist,
                updated_at: new Date().toISOString()
              })
              .eq('id', state.currentEvaluationId);

            if (updateError) throw updateError;

            // Update local state to reflect the change
            set(state => ({
              checklistItems: {
                ...state.checklistItems,
                [itemId]: {
                  id: `${state.currentEvaluationId}-${itemId}`,
                  user_id: user.id,
                  evaluation_id: state.currentEvaluationId,
                  item_index: itemIndex,
                  is_checked: isChecked,
                  comment: comment || null,
                  item_category: category,
                  item_text: itemText,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              },
              hasUnsavedChanges: true
            }));

            console.log('Successfully updated checklist item in evaluation');
          } catch (error) {
            console.error('Error updating checklist item:', error);
            throw new Error('Kunde inte spara checklistobjekt');
          }
        },

        getChecklistProgress: () => {
          const state = get();
          if (!state.currentEvaluationId) return { filled: 0, total: 16 };
          
          // Calculate progress from local state which should match the database
          const items = Object.values(state.checklistItems);
          const totalItems = 16; // 8 + 8 items from pre-defined structure
          const checkedItems = items.filter(item => 
            item.evaluation_id === state.currentEvaluationId && item.is_checked
          ).length;
          
          return {
            filled: checkedItems,
            total: totalItems
          };
        },

        initializeChecklistForEvaluation: async (evaluationId: string) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Pre-defined checklist structure
            const checklistCategories = [
              'Föreningen - Viktiga Frågor till Mäklaren & Styrelsen',
              'Lägenheten - Din Personliga Inspektion'
            ];
            
            const checklistTexts = [
              // Category 0: Föreningen
              ['När gjordes stambyte senast? När är nästa planerat?', 'När byttes fönster/tak/fasad senast?', 'Finns några stora planerade renoveringar eller avgiftshöjningar?', 'Vad ingår i avgiften (värme, vatten, TV, bredband)?', 'Finns det några kända problem med skadedjur, fukt eller buller i fastigheten?', 'Hur är situationen med förråd, tvättstuga, cykelrum och parkering?', 'Vilka regler gäller för husdjur, uthyrning och renovering?', 'Har föreningen några ekonomiska utmaningar eller skulder?'],
              // Category 1: Lägenheten
              ['Kontrollera badrummet noggrant: Finns tecken på fukt/mögel? Hur ser golvbrunnen ut? Fråga efter kvalitetsdokument/våtrumsintyg.', 'Kontrollera köket: Testa alla vitvaror. Kolla trycket i vattenkranen.', 'Öppna och stäng fönster och dörrar. Är de i gott skick?', 'Lyssna efter störande ljud från grannar, trapphus eller utifrån.', 'Kontrollera elen: Finns jordade uttag i alla rum? Ser elcentralen modern ut?', 'Undersök golv, väggar och tak efter sprickor, fläckar eller skador.', 'Testa ventilationen i badrum och kök. Fungerar den korrekt?', 'Kontrollera värmesystemet: Radiatorernas skick och temperaturkontroll.']
            ];

            // Check if checklist already exists for this evaluation
            const { data: existingItems, error: checkError } = await supabase
              .from('checklist_items')
              .select('id')
              .eq('user_id', user.id)
              .eq('evaluation_id', evaluationId);

            if (checkError) throw checkError;

            // If checklist already exists, don't create duplicates
            if (existingItems && existingItems.length > 0) {
              console.log('Checklist already exists for evaluation:', evaluationId);
              return;
            }

            // Create all checklist items for this evaluation
            const itemsToCreate = [];
            checklistCategories.forEach((category, categoryIndex) => {
              checklistTexts[categoryIndex].forEach((text, itemIndex) => {
                itemsToCreate.push({
                  user_id: user.id,
                  evaluation_id: evaluationId,
                  item_index: itemIndex,
                  is_checked: false,
                  comment: null,
                  item_category: category,
                  item_text: text
                });
              });
            });

            const { error } = await supabase
              .from('checklist_items')
              .insert(itemsToCreate);

            if (error) throw error;

            console.log(`Initialized ${itemsToCreate.length} checklist items for evaluation:`, evaluationId);
          } catch (error) {
            console.error('Error initializing checklist for evaluation:', error);
            throw new Error('Kunde inte initiera checklista för utvärdering');
          }
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