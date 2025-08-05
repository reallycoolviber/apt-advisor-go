import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, FileText, Building, BarChart3, Save, GitCompare, Minus, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import cityscapeNeutral from '@/assets/cityscape-neutral.png';

const EvaluationHub = () => {
  console.log('EvaluationHub component rendering');
  const { user } = useAuth();
  const { data, updateAddress } = useEvaluation();
  const navigate = useNavigate();

  console.log('EvaluationHub: Current data:', data);
  console.log('EvaluationHub: User:', user);

  const evaluationSections = [
    {
      title: 'Lägenhetsdata',
      description: 'Grundläggande information om lägenheten',
      icon: Building,
      path: '/evaluate/general',
      completed: 'not-started'
    },
    {
      title: 'Föreningsanalys',
      description: 'Ekonomisk information och föreningsdata',
      icon: BarChart3,
      path: '/evaluate/financial',
      completed: 'not-started'
    },
    {
      title: 'Din bedömning av lägenheten',
      description: 'Bedömning av lägenhets kvalitet och egenskaper',
      icon: FileText,
      path: '/evaluate/physical',
      completed: 'not-started'
    }
  ];

  const handleSave = async () => {
    if (!user) {
      console.error('No user logged in');
      return;
    }

    if (!data.address) {
      console.error('No address provided');
      return;
    }

    try {
      const { error } = await supabase
        .from('apartment_evaluations')
        .insert({
          user_id: user.id,
          address: data.address,
          // General data
          size: data.general?.size ? parseFloat(data.general.size) : null,
          rooms: data.general?.rooms || null,
          price: data.general?.price ? parseFloat(data.general.price) : null,
          final_price: data.general?.finalPrice ? parseFloat(data.general.finalPrice) : null,
          monthly_fee: data.general?.monthlyFee ? parseFloat(data.general.monthlyFee) : null,
          // Financial data
          debt_per_sqm: data.financial?.debtPerSqm ? parseFloat(data.financial.debtPerSqm) : null,
          fee_per_sqm: data.financial?.feePerSqm ? parseFloat(data.financial.feePerSqm) : null,
          cashflow_per_sqm: data.financial?.cashflowPerSqm ? parseFloat(data.financial.cashflowPerSqm) : null,
          major_maintenance_done: data.financial?.majorMaintenanceDone,
          owns_land: data.financial?.ownsLand,
          underhållsplan: data.financial?.underhållsplan,
          // Physical data
          planlösning: data.physical?.planlösning || null,
          kitchen: data.physical?.kitchen || null,
          bathroom: data.physical?.bathroom || null,
          bedrooms: data.physical?.bedrooms || null,
          surfaces: data.physical?.surfaces || null,
          förvaring: data.physical?.förvaring || null,
          ljusinsläpp: data.physical?.ljusinsläpp || null,
          balcony: data.physical?.balcony || null,
          // Comments
          planlösning_comment: data.physical?.planlösning_comment,
          kitchen_comment: data.physical?.kitchen_comment,
          bathroom_comment: data.physical?.bathroom_comment,
          bedrooms_comment: data.physical?.bedrooms_comment,
          surfaces_comment: data.physical?.surfaces_comment,
          förvaring_comment: data.physical?.förvaring_comment,
          ljusinsläpp_comment: data.physical?.ljusinsläpp_comment,
          balcony_comment: data.physical?.balcony_comment,
          comments: data.physical?.comments,
          is_draft: false
        });

      if (error) throw error;

      console.log('Evaluation saved successfully');
      navigate('/evaluations');
    } catch (err) {
      console.error('Error saving evaluation:', err);
    }
  };

  const handleCompare = () => {
    navigate('/compare');
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
        <div className="max-w-lg mx-auto">
          {/* Top navigation */}
          <div className="flex items-center gap-2 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2 hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2 hover:bg-accent"
            >
              <Home className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Lägenhetsutvärdering
            </h2>
            <p className="text-muted-foreground">
              Fyll i informationen steg för steg för att skapa en komplett utvärdering
            </p>
          </div>

          {/* Address input */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ange lägenhetens adress..."
                value={data.address || ''}
                onChange={(e) => updateAddress(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
          </div>
          
          {/* Evaluation sections */}
          <div className="space-y-3 mb-8">
            {evaluationSections.map((section, index) => {
              const IconComponent = section.icon;
              
              const renderStatusCheckbox = (status: string) => {
                if (status === 'completed') {
                  return <Checkbox checked={true} className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />;
                } else if (status === 'in-progress') {
                  return (
                    <div className="relative w-4 h-4 border-2 border-primary rounded-sm flex items-center justify-center bg-background">
                      <Minus className="h-2 w-2 text-primary" />
                    </div>
                  );
                } else {
                  return <Checkbox checked={false} />;
                }
              };
              
              return (
                <Card 
                  key={section.title} 
                  className="group overflow-hidden bg-card border transition-all duration-300 hover:shadow-md hover:bg-accent hover:border-accent shadow-sm cursor-pointer"
                  onClick={() => navigate(section.path)}
                >
                  <div className="w-full p-3 flex items-center gap-4 text-left transition-all duration-300">
                    {/* Icon - Left */}
                    <div className="p-2 rounded-lg flex-shrink-0 bg-primary/10 group-hover:bg-accent-foreground/20">
                      <IconComponent className="h-5 w-5 text-primary group-hover:text-accent-foreground" />
                    </div>
                    
                    {/* Text - Center */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold group-hover:text-accent-foreground mb-1 truncate">
                        {section.title}
                      </h3>
                      <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/70 line-clamp-2">
                        {section.description}
                      </p>
                    </div>
                    
                    {/* Status - Right */}
                    <div className="flex-shrink-0">
                      {renderStatusCheckbox(section.completed)}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          
          {/* Progress section - always below cards */}
          <Card className="bg-card border shadow-md mb-8">
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-4 text-center">
                Framsteg
              </h3>
               <div className="space-y-3">
                 {evaluationSections.map((section, index) => (
                   <div key={section.title} className="flex items-center gap-3">
                     <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                       section.completed === 'completed'
                         ? 'bg-green-500' 
                         : section.completed === 'in-progress'
                         ? 'bg-primary/60'
                         : 'bg-muted-foreground/30'
                     }`} />
                     <span className={`text-sm ${
                       section.completed === 'completed'
                         ? 'text-foreground font-medium' 
                         : section.completed === 'in-progress'
                         ? 'text-foreground'
                         : 'text-muted-foreground'
                     }`}>
                       {section.title}
                     </span>
                   </div>
                 ))}
                 <div className="mt-4 pt-3 border-t border-border">
                   <div className="text-xs text-muted-foreground text-center">
                     {evaluationSections.filter(s => s.completed === 'completed').length} av {evaluationSections.length} klara
                   </div>
                   <div className="w-full bg-muted-foreground/20 rounded-full h-2 mt-2">
                     <div 
                       className="bg-green-500 h-2 rounded-full transition-all duration-300"
                       style={{ 
                         width: `${(evaluationSections.filter(s => s.completed === 'completed').length / evaluationSections.length) * 100}%` 
                       }}
                     />
                   </div>
                 </div>
              </div>
            </div>
          </Card>
          
          {/* Action buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Save className="h-4 w-4 mr-2" />
              Spara
            </Button>
            
            <Button
              onClick={handleCompare}
              variant="outline"
              className="flex-1 h-12"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Jämför
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationHub;