
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Home, Mail, Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password, fullName)
        : await signIn(email, password);

      if (error) {
        toast({
          title: "Fel",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: isSignUp ? "Konto skapat" : "Inloggad",
          description: isSignUp 
            ? "Välkommen! Du kan nu börja använda appen." 
            : "Välkommen tillbaka!",
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: "Något gick fel. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-white shadow-lg">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Home className="h-8 w-8 text-blue-900" />
            <h1 className="text-2xl font-bold text-blue-900">AptEval</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">
            {isSignUp ? 'Skapa konto' : 'Logga in'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isSignUp 
              ? 'Skapa ett konto för att börja utvärdera lägenheter'
              : 'Logga in för att fortsätta med dina lägenhetsutvärderingar'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <Label htmlFor="fullName" className="flex items-center gap-2 text-blue-900">
                <User className="h-4 w-4" />
                Fullständigt namn
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ditt fullständiga namn"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="email" className="flex items-center gap-2 text-blue-900">
              <Mail className="h-4 w-4" />
              E-post
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@email.com"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password" className="flex items-center gap-2 text-blue-900">
              <Lock className="h-4 w-4" />
              Lösenord
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ditt lösenord"
              required
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-medium"
          >
            {loading ? 'Laddar...' : (isSignUp ? 'Skapa konto' : 'Logga in')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-900 hover:underline"
          >
            {isSignUp 
              ? 'Har du redan ett konto? Logga in här'
              : 'Inget konto? Skapa ett här'
            }
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
