
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
      {/* Cityscape Background */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url(${cityscapeBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Content */}
      <div className="relative pt-8 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Compact Welcome */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Välkommen till <span className="text-primary">AptEval</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Professionell lägenhetsutvärdering med automatiserad datainhämtning
            </p>
          </div>
          
          {/* Compact Features List */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="space-y-3">
              {features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-card/40 backdrop-blur-sm border border-border/50">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FeatureIcon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact Action Cards */}
          <div className="max-w-2xl mx-auto">
            <div className="space-y-2">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Card 
                    key={item.title} 
                    className="group overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:bg-primary hover:border-primary"
                  >
                    <Button
                      onClick={() => navigate(item.path)}
                      className="w-full h-auto p-3 flex items-center gap-3 text-left transition-all duration-300 bg-transparent hover:bg-transparent text-foreground group-hover:text-primary-foreground border-0 shadow-none"
                      variant="ghost"
                    >
                      <div className="p-2 rounded-lg flex-shrink-0 bg-primary/10 group-hover:bg-primary-foreground/20">
                        <IconComponent className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold leading-tight group-hover:text-primary-foreground">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/80 leading-relaxed">
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
