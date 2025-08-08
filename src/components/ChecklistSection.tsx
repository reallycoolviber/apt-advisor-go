import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import cityscapeNeutral from '@/assets/cityscape-neutral.png';

const ChecklistSection = () => {
  const navigate = useNavigate();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const checklistItems = [
    {
      category: 'Föreningen (Fråga Mäklaren/Styrelsen)',
      items: [
        'När gjordes stambyte senast? När är nästa planerat?',
        'När byttes fönster/tak/fasad senast?',
        'Finns några stora planerade renoveringar eller avgiftshöjningar?',
        'Vad ingår i avgiften (värme, vatten, TV, bredband)?',
        'Finns det några kända problem med skadedjur, fukt eller buller i fastigheten?',
        'Hur är situationen med förråd, tvättstuga, cykelrum och parkering?'
      ]
    },
    {
      category: 'Lägenheten (Inspektera Själv)',
      items: [
        'Kontrollera badrummet noggrant: Finns tecken på fukt/mögel? Hur ser golvbrunnen ut? Fråga efter kvalitetsdokument/våtrumsintyg.',
        'Kontrollera köket: Testa alla vitvaror. Kolla trycket i vattenkranen.',
        'Öppna och stäng fönster och dörrar. Är de i gott skick?',
        'Lyssna efter störande ljud från grannar, trapphus eller utifrån.',
        'Kontrollera elen: Finns jordade uttag i alla rum? Ser elcentralen modern ut?',
        'Undersök golv, väggar och tak efter sprickor, fläckar eller skador.'
      ]
    }
  ];

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const getTotalItems = () => {
    return 12; // Fixed to 12 questions as requested
  };

  const getCheckedCount = () => {
    return Object.values(checkedItems).filter(Boolean).length;
  };

  const getProgressPercentage = () => {
    const total = getTotalItems();
    const checked = getCheckedCount();
    return total > 0 ? Math.round((checked / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background cityscape */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `url(${cityscapeNeutral})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          zIndex: 1
        }}
      />
      
      {/* Content */}
      <div className="relative pt-6 pb-8 px-4" style={{ zIndex: 10 }}>
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-hover"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-2 hover:bg-hover"
              >
                <Home className="h-5 w-5" />
              </Button>
            </div>
            
            <h1 className="text-xl font-bold text-foreground">
              Checklista under visning
            </h1>
            
            <div className="w-20"></div> {/* Spacer for balance */}
          </div>

          {/* Progress indicator */}
          <Card className="mb-6 bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  {getCheckedCount()} av {getTotalItems()} punkter klara
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <div className="space-y-6">
            {checklistItems.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="bg-card border shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.items.map((item, itemIndex) => {
                    const itemId = `${categoryIndex}-${itemIndex}`;
                    const isChecked = checkedItems[itemId] || false;
                    
                    return (
                      <div key={itemIndex} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                        <Checkbox
                          id={itemId}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleCheckboxChange(itemId, checked as boolean)}
                          className="mt-0.5 flex-shrink-0"
                        />
                        <label 
                          htmlFor={itemId}
                          className={`text-sm cursor-pointer flex-1 ${
                            isChecked ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {item}
                        </label>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Completion message */}
          {getProgressPercentage() === 100 && (
            <Card className="mt-6 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <CardContent className="p-4 text-center">
                <div className="text-green-600 dark:text-green-400 font-medium">
                  🎉 Bra jobbat! Du har gått igenom alla punkter.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistSection;