import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import InteractiveComparisonTable from './InteractiveComparisonTable';
import { Evaluation, ComparisonField } from './types';

interface ComparisonCategoryCardProps {
  title: string;
  evaluations: Evaluation[];
  fields: ComparisonField[];
  calculatePhysicalAverage: (evaluation: Evaluation) => number;
  formatValue: (value: any, field: ComparisonField) => React.ReactNode;
  defaultExpanded?: boolean;
}

export const ComparisonCategoryCard: React.FC<ComparisonCategoryCardProps> = ({
  title,
  evaluations,
  fields,
  calculatePhysicalAverage,
  formatValue,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className="bg-card border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-muted"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <InteractiveComparisonTable
            evaluations={evaluations}
            fields={fields}
            calculatePhysicalAverage={calculatePhysicalAverage}
            formatValue={formatValue}
          />
        </CardContent>
      )}
    </Card>
  );
};