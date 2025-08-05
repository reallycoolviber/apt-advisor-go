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
      financial: [], // Define required fields for financial section
      physical: []   // Define required fields for physical section
    };

    const required = requiredFields[section];
    const filledFields = required.filter(field => {
      const value = sectionData[field];
      return value && value.toString().trim() !== '';
    });

    if (filledFields.length === 0) {
      return 'not-started';
    } else if (filledFields.length === required.length) {
      return 'completed';
    } else {
      return 'in-progress';
    }
  };

  return (
    <EvaluationContext.Provider value={{
      data,
      updateAddress,
      updateGeneralData,
      updateFinancialData,
      updatePhysicalData,
      getCompletionStatus
    }}>
      {children}
    </EvaluationContext.Provider>
  );
};