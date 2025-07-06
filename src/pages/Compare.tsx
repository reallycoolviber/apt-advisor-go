
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Plus } from 'lucide-react';

const Compare = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-blue-800 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Home className="h-6 w-6" />
          <h1 className="text-xl font-bold">Jämför lägenheter</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <Card className="bg-white shadow-lg border-0 p-6 text-center">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            Jämför dina lägenheter
          </h2>
          <p className="text-gray-600 mb-6">
            När du har skapat flera utvärderingar kan du jämföra dem här baserat på olika nyckeltal och KPIer.
          </p>
          <Button
            onClick={() => navigate('/evaluate')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Skapa utvärdering
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Compare;
