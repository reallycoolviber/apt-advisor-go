
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, List, BarChart3, TrendingUp, Shield, Zap, ArrowRight } from 'lucide-react';


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
      {/* Subtle Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-opacity='0.3'%3E%3Cpath d='M20 20h60v60H20V20zm5 5v50h50V25H25z' fill='%23000'/%3E%3Cpath d='M30 30h40v40H30V30zm5 5v30h30V35H35z' fill='%23000'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
          backgroundPosition: 'center center'
        }}
      />
      
      {/* Hero Section */}
      <div className="relative pt-16 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Välkommen till <span className="text-primary">AptEval</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Professionell lägenhetsutvärdering med automatiserad datainhämtning och djupa insikter.
            </p>
            
            {/* Value Proposition Features */}
            <div className="grid md:grid-cols-3 gap-6 mt-8 mb-10">
              {features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <Card key={index} className="p-4 border border-border bg-card/60 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:shadow-md">
                    <CardContent className="p-0 text-center">
                      <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <FeatureIcon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Main Actions */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-foreground text-center mb-6">
              Kom igång med din analys
            </h2>
            
            <div className="space-y-3">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Card 
                    key={item.title} 
                    className={`group overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      item.primary 
                        ? 'border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5' 
                        : 'border-border bg-card/60'
                    }`}
                  >
                    <Button
                      onClick={() => navigate(item.path)}
                      className={`w-full h-auto p-4 flex items-center gap-4 text-left transition-all duration-300 ${
                        item.primary
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md'
                          : 'bg-transparent hover:bg-muted/50 text-foreground border-0 shadow-none'
                      }`}
                      variant={item.primary ? 'default' : 'ghost'}
                    >
                      <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                        item.primary 
                          ? 'bg-primary-foreground/20' 
                          : 'bg-primary/10'
                      }`}>
                        <IconComponent className={`h-7 w-7 ${
                          item.primary ? 'text-primary-foreground' : 'text-primary'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-bold mb-1 leading-tight ${
                          item.primary ? 'text-primary-foreground' : 'text-foreground'
                        }`}>
                          {item.title}
                        </h3>
                        <p className={`text-sm leading-relaxed ${
                          item.primary ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                      
                      <ArrowRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${
                        item.primary ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`} />
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
