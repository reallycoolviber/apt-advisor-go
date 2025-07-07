
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AutoInputSection } from '@/components/AutoInputSection';
import { GeneralInfoSection } from '@/components/GeneralInfoSection';
import { PhysicalAssessmentSection } from '@/components/PhysicalAssessmentSection';
import { FinancialSection } from '@/components/FinancialSection';
import { SummarySection } from '@/components/SummarySection';
import { ChevronLeft, ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const EvaluationForm = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [apartmentData, setApartmentData] = useState({
    // Auto input data
    apartmentUrl: '',
    annualReportUrl: '',
    
    // User info
    name: '',
    buyerType: '',
    phone: '',
    notes: '',
    
    // General info
    address: '',
    size: '',
    price: '',
    rooms: '',
    monthlyFee: '',
    
    // Physical assessment (1-5 ratings)
    planlösning: 3,
    kitchen: 3,
    bathroom: 3,
    bedrooms: 3,
    surfaces: 3,
    förvaring: 3,
    ljusinsläpp: 3,
    balcony: 3,
    
    // Financial data
    debtPerSqm: '',
    feePerSqm: '',
    cashflowPerSqm: '',
    ownsLand: null as boolean | null,
    underhållsplan: '',
    
    // Summary
    comments: ''
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  const sections = [
    { title: 'Automatisk indata', component: AutoInputSection },
    { title: 'Användarinfo', component: UserInfoSection },
    { title: 'Allmän information', component: GeneralInfoSection },
    { title: 'Fysisk bedömning', component: PhysicalAssessmentSection },
    { title: 'Ekonomi', component: FinancialSection },
    { title: 'Sammanfattning', component: SummarySection }
  ];

  const updateData = (newData: Partial<typeof apartmentData>) => {
    setApartmentData(prev => ({ ...prev, ...newData }));
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const CurrentSectionComponent = sections[currentSection].component;
  const progress = ((currentSection + 1) / sections.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-blue-800 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Home className="h-6 w-6" />
          <h1 className="text-xl font-bold">Lägenhetsbedömning</h1>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm opacity-90">
            <span>{sections[currentSection].title}</span>
            <span>{currentSection + 1}/{sections.length}</span>
          </div>
          <Progress value={progress} className="h-2 bg-blue-800" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-24">
        <Card className="bg-white shadow-lg border-0">
          <div className="p-6">
            <CurrentSectionComponent 
              data={apartmentData} 
              updateData={updateData}
              userId={user?.id}
            />
          </div>
        </Card>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={prevSection}
            disabled={currentSection === 0}
            className="flex-1 h-12"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Föregående
          </Button>
          
          <Button
            onClick={nextSection}
            disabled={currentSection === sections.length - 1}
            className="flex-1 h-12 bg-blue-900 hover:bg-blue-800"
          >
            Nästa
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const UserInfoSection = ({ data, updateData }: { data: any; updateData: (data: any) => void }) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold text-blue-900 mb-2">Användarinformation</h2>
      <p className="text-gray-600">Fyll i dina uppgifter (valfritt)</p>
    </div>

    <div className="grid gap-4">
      <Card className="p-4 bg-blue-50 border-blue-200">
        <label className="block text-blue-900 font-medium mb-2">Namn</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          placeholder="Ditt fullständiga namn"
          className="w-full p-3 border rounded-lg"
        />
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <label className="block text-blue-900 font-medium mb-2">Roll</label>
        <select
          value={data.buyerType}
          onChange={(e) => updateData({ buyerType: e.target.value })}
          className="w-full p-3 border rounded-lg"
        >
          <option value="">Välj roll</option>
          <option value="buyer">Köpare</option>
          <option value="agent">Mäklare</option>
          <option value="investor">Investerare</option>
        </select>
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <label className="block text-blue-900 font-medium mb-2">Telefonnummer</label>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => updateData({ phone: e.target.value })}
          placeholder="070-123 45 67"
          className="w-full p-3 border rounded-lg"
        />
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <label className="block text-blue-900 font-medium mb-2">Anteckningar</label>
        <textarea
          value={data.notes}
          onChange={(e) => updateData({ notes: e.target.value })}
          placeholder="Eventuella anteckningar eller särskilda önskemål..."
          className="w-full p-3 border rounded-lg h-24 resize-none"
        />
      </Card>
    </div>
  </div>
);

export default EvaluationForm;
