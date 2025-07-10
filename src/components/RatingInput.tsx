
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  comment?: string;
  onCommentChange?: (comment: string) => void;
  max?: number;
  showComment?: boolean;
}

export const RatingInput = ({ 
  value, 
  onChange, 
  comment = '', 
  onCommentChange, 
  max = 5, 
  showComment = false 
}: RatingInputProps) => {
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
      
      {showComment && onCommentChange && (
        <div className="mt-4">
          <Label className="text-sm text-gray-700 mb-2 block">Kommentar (valfritt)</Label>
          <Textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Lägg till en kommentar för detta betyg..."
            className="mt-1 resize-none w-full min-h-[80px]"
            rows={3}
          />
        </div>
      )}
    </div>
  );
};
