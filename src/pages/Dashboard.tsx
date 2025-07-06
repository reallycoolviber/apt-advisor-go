
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Home, Plus, List, BarChart3, LogOut, User } from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const menuItems = [
    {
      title: 'Skapa ny utvärdering',
      description: 'Lägg till och utvärdera en ny lägenhet',
      icon: Plus,
      color: 'bg-emerald-600 hover:bg-emerald-700',
      path: '/evaluate'
    },
    {
      title: 'Mina utvärderingar',
      description: 'Bläddra genom tidigare lägenheter',
      icon: List,
      color: 'bg-blue-600 hover:bg-blue-700',
      path: '/evaluations'
    },
    {
      title: 'Jämför lägenheter',
      description: 'Jämför på nyckeltal och KPIer',
      icon: BarChart3,
      color: 'bg-purple-600 hover:bg-purple-700',
      path: '/compare'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Home className="h-6 w-6" />
            <h1 className="text-xl font-bold">AptEval</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-white border-white hover:bg-white hover:text-blue-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logga ut
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pt-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            Välkommen till din lägenhetsutvärdering
          </h2>
          <p className="text-gray-600">
            Välj vad du vill göra för att komma igång med dina lägenhetsanalyser
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Card key={item.title} className="p-6 hover:shadow-lg transition-shadow">
                <Button
                  onClick={() => navigate(item.path)}
                  className={`w-full h-auto p-6 ${item.color} text-white flex items-start gap-4 text-left`}
                >
                  <IconComponent className="h-8 w-8 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm opacity-90">{item.description}</p>
                  </div>
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Med AptEval kan du enkelt analysera och jämföra lägenheter för att fatta välgrundade beslut
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
