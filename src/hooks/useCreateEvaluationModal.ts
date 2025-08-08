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

  const handleCreateEvaluation = (address: string) => {
    updateAddress(address);
    setShowCreateModal(false);
    navigate('/evaluate');
  };

  return {
    showCreateModal,
    openCreateModal,
    closeCreateModal,
    handleCreateEvaluation
  };
};