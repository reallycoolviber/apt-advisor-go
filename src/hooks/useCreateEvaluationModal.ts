import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvaluation } from '@/contexts/EvaluationContext';

/**
 * Centralized hook for managing the CreateEvaluationModal state and logic
 * This ensures consistent behavior across all components that need to create evaluations
 */
export const useCreateEvaluationModal = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { updateAddress } = useEvaluation();
  const navigate = useNavigate();

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleCreateEvaluation = async (address: string) => {
    // Update address first, then save to ensure it's persisted
    updateAddress(address);
    setShowCreateModal(false);
    
    // Navigate to hub - the EvaluationHub will create a new evaluation if none exists
    // and the address will be set
    navigate('/hub');
  };

  return {
    showCreateModal,
    openCreateModal,
    closeCreateModal,
    handleCreateEvaluation
  };
};