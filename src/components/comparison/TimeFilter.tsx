import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';
import { TimeFilter, TimeFilterConfig } from './types';

interface TimeFilterProps {
  timeFilter: TimeFilterConfig;
  onTimeFilterChange: (filter: TimeFilterConfig) => void;
}

const TimeFilterComponent: React.FC<TimeFilterProps> = ({ timeFilter, onTimeFilterChange }) => {
  const timeOptions = [
    { value: 'all' as TimeFilter, label: 'Alla utvärderingar' },
    { value: 'week' as TimeFilter, label: 'Senaste veckan' },
    { value: 'month' as TimeFilter, label: 'Senaste månaden' },
    { value: '3months' as TimeFilter, label: 'Senaste 3 månaderna' },
    { value: 'year' as TimeFilter, label: 'Senaste året' },
  ];

  return (
    <Card className="bg-white shadow-lg border-0 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-blue-900" />
        <h3 className="text-lg font-semibold text-blue-900">Filtrera utvärderingar</h3>
      </div>
      <p className="text-gray-600 mb-4">
        Välj vilka utvärderingar som ska vara tillgängliga för jämförelse baserat på när de skapades.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {timeOptions.map((option) => (
          <Button
            key={option.value}
            variant={timeFilter.type === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onTimeFilterChange({ type: option.value })}
            className={`text-sm ${
              timeFilter.type === option.value 
                ? 'bg-blue-900 hover:bg-blue-800 text-white' 
                : 'border-blue-200 text-blue-900 hover:bg-blue-50'
            }`}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default TimeFilterComponent;