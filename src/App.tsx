
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EvaluationProvider } from "@/contexts/EvaluationContext";
import { GlobalHeader } from "@/components/GlobalHeader";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import EvaluationForm from "./pages/EvaluationForm";
import EvaluationHub from "./pages/EvaluationHub";
import EvaluationSection from "./pages/EvaluationSection";
import Evaluations from "./pages/Evaluations";
import EvaluationDetail from "./pages/EvaluationDetail";
import Compare from "./pages/Compare";
import AutoComparison from "./pages/AutoComparison";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Laddar...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Laddar...</div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.PROD ? "/apt-advisor-go" : ""}>
          <SidebarProvider>
            <div className="min-h-screen w-full bg-background text-foreground">
              <GlobalHeader />
              <div className="pt-14">
                <Routes>
                  <Route path="/auth" element={
                    <PublicRoute>
                      <Auth />
                    </PublicRoute>
                  } />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <EvaluationProvider>
                        <Index />
                      </EvaluationProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/evaluate" element={
                    <ProtectedRoute>
                      <EvaluationProvider>
                        <EvaluationHub />
                      </EvaluationProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/evaluate/:section" element={
                    <ProtectedRoute>
                      <EvaluationProvider>
                        <EvaluationSection />
                      </EvaluationProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/evaluate/form/:id?" element={
                    <ProtectedRoute>
                      <EvaluationForm />
                    </ProtectedRoute>
                  } />
                  <Route path="/evaluations" element={
                    <ProtectedRoute>
                      <Evaluations />
                    </ProtectedRoute>
                  } />
                  <Route path="/compare" element={
                    <ProtectedRoute>
                      <Compare />
                    </ProtectedRoute>
                  } />
                  <Route path="/auto-comparison/:id" element={
                    <ProtectedRoute>
                      <AutoComparison />
                    </ProtectedRoute>
                  } />
                  <Route path="/evaluation/:id" element={
                    <ProtectedRoute>
                      <EvaluationDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
