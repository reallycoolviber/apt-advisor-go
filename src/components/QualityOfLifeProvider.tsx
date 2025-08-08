import React from 'react';
import { useGlobalQualityOfLife } from '@/hooks/useGlobalQualityOfLife';

interface QualityOfLifeProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that applies all Quality of Life improvements globally
 * 
 * Features included:
 * 1. Scroll to top on route changes
 * 2. Auto-close toasts after 4 seconds
 * 3. Enhanced button feedback with loading states
 * 4. Skeleton loading screens
 * 5. User-friendly error handling
 * 6. Mobile touch improvements
 */
export function QualityOfLifeProvider({ children }: QualityOfLifeProviderProps) {
  useGlobalQualityOfLife();
  
  return <>{children}</>;
}