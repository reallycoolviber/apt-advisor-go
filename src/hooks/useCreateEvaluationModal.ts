import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvaluationStore } from '@/stores/evaluationStore';

/**
 * Centralized hook for managing the CreateEvaluationModal state and logic
 * This ensures consistent behavior across all components that need to create evaluations
 */
export const useCreateEvaluationModal = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { createNewEvaluation, updateField } = useEvaluationStore();
  const navigate = useNavigate();

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleCreateEvaluation = async (address: string) => {
    // Validera adress
    if (!address || address.trim() === '') {
      throw new Error('Adress krävs för att skapa utvärdering');
    }
    
    // Skapa ny utvärdering med adress
    await createNewEvaluation(address);
    
    setShowCreateModal(false);
    
    // Navigate to hub
    navigate('/hub');
  };

  return {
    showCreateModal,
    openCreateModal,
    closeCreateModal,
    handleCreateEvaluation
  };
};