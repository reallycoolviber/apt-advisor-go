
import { useState } from 'react';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  max?: number;
}

export const RatingInput = ({ value, onChange, max = 5 }: RatingInputProps) => {
  const [hover, setHover] = useState(0);

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return 'text-red-500';
    if (rating <= 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Mycket dåligt';
      case 2: return 'Dåligt';
      case 3: return 'Okej';
      case 4: return 'Bra';
      case 5: return 'Utmärkt';
      default: return '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[...Array(max)].map((_, index) => {
          const rating = index + 1;
          return (
            <button
              key={index}
              type="button"
              className={`text-2xl transition-colors ${
                rating <= (hover || value)
                  ? getRatingColor(hover || value)
                  : 'text-gray-300'
              } hover:scale-110 transform transition-transform`}
              onClick={() => onChange(rating)}
              onMouseEnter={() => setHover(rating)}
              onMouseLeave={() => setHover(0)}
            >
              ★
            </button>
          );
        })}
      </div>
      
      <div className="flex justify-between items-center">
        <span className={`text-sm font-medium ${getRatingColor(value)}`}>
          {getRatingText(value)}
        </span>
        <span className="text-sm text-gray-500">
          {value}/{max}
        </span>
      </div>
    </div>
  );
};
