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

  const handleSort = (field: keyof Evaluation | 'physicalAverage') => {
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

  const getSortIcon = (field: keyof Evaluation | 'physicalAverage') => {
    if ((sortConfig.field as string) !== field || !sortConfig.direction) return null;
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="w-48 cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort('address')}
            >
              <div className="flex items-center">
                Kriterium
                {getSortIcon('address')}
              </div>
            </TableHead>
            {sortedEvaluations.map((evaluation, index) => (
              <TableHead key={evaluation.id} className="text-center">
                <div>
                  <div className="font-semibold">Lägenhet {index + 1}</div>
                  <div className="text-xs text-gray-500 font-normal">
                    {evaluation.address || 'Ingen adress'}
                  </div>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field) => (
            <TableRow key={field.key}>
              <TableCell 
                className="font-medium cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort(field.key)}
              >
                <div className="flex items-center">
                  {field.label}
                  {getSortIcon(field.key)}
                </div>
              </TableCell>
              {sortedEvaluations.map((evaluation) => (
                <TableCell key={`${evaluation.id}-${field.key}`} className="text-center">
                  {formatValue(evaluation[field.key], field.type)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {/* Physical Average Row */}
          <TableRow className="bg-yellow-50">
            <TableCell 
              className="font-medium cursor-pointer hover:bg-yellow-100 select-none"
              onClick={() => handleSort('physicalAverage')}
            >
              <div className="flex items-center">
                Genomsnittligt fysiskt betyg
                {getSortIcon('physicalAverage')}
              </div>
            </TableCell>
            {sortedEvaluations.map((evaluation) => (
              <TableCell key={`${evaluation.id}-avg`} className="text-center">
                {formatValue(calculatePhysicalAverage(evaluation), 'rating')}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default InteractiveComparisonTable;