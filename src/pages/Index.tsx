
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Home, Plus, List, BarChart3, LogOut, User } from 'lucide-react';


const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Skapa ny utvärdering',
      description: 'Lägg till och utvärdera en ny lägenhet',
      icon: Plus,
      color: 'bg-blue-800 hover:bg-blue-900',
      path: '/evaluate'
    },
    {
      title: 'Mina utvärderingar',
      description: 'Bläddra genom tidigare lägenheter',
      icon: List,
      color: 'bg-blue-800 hover:bg-blue-900',
      path: '/evaluations'
    },
    {
      title: 'Jämför lägenheter',
      description: 'Jämför på nyckeltal och KPIer',
      icon: BarChart3,
      color: 'bg-blue-800 hover:bg-blue-900',
      path: '/compare'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <div className="pt-20 px-4 pb-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-3 leading-tight">
            Välkommen till din lägenhetsutvärdering
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Välj vad du vill göra för att komma igång med dina lägenhetsanalyser
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Card key={item.title} className="bg-card shadow-md hover:shadow-xl transition-all duration-300 border-0 rounded-xl overflow-hidden">
                <Button
                  onClick={() => navigate(item.path)}
                  className="w-full h-auto p-6 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-4 text-left transition-all duration-300 hover:shadow-lg"
                >
                  <IconComponent className="h-12 w-12 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold mb-2 leading-tight break-words">{item.title}</h3>
                    <p className="text-primary-foreground/80 text-sm leading-relaxed break-words pr-2">{item.description}</p>
                  </div>
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Med AptEval kan du enkelt analysera och jämföra lägenheter för att fatta välgrundade beslut
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
