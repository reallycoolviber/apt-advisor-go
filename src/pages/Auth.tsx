
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Home, Mail, Lock, User, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
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
        if (isSignUp) {
          setShowEmailVerification(true);
          toast({
            title: "Konto skapat",
            description: "Kontrollera din e-post för att verifiera ditt konto.",
          });
        } else {
          toast({
            title: "Inloggad",
            description: "Välkommen tillbaka!",
          });
          navigate('/');
        }
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

  if (showEmailVerification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 shadow-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Mail className="h-8 w-8 text-accent" />
              <h1 className="text-2xl font-bold text-accent">Verifiera din e-post</h1>
            </div>
            <Alert className="mb-4 bg-muted border-border">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Vi har skickat en verifieringslänk till <strong>{email}</strong>. 
                Klicka på länken i e-postmeddelandet för att aktivera ditt konto.
              </AlertDescription>
            </Alert>
            <p className="text-muted-foreground mb-4">
              Kontrollera även din skräppost om du inte ser e-postmeddelandet.
            </p>
            <Button
              onClick={() => {
                setShowEmailVerification(false);
                setIsSignUp(false);
              }}
              variant="outline"
              className="w-full"
            >
              Tillbaka till inloggning
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Home className="h-8 w-8 text-accent" />
            <h1 className="text-2xl font-bold text-accent">AptEval</h1>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {isSignUp ? 'Skapa konto' : 'Logga in'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isSignUp 
              ? 'Skapa ett konto för att börja utvärdera lägenheter'
              : 'Logga in för att fortsätta med dina lägenhetsutvärderingar'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <Label htmlFor="fullName" className="flex items-center gap-2 text-accent">
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
            <Label htmlFor="email" className="flex items-center gap-2 text-accent">
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
            <Label htmlFor="password" className="flex items-center gap-2 text-accent">
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

          {isSignUp && (
            <Alert className="bg-muted border-border">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Efter registrering kommer du att få ett e-postmeddelande för att verifiera ditt konto.
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            {loading ? 'Laddar...' : (isSignUp ? 'Skapa konto' : 'Logga in')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-accent hover:underline"
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
