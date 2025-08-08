import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave, AutoSaveStatus } from '@/hooks/useAutoSave';
import { 
  saveEvaluation, 
  getEvaluationById, 
  finalizeEvaluation, 
  generateSourceId, 
  getOrCreateEvaluation,
  EvaluationData 
} from '@/services/evaluationService';

export interface EvaluationFormData {
  address: string;
  general: {
    size: string;
    rooms: string;
    price: string;
    finalPrice: string;
    monthlyFee: string;
  };
  financial: {
    debtPerSqm: string;
    cashflowPerSqm: string;
    majorMaintenanceDone: boolean;
    ownsLand: boolean;
    underhållsplan: string;
  };
  physical: {
    planlösning: number;
    kitchen: number;
    bathroom: number;
    bedrooms: number;
    surfaces: number;
    förvaring: number;
    ljusinsläpp: number;
    balcony: number;
    planlösning_comment: string;
    kitchen_comment: string;
    bathroom_comment: string;
    bedrooms_comment: string;
    surfaces_comment: string;
    förvaring_comment: string;
    ljusinsläpp_comment: string;
    balcony_comment: string;
    comments: string;
  };
}

interface EvaluationContextType {
  data: EvaluationFormData;
  setData: (data: EvaluationFormData) => void;
  updateField: (section: keyof EvaluationFormData, field: string, value: any) => void;
  evaluationId: string | null;
  setEvaluationId: (id: string | null) => void;
  isDraft: boolean;
  save: () => Promise<void>;
  finalize: () => Promise<void>;
  loadEvaluation: (id: string) => Promise<void>;
  getOrCreateBySource: (sourceId: string, initialData?: Partial<EvaluationFormData>) => Promise<string>;
  isLoading: boolean;
  autoSaveStatus: AutoSaveStatus;
  generateId: (apartmentUrl?: string, address?: string) => string;
  // Legacy methods for backward compatibility
  updateAddress: (address: string) => void;
  updateGeneralData: (data: any) => void;
  updateFinancialData: (data: any) => void;
  updatePhysicalData: (data: any) => void;
  getCompletionStatus: (section: 'general' | 'financial' | 'physical') => 'not-started' | 'in-progress' | 'completed';
  clearEvaluation: () => void;
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within an EvaluationProvider');
  }
  return context;
};

// Default data structure
const defaultData: EvaluationFormData = {
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

export const EvaluationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('EvaluationProvider rendering');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setInternalData] = useState<EvaluationFormData>(defaultData);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [sourceId, setSourceId] = useState<string | null>(null);

  // Konvertering mellan form data och database format
  const formDataToEvaluationData = useCallback((formData: EvaluationFormData): Partial<EvaluationData> => {
    const parseFormattedNumber = (value: string): number | undefined => {
      if (!value || value.trim() === '') return undefined;
      // Remove spaces and handle comma as decimal separator
      const cleanValue = value.replace(/\s+/g, '').replace(',', '.');
      const num = parseFloat(cleanValue);
      return isNaN(num) ? undefined : num;
    };
    
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
      source_id: sourceId || undefined
    };
  }, [sourceId]);

  // Helper function to check if form has any meaningful data
  const hasAnyFormData = (formData: EvaluationFormData): boolean => {
    // Check general data
    if (formData.general.size || formData.general.rooms || formData.general.price || 
        formData.general.finalPrice || formData.general.monthlyFee) {
      return true;
    }
    
    // Check financial data
    if (formData.financial.debtPerSqm || formData.financial.cashflowPerSqm || 
        formData.financial.underhållsplan || 
        formData.financial.majorMaintenanceDone !== false || 
        formData.financial.ownsLand !== false) {
      return true;
    }
    
    // Check physical data
    if (formData.physical.planlösning > 0 || formData.physical.kitchen > 0 || 
        formData.physical.bathroom > 0 || formData.physical.bedrooms > 0 ||
        formData.physical.surfaces > 0 || formData.physical.förvaring > 0 ||
        formData.physical.ljusinsläpp > 0 || formData.physical.balcony > 0 ||
        formData.physical.comments) {
      return true;
    }
    
    return false;
  };

  // Auto-save setup
  const { triggerSave, forceSave, status: autoSaveStatus } = useAutoSave(
    data,
    async (formData: EvaluationFormData) => {
      // If no evaluation ID and we have data to save, create a new evaluation first
      if (!evaluationId && (formData.address || hasAnyFormData(formData))) {
        console.log('Creating new evaluation for auto-save');
        try {
          const sourceId = generateSourceId(undefined, formData.address || 'manual-entry');
          const newEvaluationId = await getOrCreateBySource(sourceId, formData);
          console.log('Created evaluation with ID:', newEvaluationId);
          return; // Exit here since getOrCreateBySource will trigger another save
        } catch (error) {
          console.error('Failed to create evaluation for auto-save:', error);
          return;
        }
      }
      
      if (!evaluationId) {
        console.log('No evaluation ID and no data to save, skipping auto-save');
        return;
      }
      
      const evaluationData = formDataToEvaluationData(formData);
      await saveEvaluation(evaluationId, evaluationData);
      console.log('Auto-saved evaluation', evaluationId);
    },
    {
      delay: 1500, // 1.5 sekunder debounce
      onSaveSuccess: () => {
        console.log('Auto-save successful');
      },
      onSaveError: (error) => {
        console.error('Auto-save error:', error);
      }
    }
  );

  const normalizeNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    
    const stringValue = typeof value === 'string' ? value : String(value);
    
    // Ta bort mellanslag och ersätt komma med punkt
    const cleanValue = stringValue.replace(/\s+/g, '').replace(',', '.');
    const num = parseFloat(cleanValue);
    
    if (isNaN(num)) return null;
    
    return num;
  };

  const normalizePrice = (v: any): number | null => {
    const n = normalizeNumber(v);
    if (n === null) return null;
    // Normalisera priser: if number is very small (probably in millions), multiply by 1M
    return n > 0 && n < 100000 ? n * 1_000_000 : n;
  };

  const normalizeDebtPerSqm = (v: any): number | null => {
    const n = normalizeNumber(v);
    if (n === null) return null;
    // Debt per sqm sometimes stored in tkr/kvm; upscale small values
    return n > 0 && n < 1000 ? n * 1000 : n;
  };

  const setData = useCallback((newData: EvaluationFormData) => {
    console.log('Setting data:', newData);
    setInternalData(newData);
  }, []);

  const loadEvaluation = useCallback(async (id: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const evaluationData = await getEvaluationById(id);
      
      if (!evaluationData) {
        toast({
          title: "Fel",
          description: "Utvärderingen kunde inte hittas",
          variant: "destructive",
        });
        return;
      }

      setSourceId(evaluationData.source_id || null);
      setIsDraft(evaluationData.is_draft ?? true);

      setData({
        address: evaluationData.address || '',
        general: {
          size: evaluationData.size?.toString() || '',
          rooms: evaluationData.rooms || '',
          price: normalizePrice(evaluationData.price)?.toString() || '',
          finalPrice: evaluationData.final_price?.toString() || '',
          monthlyFee: normalizeNumber(evaluationData.monthly_fee)?.toString() || ''
        },
        financial: {
          debtPerSqm: normalizeDebtPerSqm(evaluationData.debt_per_sqm)?.toString() || '',
          cashflowPerSqm: normalizeNumber(evaluationData.cashflow_per_sqm)?.toString() || '',
          majorMaintenanceDone: evaluationData.major_maintenance_done || false,
          ownsLand: evaluationData.owns_land || false,
          underhållsplan: evaluationData.underhållsplan || ''
        },
        physical: {
          planlösning: evaluationData.planlösning || 0,
          kitchen: evaluationData.kitchen || 0,
          bathroom: evaluationData.bathroom || 0,
          bedrooms: evaluationData.bedrooms || 0,
          surfaces: evaluationData.surfaces || 0,
          förvaring: evaluationData.förvaring || 0,
          ljusinsläpp: evaluationData.ljusinsläpp || 0,
          balcony: evaluationData.balcony || 0,
          planlösning_comment: evaluationData.planlösning_comment || '',
          kitchen_comment: evaluationData.kitchen_comment || '',
          bathroom_comment: evaluationData.bathroom_comment || '',
          bedrooms_comment: evaluationData.bedrooms_comment || '',
          surfaces_comment: evaluationData.surfaces_comment || '',
          förvaring_comment: evaluationData.förvaring_comment || '',
          ljusinsläpp_comment: evaluationData.ljusinsläpp_comment || '',
          balcony_comment: evaluationData.balcony_comment || '',
          comments: evaluationData.comments || ''
        }
      });

      setEvaluationId(id);
      setHasInitialized(true);
    } catch (error) {
      console.error('Error loading evaluation:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda utvärderingen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, setData]);

  const save = useCallback(async () => {
    if (!evaluationId) {
      throw new Error('No evaluation ID available');
    }

    const evaluationData = formDataToEvaluationData(data);
    await saveEvaluation(evaluationId, evaluationData);
    
    toast({
      title: "Sparat",
      description: "Utvärderingen har sparats",
    });
  }, [evaluationId, data, formDataToEvaluationData, toast]);

  const finalize = useCallback(async () => {
    if (!evaluationId) {
      throw new Error('No evaluation ID available');
    }

    // Spara senaste ändringar först
    await save();
    
    // Slutför utvärderingen
    await finalizeEvaluation(evaluationId);
    setIsDraft(false);
    
    toast({
      title: "Slutfört",
      description: "Utvärderingen har slutförts",
    });
  }, [evaluationId, save, toast]);

  const getOrCreateBySource = useCallback(async (
    sourceIdParam: string, 
    initialData?: Partial<EvaluationFormData>
  ): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Convert partial form data to full form data with defaults
    const fullInitialData: EvaluationFormData = {
      ...defaultData,
      ...initialData
    };
    
    const convertedInitialData = formDataToEvaluationData(fullInitialData);
    const result = await getOrCreateEvaluation(sourceIdParam, convertedInitialData);
    
    setSourceId(sourceIdParam);
    
    if (result.created) {
      toast({
        title: "Ny utvärdering",
        description: "En ny utvärdering har skapats",
      });
    } else {
      toast({
        title: "Befintlig utvärdering",
        description: "Laddar befintlig utvärdering för denna lägenhet",
      });
    }

    await loadEvaluation(result.data.id!);
    return result.data.id!;
  }, [user, formDataToEvaluationData, loadEvaluation, toast]);

  const updateField = useCallback((
    section: keyof EvaluationFormData, 
    field: string, 
    value: any
  ) => {
    setInternalData(prev => {
      if (section === 'address') {
        // Special case for address field
        const newData = {
          ...prev,
          address: value
        };
        setTimeout(() => triggerSave(), 0);
        return newData;
      }
      
      const newData = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
      
      // Trigger auto-save efter state update
      setTimeout(() => triggerSave(), 0);
      
      return newData;
    });
  }, [triggerSave]);

  // Legacy methods for backward compatibility
  const updateAddress = useCallback((address: string) => {
    updateField('address' as keyof EvaluationFormData, '', address);
  }, [updateField]);

  const updateGeneralData = useCallback((newData: any) => {
    Object.keys(newData).forEach(key => {
      updateField('general', key, newData[key]);
    });
  }, [updateField]);

  const updateFinancialData = useCallback((newData: any) => {
    Object.keys(newData).forEach(key => {
      updateField('financial', key, newData[key]);
    });
  }, [updateField]);

  const updatePhysicalData = useCallback((newData: any) => {
    Object.keys(newData).forEach(key => {
      updateField('physical', key, newData[key]);
    });
  }, [updateField]);

  const getCompletionStatus = useCallback((section: 'general' | 'financial' | 'physical'): 'not-started' | 'in-progress' | 'completed' => {
    const sectionData = data[section];
    
    if (!sectionData || Object.keys(sectionData).length === 0) {
      return 'not-started';
    }

    const requiredFields = {
      general: ['size', 'rooms', 'price', 'monthlyFee'],
      financial: ['debtPerSqm', 'cashflowPerSqm', 'majorMaintenanceDone', 'ownsLand'],
      physical: ['planlösning', 'kitchen', 'bathroom', 'bedrooms', 'surfaces', 'förvaring', 'ljusinsläpp', 'balcony']
    };

    const required = requiredFields[section];
    const filledFields = required.filter(field => {
      const value = (sectionData as any)[field];
      if (section === 'physical') {
        return value && value > 0;
      } else if (section === 'financial' && (field === 'majorMaintenanceDone' || field === 'ownsLand')) {
        return value !== undefined && value !== null;
      } else {
        return value && value.toString().trim() !== '';
      }
    });

    if (filledFields.length === 0) {
      return 'not-started';
    } else if (filledFields.length === required.length) {
      return 'completed';
    } else {
      return 'in-progress';
    }
  }, [data]);

  const clearEvaluation = useCallback(() => {
    setData(defaultData);
    setEvaluationId(null);
    setSourceId(null);
    setIsDraft(true);
    setHasInitialized(false);
  }, [setData]);

  // Force save on unmount (when navigating away)
  useEffect(() => {
    return () => {
      if (evaluationId) {
        forceSave();
      }
    };
  }, [evaluationId, forceSave]);

  const value: EvaluationContextType = {
    data,
    setData,
    updateField,
    evaluationId,
    setEvaluationId,
    isDraft,
    save,
    finalize,
    loadEvaluation,
    getOrCreateBySource,
    isLoading,
    autoSaveStatus,
    generateId: generateSourceId,
    // Legacy methods
    updateAddress,
    updateGeneralData,
    updateFinancialData,
    updatePhysicalData,
    getCompletionStatus,
    clearEvaluation
  };

  console.log('EvaluationProvider: Current data:', data);
  console.log('EvaluationProvider: User:', user);

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
};