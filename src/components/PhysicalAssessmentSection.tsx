
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

  // Calculate how many categories have been rated (more than 0 stars)
  const ratedCategories = assessmentFields.filter(field => data[field.key] > 0);
  const hasMinimumRatings = ratedCategories.length >= 3;
  const averageRating = hasMinimumRatings 
    ? ratedCategories.reduce((sum, field) => sum + data[field.key], 0) / ratedCategories.length
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-prominent font-semibold">Fysisk bedömning</h2>
        <p className="text-small text-muted-foreground">Betygsätt olika aspekter av lägenhetens fysiska tillstånd (1-5)</p>
      </div>

      <div className="space-y-3">
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
        {hasMinimumRatings ? (
          <>
            <p className="text-display font-bold text-primary mb-4">{averageRating.toFixed(1)}</p>
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
          </>
        ) : (
          <>
            <p className="text-title font-medium text-muted-foreground mb-4">Ej beräknat</p>
            <p className="text-small text-muted-foreground">Betygsätt minst 3 kategorier för att se genomsnittet</p>
          </>
        )}
      </StandardizedCard>


      <StandardizedCard variant="default" size="sm" className="bg-muted/30">
        <p className="text-small text-muted-foreground">
          <strong className="text-foreground">Betygsskala:</strong> 1 = Mycket dåligt, 2 = Dåligt, 3 = Okej, 4 = Bra, 5 = Utmärkt
        </p>
      </StandardizedCard>
    </div>
  );
};
