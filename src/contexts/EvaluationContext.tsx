import React, { createContext, useContext } from 'react';
import { useEvaluationStore } from '@/stores/evaluationStore';
import { EvaluationFormData, AutoSaveStatus } from '@/types/evaluation';
import { generateSourceId } from '@/services/evaluationService';

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

// Default data structure for compatibility
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
  
  // Use the central store
  const {
    currentEvaluation,
    currentEvaluationId,
    currentEvaluationLoading,
    isDraft,
    autoSaveStatus,
    loadEvaluation: storeLoadEvaluation,
    updateField: storeUpdateField,
    saveCurrentEvaluation,
    clearCurrentEvaluation,
    createNewEvaluation
  } = useEvaluationStore();

  // Provide current data or default
  const data = currentEvaluation || defaultData;

  console.log('EvaluationProvider: Current data:', data);

  const setData = (newData: EvaluationFormData) => {
    // For compatibility, replace entire form data
    clearCurrentEvaluation();
    createNewEvaluation();
    // Update each section
    Object.entries(newData.general).forEach(([key, value]) => {
      storeUpdateField('general', key, value);
    });
    Object.entries(newData.financial).forEach(([key, value]) => {
      storeUpdateField('financial', key, value);
    });
    Object.entries(newData.physical).forEach(([key, value]) => {
      storeUpdateField('physical', key, value);
    });
    if (newData.address) {
      storeUpdateField('address' as any, '', newData.address);
    }
  };

  const updateField = (
    section: keyof EvaluationFormData, 
    field: string, 
    value: any
  ) => {
    storeUpdateField(section, field, value);
  };

  const save = async () => {
    await saveCurrentEvaluation();
  };

  const finalize = async () => {
    // Save first, then mark as non-draft
    await saveCurrentEvaluation();
    // TODO: Add finalize logic to store if needed
  };

  const loadEvaluation = async (id: string) => {
    await storeLoadEvaluation(id);
  };

  const getOrCreateBySource = async (
    sourceId: string, 
    initialData?: Partial<EvaluationFormData>
  ): Promise<string> => {
    // This is a complex operation that should be handled by the store
    // For now, create new evaluation and return a mock ID
    createNewEvaluation();
    if (initialData) {
      Object.entries(initialData).forEach(([section, sectionData]) => {
        if (section === 'address') {
          storeUpdateField('address' as any, '', sectionData);
        } else if (typeof sectionData === 'object' && sectionData) {
          Object.entries(sectionData).forEach(([field, value]) => {
            storeUpdateField(section as keyof EvaluationFormData, field, value);
          });
        }
      });
    }
    await saveCurrentEvaluation();
    return currentEvaluationId || 'new-evaluation';
  };

  // Legacy methods for backward compatibility
  const updateAddress = (address: string) => {
    updateField('address' as keyof EvaluationFormData, '', address);
  };

  const updateGeneralData = (newData: any) => {
    Object.keys(newData).forEach(key => {
      updateField('general', key, newData[key]);
    });
  };

  const updateFinancialData = (newData: any) => {
    Object.keys(newData).forEach(key => {
      updateField('financial', key, newData[key]);
    });
  };

  const updatePhysicalData = (newData: any) => {
    Object.keys(newData).forEach(key => {
      updateField('physical', key, newData[key]);
    });
  };

  const getCompletionStatus = (section: 'general' | 'financial' | 'physical'): 'not-started' | 'in-progress' | 'completed' => {
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
  };

  const clearEvaluation = () => {
    clearCurrentEvaluation();
  };

  const setEvaluationId = (id: string | null) => {
    // This is handled by the store when loading evaluations
    if (id) {
      loadEvaluation(id);
    } else {
      clearCurrentEvaluation();
    }
  };

  const value: EvaluationContextType = {
    data,
    setData,
    updateField,
    evaluationId: currentEvaluationId,
    setEvaluationId,
    isDraft,
    save,
    finalize,
    loadEvaluation,
    getOrCreateBySource,
    isLoading: currentEvaluationLoading,
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

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
};