import React, { createContext, useContext, useState, ReactNode } from 'react';

interface EvaluationData {
  address?: string;
  general?: {
    size?: string;
    rooms?: string;
    price?: string;
    finalPrice?: string;
    monthlyFee?: string;
  };
  financial?: {
    [key: string]: any;
  };
  physical?: {
    [key: string]: any;
  };
}

interface EvaluationContextType {
  data: EvaluationData;
  updateAddress: (address: string) => void;
  updateGeneralData: (data: any) => void;
  updateFinancialData: (data: any) => void;
  updatePhysicalData: (data: any) => void;
  getCompletionStatus: (section: 'general' | 'financial' | 'physical') => 'not-started' | 'in-progress' | 'completed';
  loadEvaluation: (evaluationData: any) => void;
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

export const EvaluationProvider = ({ children }: { children: ReactNode }) => {
  console.log('EvaluationProvider rendering');
  const [data, setData] = useState<EvaluationData>({});

  const updateAddress = (address: string) => {
    setData(prev => ({ ...prev, address }));
  };

  const updateGeneralData = (newData: any) => {
    setData(prev => ({ 
      ...prev, 
      general: { ...prev.general, ...newData }
    }));
  };

  const updateFinancialData = (newData: any) => {
    setData(prev => ({ 
      ...prev, 
      financial: { ...prev.financial, ...newData }
    }));
  };

  const updatePhysicalData = (newData: any) => {
    setData(prev => ({ 
      ...prev, 
      physical: { ...prev.physical, ...newData }
    }));
  };

  const getCompletionStatus = (section: 'general' | 'financial' | 'physical'): 'not-started' | 'in-progress' | 'completed' => {
    const sectionData = data[section];
    
    if (!sectionData || Object.keys(sectionData).length === 0) {
      return 'not-started';
    }

    const requiredFields = {
      general: ['size', 'rooms', 'price', 'monthlyFee'],
      financial: ['debtPerSqm', 'feePerSqm', 'cashflowPerSqm', 'majorMaintenanceDone', 'ownsLand'],
      physical: ['planlösning', 'kitchen', 'bathroom', 'bedrooms', 'surfaces', 'förvaring', 'ljusinsläpp', 'balcony']
    };

    const required = requiredFields[section];
    const filledFields = required.filter(field => {
      const value = sectionData[field];
      if (section === 'physical') {
        // For physical section, check if rating is > 0
        return value && value > 0;
      } else if (section === 'financial' && (field === 'majorMaintenanceDone' || field === 'ownsLand')) {
        // For boolean fields, check if they are explicitly set
        return value !== undefined && value !== null;
      } else {
        // For text fields, check if they have content
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

  // Function to load existing evaluation data
  const loadEvaluation = (evaluationData: any) => {
    const normalizeNumber = (v: any): number | null => {
      if (v === null || v === undefined || v === '') return null;
      if (typeof v === 'number') return v;
      const parsed = parseFloat(v.toString().replace(/\s/g, '').replace(',', '.'));
      return isNaN(parsed) ? null : parsed;
    };

    const normalizePrice = (p: any): number | null => {
      const n = normalizeNumber(p);
      if (n === null) return null;
      // If stored accidentally as "millions" (e.g., 6 instead of 6,000,000), upscale
      return n > 0 && n < 100000 ? n * 1_000_000 : n;
    };

    setData({
      address: evaluationData.address || '',
      general: {
        size: normalizeNumber(evaluationData.size)?.toString() || '',
        rooms: evaluationData.rooms || '',
        price: normalizePrice(evaluationData.price)?.toString() || '',
        finalPrice: normalizePrice(evaluationData.final_price)?.toString() || '',
        monthlyFee: normalizeNumber(evaluationData.monthly_fee)?.toString() || ''
      },
      financial: {
        debtPerSqm: normalizeNumber(evaluationData.debt_per_sqm)?.toString() || '',
        feePerSqm: normalizeNumber(evaluationData.fee_per_sqm)?.toString() || '',
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
  };

  // Function to clear evaluation data
  const clearEvaluation = () => {
    setData({
      address: '',
      general: { size: '', rooms: '', price: '', finalPrice: '', monthlyFee: '' },
      financial: { debtPerSqm: '', feePerSqm: '', cashflowPerSqm: '', majorMaintenanceDone: false, ownsLand: false, underhållsplan: '' },
      physical: { 
        planlösning: 0, kitchen: 0, bathroom: 0, bedrooms: 0, surfaces: 0, förvaring: 0, ljusinsläpp: 0, balcony: 0,
        planlösning_comment: '', kitchen_comment: '', bathroom_comment: '', bedrooms_comment: '', 
        surfaces_comment: '', förvaring_comment: '', ljusinsläpp_comment: '', balcony_comment: '', comments: ''
      }
    });
  };

  return (
    <EvaluationContext.Provider value={{
      data,
      updateAddress,
      updateGeneralData,
      updateFinancialData,
      updatePhysicalData,
      getCompletionStatus,
      loadEvaluation,
      clearEvaluation
    }}>
      {children}
    </EvaluationContext.Provider>
  );
};