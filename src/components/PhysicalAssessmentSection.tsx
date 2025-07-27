
import { StandardizedCard } from '@/components/StandardizedCard';
import { StandardizedFieldGroup } from '@/components/StandardizedFieldGroup';
import { RatingInput } from '@/components/RatingInput';
import { Home, ChefHat, Bath, Bed, Palette, Archive, Sun, TreePine, Star } from 'lucide-react';

interface PhysicalAssessmentSectionProps {
  data: any;
  updateData: (data: any) => void;
}

export const PhysicalAssessmentSection = ({ data, updateData }: PhysicalAssessmentSectionProps) => {
  const assessmentFields = [
    { key: 'planlösning', label: 'Planlösning', icon: Home, description: 'Hur bra är lägenhetens layout?' },
    { key: 'kitchen', label: 'Kök', icon: ChefHat, description: 'Kökets skick och funktionalitet' },
    { key: 'bathroom', label: 'Badrum', icon: Bath, description: 'Badrummets skick och storlek' },
    { key: 'bedrooms', label: 'Sovrum', icon: Bed, description: 'Sovrummens storlek och ljus' },
    { key: 'surfaces', label: 'Ytor', icon: Palette, description: 'Golv, väggar och takets skick' },
    { key: 'förvaring', label: 'Förvaring', icon: Archive, description: 'Tillgång till förvaringsutrymmen' },
    { key: 'ljusinsläpp', label: 'Ljusinsläpp', icon: Sun, description: 'Naturligt ljus i lägenheten' },
    { key: 'balcony', label: 'Balkong', icon: TreePine, description: 'Balkong eller uteplats' }
  ];

  const handleRatingChange = (field: string, rating: number) => {
    updateData({ [field]: rating });
  };

  const handleCommentChange = (field: string, comment: string) => {
    updateData({ [`${field}_comment`]: comment });
  };

  const averageRating = assessmentFields.reduce((sum, field) => sum + data[field.key], 0) / assessmentFields.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-3 leading-tight">Fysisk bedömning</h2>
        <p className="text-muted-foreground text-lg">Betygsätt olika aspekter av lägenhetens fysiska tillstånd (1-5)</p>
      </div>

      <div className="space-y-6">
        {assessmentFields.map((field) => {
          return (
            <StandardizedFieldGroup
              key={field.key}
              title={field.label}
              description={field.description}
              icon={field.icon}
            >
              <RatingInput
                value={data[field.key] || 0}
                onChange={(rating) => handleRatingChange(field.key, rating)}
                comment={data[`${field.key}_comment`] || ''}
                onCommentChange={(comment) => handleCommentChange(field.key, comment)}
                showComment={true}
              />
            </StandardizedFieldGroup>
          );
        })}
      </div>

      <StandardizedCard variant="secondary" className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Star className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-primary">Genomsnittligt betyg</h3>
        </div>
        <p className="text-4xl font-bold text-primary mb-4">{averageRating.toFixed(1)}</p>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-2xl transition-colors ${
                star <= averageRating 
                  ? 'text-warning' 
                  : 'text-muted-foreground/40'
              }`}
            >
              ★
            </span>
          ))}
        </div>
      </StandardizedCard>


      <StandardizedCard variant="default" size="sm" className="bg-muted/30">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Betygsskala:</strong> 1 = Mycket dåligt, 2 = Dåligt, 3 = Okej, 4 = Bra, 5 = Utmärkt
        </p>
      </StandardizedCard>
    </div>
  );
};
