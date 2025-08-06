import React from 'react';
import { cn } from '@/lib/utils';

interface NavigationToggleProps {
  activeTab: 'input' | 'evaluation' | 'comparison';
  onTabChange: (tab: 'input' | 'evaluation' | 'comparison') => void;
}

const EvaluationNavigationToggle: React.FC<NavigationToggleProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs = [
    { id: 'input' as const, label: 'Input' },
    { id: 'evaluation' as const, label: 'Utvärdering' },
    { id: 'comparison' as const, label: 'Jämförelse' }
  ];

  return (
    <div className="w-full bg-background border rounded-lg overflow-hidden mb-6">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted hover:bg-muted/80 text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EvaluationNavigationToggle;