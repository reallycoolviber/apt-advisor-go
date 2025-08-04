
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, List, BarChart3, TrendingUp, Shield, Zap, ArrowRight } from 'lucide-react';
import cityscapeBackground from '@/assets/cityscape-background.svg';


const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  console.log('Index component rendering');

  const features = [
    {
      icon: TrendingUp,
      text: 'Automatisk analys - Extrahera nyckeltal automatiskt från årsredovisningar'
    },
    {
      icon: Shield,
      text: 'Strukturerad data - Kvalitetssäkrad information från officiella källor'
    },
    {
      icon: Zap,
      text: 'Snabba beslut - Jämför lägenheter och få insikter på minuter'
    }
  ];

  const menuItems = [
    {
      title: 'Skapa ny utvärdering',
      description: 'Lägg till och utvärdera en ny lägenhet med automatisk datainhämtning',
      icon: Plus,
      path: '/evaluate',
      primary: true
    },
    {
      title: 'Mina utvärderingar',
      description: 'Bläddra genom tidigare lägenhetsanalyser och spåra utveckling',
      icon: List,
      path: '/evaluations',
      primary: false
    },
    {
      title: 'Jämför lägenheter',
      description: 'Analysera nyckeltal och få detaljerade jämförelser mellan lägenheter',
      icon: BarChart3,
      path: '/compare',
      primary: false
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Cityscape Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${cityscapeBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Content */}
      <div className="relative pt-6 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Extremely Minimal Welcome */}
          <div className="text-center mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">
              Välkommen till <span className="text-primary">AptEval</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Professionell lägenhetsutvärdering
            </p>
          </div>
          
          {/* Features List with Icons */}
          <div className="max-w-md mx-auto mb-6">
            <div className="space-y-3">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium leading-relaxed">
                        {feature.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact Action Cards */}
          <div className="max-w-md mx-auto">
            <div className="space-y-0.5">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Card 
                    key={item.title} 
                    className="group overflow-hidden bg-card border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:bg-primary hover:border-primary"
                  >
                    <Button
                      onClick={() => navigate(item.path)}
                      className="w-full h-auto p-2 flex items-center gap-2.5 text-left transition-all duration-300 bg-transparent hover:bg-transparent text-foreground group-hover:text-primary-foreground border-0 shadow-none"
                      variant="ghost"
                    >
                      <div className="p-1 rounded flex-shrink-0 bg-primary/10 group-hover:bg-primary-foreground/20">
                        <IconComponent className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-semibold leading-tight group-hover:text-primary-foreground">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/80 leading-snug">
                          {item.description}
                        </p>
                      </div>
                      
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1 text-muted-foreground group-hover:text-primary-foreground/70" />
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
