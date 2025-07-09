import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Evaluation, ComparisonField, SortConfig, SortDirection } from './types';

interface InteractiveComparisonTableProps {
  evaluations: Evaluation[];
  fields: ComparisonField[];
  calculatePhysicalAverage: (evaluation: Evaluation) => number;
  formatValue: (value: any, type: ComparisonField['type']) => React.ReactNode;
}

const InteractiveComparisonTable: React.FC<InteractiveComparisonTableProps> = ({
  evaluations,
  fields,
  calculatePhysicalAverage,
  formatValue
}) => {
  console.log('InteractiveComparisonTable rendering...');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'address', direction: null });

  const sortedEvaluations = useMemo(() => {
    if (!sortConfig.direction) return evaluations;

    return [...evaluations].sort((a, b) => {
      const aValue = (sortConfig.field as string) === 'physicalAverage' 
        ? calculatePhysicalAverage(a) 
        : a[sortConfig.field];
      const bValue = (sortConfig.field as string) === 'physicalAverage' 
        ? calculatePhysicalAverage(b) 
        : b[sortConfig.field];

      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue === null) return sortConfig.direction === 'asc' ? -1 : 1;

      // Sort based on type
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [evaluations, sortConfig, calculatePhysicalAverage]);

  const handleSort = (field: string) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfig.field === field) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }

    setSortConfig({ field: field as keyof Evaluation, direction });
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field || !sortConfig.direction) return null;
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="overflow-x-auto border border-border rounded-lg bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/70">
            <TableHead className="min-w-48 font-semibold text-left sticky left-0 bg-muted/50 border-r border-border">
              <div className="flex items-center gap-2">
                <span>Lägenhet</span>
              </div>
            </TableHead>
            {fields.map((field) => (
              <TableHead 
                key={field.key}
                className="text-center cursor-pointer hover:bg-muted/70 select-none min-w-32 transition-colors duration-150 whitespace-nowrap"
                onClick={() => handleSort(field.key)}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="truncate">{field.label}</span>
                  {getSortIcon(field.key)}
                </div>
              </TableHead>
            ))}
            <TableHead 
              className="text-center cursor-pointer hover:bg-yellow-100 select-none bg-yellow-50/80 min-w-44 transition-colors duration-150 whitespace-nowrap"
              onClick={() => handleSort('physicalAverage')}
            >
              <div className="flex items-center justify-center gap-1">
                <span className="truncate">Genomsnittligt fysiskt betyg</span>
                {getSortIcon('physicalAverage')}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEvaluations.map((evaluation, index) => (
            <TableRow 
              key={evaluation.id} 
              className={`transition-colors duration-150 hover:bg-muted/30 ${
                index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
              }`}
            >
              <TableCell className="font-medium sticky left-0 bg-inherit border-r border-border">
                <div className="min-w-0">
                  <div className="font-semibold text-primary truncate">
                    Lägenhet {index + 1}
                  </div>
                  <div className="text-sm text-muted-foreground truncate" title={evaluation.address || 'Ingen adress'}>
                    {evaluation.address || 'Ingen adress'}
                  </div>
                </div>
              </TableCell>
               {fields.map((field) => (
                 <TableCell 
                   key={`${evaluation.id}-${field.key}`} 
                   className={`text-center whitespace-nowrap ${
                     field.type === 'currency' || field.type === 'number' ? 'text-right' : 'text-center'
                   }`}
                 >
                   <div className="truncate overflow-hidden text-ellipsis max-w-32" title={String(evaluation[field.key] || 'Ej angivet')}>
                     {formatValue(evaluation[field.key], field.type)}
                   </div>
                 </TableCell>
               ))}
              <TableCell className="text-center bg-yellow-50/80 whitespace-nowrap">
                <div className="flex items-center justify-center">
                  {formatValue(calculatePhysicalAverage(evaluation), 'rating')}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default InteractiveComparisonTable;