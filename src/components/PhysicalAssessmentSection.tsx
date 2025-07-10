
import { Card } from '@/components/ui/card';
import { RatingInput } from '@/components/RatingInput';
import { Home, ChefHat, Bath, Bed, Palette, Archive, Sun, TreePine } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Fysisk bedömning</h2>
        <p className="text-gray-600">Betygsätt olika aspekter av lägenhetens fysiska tillstånd (1-5)</p>
      </div>

      <div className="space-y-4">
        {assessmentFields.map((field) => {
          const IconComponent = field.icon;
          return (
            <Card key={field.key} className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <IconComponent className="h-5 w-5 text-blue-900 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">{field.label}</h3>
                  <p className="text-sm text-gray-600">{field.description}</p>
                </div>
              </div>
              
              <RatingInput
                value={data[field.key]}
                onChange={(rating) => handleRatingChange(field.key, rating)}
                comment={data[`${field.key}_comment`] || ''}
                onCommentChange={(comment) => handleCommentChange(field.key, comment)}
                showComment={true}
              />
            </Card>
          );
        })}
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="text-center">
          <p className="text-sm text-blue-700 mb-1">Genomsnittligt betyg</p>
          <p className="text-3xl font-bold text-blue-900">{averageRating.toFixed(1)}</p>
          <div className="flex justify-center mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-xl ${star <= averageRating ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </Card>


      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p><strong>Betygsskala:</strong> 1 = Mycket dåligt, 2 = Dåligt, 3 = Okej, 4 = Bra, 5 = Utmärkt</p>
      </div>
    </div>
  );
};
