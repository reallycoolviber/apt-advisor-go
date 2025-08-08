
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
    if (rating <= 2) return 'text-destructive';
    if (rating <= 3) return 'text-warning';
    return 'text-success';
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
              className={`text-2xl transition-all duration-200 ${
                rating <= (hover || value)
                  ? getRatingColor(hover || value)
                  : 'text-muted-foreground/40'
              } hover:scale-110 transform`}
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
        <span className="text-sm text-muted-foreground">
          {value}/{max}
        </span>
      </div>
      
      {showComment && onCommentChange && (
        <div className="mt-4">
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Kommentar (valfritt)
          </Label>
          <Textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Lägg till en kommentar för detta betyg..."
            className="resize-none w-full rounded-lg border border-input bg-input px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
            rows={3}
          />
        </div>
      )}
    </div>
  );
};
