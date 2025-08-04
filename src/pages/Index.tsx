
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, List, BarChart3, TrendingUp, Shield, Zap, ArrowRight } from 'lucide-react';
import cityscapeNeutral from '@/assets/cityscape-neutral.png';



const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  console.log('Index component rendering');

  const features = [
    {
      icon: TrendingUp,
      title: 'Automatisk analys',
      description: 'Extrahera nyckeltal automatiskt från årsredovisningar'
    },
    {
      icon: Shield,
      title: 'Strukturerad data',
      description: 'Kvalitetssäkrad information från officiella källor'
    },
    {
      icon: Zap,
      title: 'Snabba beslut',
      description: 'Jämför lägenheter och få insikter på minuter'
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
      {/* Neutral stadsbild bakgrund */}
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
          {/* Extremely Minimal Welcome */}
          <div className="text-center mb-4 drop-shadow-sm">
            <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1 drop-shadow-sm">
              Välkommen till <span className="text-primary">AptEval</span>
            </h1>
            <p className="text-xs text-muted-foreground drop-shadow-sm">
              Professionell lägenhetsutvärdering
            </p>
          </div>
          
          {/* Features List with Icons */}
          <div className="max-w-md mx-auto mb-8">
            <div className="space-y-3">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-3 drop-shadow-sm">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0 shadow-sm">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-foreground leading-relaxed drop-shadow-sm">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed drop-shadow-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enhanced Action Cards */}
          <div className="max-w-md mx-auto">
            <div className="space-y-4">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Card 
                    key={item.title} 
                    className="group overflow-hidden bg-card border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-primary hover:border-primary shadow-md"
                  >
                    <Button
                      onClick={() => navigate(item.path)}
                      className="w-full h-auto p-5 flex items-center gap-4 text-left transition-all duration-300 bg-transparent hover:bg-transparent text-foreground group-hover:text-primary-foreground border-0 shadow-none"
                      variant="ghost"
                    >
                      <div className="p-2.5 rounded-lg flex-shrink-0 bg-primary/10 group-hover:bg-primary-foreground/20">
                        <IconComponent className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold leading-tight group-hover:text-primary-foreground mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/80 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 text-muted-foreground group-hover:text-primary-foreground/70" />
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
