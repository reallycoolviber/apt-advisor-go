import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, FileText, Building, BarChart3, Save, GitCompare, Minus } from 'lucide-react';
import cityscapeNeutral from '@/assets/cityscape-neutral.png';

const EvaluationHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // TODO: This should be replaced with actual completion status from localStorage or state management
  const completionStatus = {
    general: 'not-started', // 'not-started', 'in-progress', 'completed'
    financial: 'in-progress',
    physical: 'completed'
  };

  const evaluationSections = [
    {
      title: 'Lägenhetsdata',
      description: 'Grundläggande information om lägenheten',
      icon: Building,
      path: '/evaluate/general',
      completed: completionStatus.general
    },
    {
      title: 'Föreningsanalys',
      description: 'Ekonomisk information och föreningsdata',
      icon: BarChart3,
      path: '/evaluate/financial',
      completed: completionStatus.financial
    },
    {
      title: 'Kvalitativ bedömning',
      description: 'Bedömning av lägenhets kvalitet och egenskaper',
      icon: FileText,
      path: '/evaluate/physical',
      completed: completionStatus.physical
    }
  ];

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving evaluation...');
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
      
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-primary-foreground hover:bg-primary/80 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-primary-foreground hover:bg-primary/80 p-2"
          >
            <Home className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Lägenhetsutvärdering</h1>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative pt-6 pb-8 px-4" style={{ zIndex: 10 }}>
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Välj sektion att fylla i
            </h2>
            <p className="text-muted-foreground">
              Fyll i informationen steg för steg för att skapa en komplett utvärdering
            </p>
          </div>
          
          {/* Main content layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Evaluation sections - 3 columns on large screens */}
            <div className="lg:col-span-3">
              <div className="space-y-3">
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
                      className="group overflow-hidden bg-card border transition-all duration-300 hover:shadow-md hover:bg-accent hover:border-accent shadow-sm"
                    >
                      <Button
                        onClick={() => navigate(section.path)}
                        className="w-full p-3 flex items-center gap-4 text-left transition-all duration-300 bg-transparent hover:bg-transparent text-foreground group-hover:text-accent-foreground border-0 shadow-none h-auto justify-start"
                        variant="ghost"
                      >
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
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </div>
            
            {/* Progress sidebar - 1 column on large screens */}
            <div className="lg:col-span-1">
              <Card className="bg-card border shadow-md sticky top-6">
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
            </div>
          </div>
          
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