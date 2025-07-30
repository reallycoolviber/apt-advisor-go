
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
      description: 'Extrahera nyckeltal från årsredovisningar och fastighetsdata automatiskt'
    },
    {
      icon: Shield,
      title: 'Pålitig data',
      description: 'Kvalitetssäkrad information från officiella källor som Booli och årsredovisningar'
    },
    {
      icon: Zap,
      title: 'Snabba beslut',
      description: 'Jämför lägenheter och få värdefulla insikter på några minuter'
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
              Välkommen till <span className="text-primary">AptEval</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Den professionella plattformen för lägenhetsutvärdering och fastighetsanalys. 
              Fatta välgrundade beslut med automatiserad datainhämtning och djupa insikter.
            </p>
            
            {/* Value Proposition Features */}
            <div className="grid md:grid-cols-3 gap-8 mt-12 mb-16">
              {features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <Card key={index} className="p-6 border border-border bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:shadow-md">
                    <CardContent className="p-0 text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <FeatureIcon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Main Actions */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">
              Kom igång med din analys
            </h2>
            
            <div className="space-y-4">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Card 
                    key={item.title} 
                    className={`group overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      item.primary 
                        ? 'border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5' 
                        : 'border-border bg-card'
                    }`}
                  >
                    <Button
                      onClick={() => navigate(item.path)}
                      className={`w-full h-auto p-6 flex items-center gap-6 text-left transition-all duration-300 ${
                        item.primary
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md'
                          : 'bg-transparent hover:bg-muted/50 text-foreground border-0 shadow-none'
                      }`}
                      variant={item.primary ? 'default' : 'ghost'}
                    >
                      <div className={`p-3 rounded-lg flex-shrink-0 ${
                        item.primary 
                          ? 'bg-primary-foreground/20' 
                          : 'bg-primary/10'
                      }`}>
                        <IconComponent className={`h-8 w-8 ${
                          item.primary ? 'text-primary-foreground' : 'text-primary'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-xl font-bold mb-2 leading-tight ${
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

          {/* Bottom CTA */}
          <div className="text-center mt-16 p-8 bg-muted/30 rounded-2xl border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Redo att börja analysera?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              AptEval hjälper dig att fatta välgrundade beslut genom automatiserad datainhämtning, 
              kvalitetssäkrade analyser och professionella rapporter.
            </p>
            <Button 
              onClick={() => navigate('/evaluate')}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Skapa din första utvärdering
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
