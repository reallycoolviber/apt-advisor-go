import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, CheckCircle, Circle, FileText, Building, BarChart3, Save, GitCompare } from 'lucide-react';
import cityscapeNeutral from '@/assets/cityscape-neutral.png';

const EvaluationHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // TODO: This should be replaced with actual completion status from localStorage or state management
  const completionStatus = {
    general: false,
    financial: false,
    physical: false
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
          
          {/* Evaluation sections */}
          <div className="space-y-4 mb-8">
            {evaluationSections.map((section, index) => {
              const IconComponent = section.icon;
              const StatusIcon = section.completed ? CheckCircle : Circle;
              
              return (
                <Card 
                  key={section.title} 
                  className="group overflow-hidden bg-card border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-accent hover:border-accent shadow-md"
                >
                  <Button
                    onClick={() => navigate(section.path)}
                    className="w-full h-auto p-6 flex items-center gap-4 text-left transition-all duration-300 bg-transparent hover:bg-transparent text-foreground group-hover:text-accent-foreground border-0 shadow-none"
                    variant="ghost"
                  >
                    <div className="p-2.5 rounded-lg flex-shrink-0 bg-primary/10 group-hover:bg-accent-foreground/20">
                      <IconComponent className="h-5 w-5 text-primary group-hover:text-accent-foreground" />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <h3 className="text-base font-semibold group-hover:text-accent-foreground mb-1">
                        {section.title}
                      </h3>
                      <p className="text-sm text-muted-foreground group-hover:text-accent-foreground/70">
                        {section.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <StatusIcon 
                        className={`h-5 w-5 ${
                          section.completed 
                            ? 'text-green-500' 
                            : 'text-muted-foreground group-hover:text-accent-foreground'
                        }`} 
                      />
                    </div>
                  </Button>
                </Card>
              );
            })}
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