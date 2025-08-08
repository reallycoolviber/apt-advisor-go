import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StandardizedTextarea } from '@/components/StandardizedTextarea';
import { PageHeader } from '@/components/PageHeader';
import { ArrowLeft, Home, ClipboardCheck, MessageSquare, Building2, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEvaluationStore } from '@/stores/evaluationStore';
import { useEvaluation } from '@/contexts/EvaluationContext';
import cityscapeNeutral from '@/assets/cityscape-neutral.png';

const ChecklistSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get current evaluation context
  const { evaluationId } = useEvaluation();
  
  // Use central store - Single Source of Truth (Evaluation Specific)
  const { 
    checklistItems: storeChecklistItems, 
    checklistLoading, 
    checklistError,
    loadChecklistItems, 
    updateChecklistItem,
    getChecklistProgress,
    initializeChecklistForEvaluation
  } = useEvaluationStore();

  // Only UI state, no checklist data copies
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Add safety check for user
  useEffect(() => {
    if (!user) {
      console.warn('No user found, redirecting to auth');
      navigate('/auth');
      return;
    }
    
    // Load checklist items for this specific evaluation
    if (user && evaluationId) {
      loadChecklistItems(user.id, evaluationId);
    } else if (user && !evaluationId) {
      // If no evaluation ID, we might need to create a new evaluation first
      console.warn('No evaluation ID found for checklist');
    }
  }, [user, evaluationId, navigate, loadChecklistItems]);

  const checklistItems = [
    {
      category: 'Föreningen - Viktiga Frågor till Mäklaren & Styrelsen',
      icon: Building2,
      items: [
        { title: 'Stambyte', text: 'När gjordes stambyte senast? När är nästa planerat?' },
        { title: 'Renoveringar', text: 'När byttes fönster/tak/fasad senast?' },
        { title: 'Planerade arbeten', text: 'Finns några stora planerade renoveringar eller avgiftshöjningar?' },
        { title: 'Avgifter', text: 'Vad ingår i avgiften (värme, vatten, TV, bredband)?' },
        { title: 'Bekanta problem', text: 'Finns det några kända problem med skadedjur, fukt eller buller i fastigheten?' },
        { title: 'Gemensamma utrymmen', text: 'Hur är situationen med förråd, tvättstuga, cykelrum och parkering?' },
        { title: 'Regler', text: 'Vilka regler gäller för husdjur, uthyrning och renovering?' },
        { title: 'Ekonomi', text: 'Har föreningen några ekonomiska utmaningar eller skulder?' }
      ]
    },
    {
      category: 'Lägenheten - Din Personliga Inspektion',
      icon: Eye,
      items: [
        { title: 'Badrum', text: 'Kontrollera badrummet noggrant: Finns tecken på fukt/mögel? Hur ser golvbrunnen ut? Fråga efter kvalitetsdokument/våtrumsintyg.' },
        { title: 'Kök', text: 'Kontrollera köket: Testa alla vitvaror. Kolla trycket i vattenkranen.' },
        { title: 'Fönster & dörrar', text: 'Öppna och stäng fönster och dörrar. Är de i gott skick?' },
        { title: 'Ljudnivå', text: 'Lyssna efter störande ljud från grannar, trapphus eller utifrån.' },
        { title: 'Elinstallation', text: 'Kontrollera elen: Finns jordade uttag i alla rum? Ser elcentralen modern ut?' },
        { title: 'Skador', text: 'Undersök golv, väggar och tak efter sprickor, fläckar eller skador.' },
        { title: 'Ventilation', text: 'Testa ventilationen i badrum och kök. Fungerar den korrekt?' },
        { title: 'Värme', text: 'Kontrollera värmesystemet: Radiatorernas skick och temperaturkontroll.' }
      ]
    }
  ];

  // Handle checkbox changes using central store
  const handleCheckboxChange = async (itemId: string, checked: boolean) => {
    try {
      const currentComment = storeChecklistItems[itemId]?.comment || '';
      await updateChecklistItem(itemId, checked, currentComment);
    } catch (error) {
      console.error('Error updating checkbox:', error);
      toast({
        title: "Fel vid sparning",
        description: "Kunde inte spara checklistobjekt",
        variant: "destructive",
      });
    }
  };

  // Handle comment changes using central store
  const handleCommentChange = (itemId: string, newComment: string) => {
    // For UI responsiveness, we could add local optimistic updates here
    // But for now, we'll update immediately to ensure data consistency
  };

  const handleCommentBlur = async (itemId: string, comment: string) => {
    try {
      const isChecked = storeChecklistItems[itemId]?.is_checked || false;
      await updateChecklistItem(itemId, isChecked, comment);
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Fel vid sparning",
        description: "Kunde inte spara kommentar",
        variant: "destructive",
      });
    }
  };

  const toggleCommentExpansion = (itemId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Use central store for progress calculation
  const progress = getChecklistProgress();

  // Show loading state
  if (checklistLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        <div className="relative pt-6 pb-8 px-4" style={{ zIndex: 10 }}>
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Laddar checklista...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        <div className="relative pt-6 pb-8 px-4" style={{ zIndex: 10 }}>
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Du måste vara inloggad för att se checklistan.</p>
                <Button onClick={() => navigate('/auth')}>Logga in</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background cityscape */}
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
        <div className="max-w-md mx-auto">
          {/* Header */}
          <PageHeader 
            defaultTitle="Professionell Visningsmall" 
            icon={FileText} 
          />

          {/* Progress indicator */}
          <Card className="mb-6 bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <span className="text-body font-medium">
                  {progress.filled} av {progress.total} punkter klara
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? Math.round((progress.filled / progress.total) * 100) : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <div className="space-y-3">
            {checklistItems.map((category, categoryIndex) => {
              const CategoryIcon = category.icon;
              return (
                <Card key={categoryIndex} className="bg-card border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-small font-semibold text-foreground flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <CategoryIcon className="h-5 w-5 text-primary" />
                      </div>
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {category.items.map((item, itemIndex) => {
                      const itemId = `${categoryIndex}-${itemIndex}`;
                      const checklistItem = storeChecklistItems[itemId];
                      const isChecked = checklistItem?.is_checked || false;
                      const comment = checklistItem?.comment || '';
                      const hasComment = comment.trim() !== '';
                      const isExpanded = expandedComments[itemId] || false;
                      
                      return (
                        <div 
                          key={itemIndex} 
                          className="border rounded-lg p-4 bg-background/50 cursor-pointer transition-all duration-200 hover:bg-background/70 hover:border-primary/30"
                          onClick={() => handleCheckboxChange(itemId, !isChecked)}
                        >
                          {/* Top row: Checkbox + Title + Comment Icon */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={itemId}
                                checked={isChecked}
                                onCheckedChange={(checked) => handleCheckboxChange(itemId, checked as boolean)}
                                className="flex-shrink-0 pointer-events-none" // Prevent double trigger
                              />
                              <span className={`font-medium text-body ${
                                isChecked ? 'line-through text-muted-foreground' : 'text-foreground'
                              }`}>
                                {item.title}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering checkbox change
                                toggleCommentExpansion(itemId);
                              }}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
                            >
                              <MessageSquare className="h-4 w-4" />
                              {hasComment && <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full"></span>}
                            </Button>
                          </div>

                          {/* Bottom row: Full question text, indented to align with title */}
                          <div className="ml-7"> {/* ml-7 accounts for checkbox + gap */}
                            <p className={`text-body leading-relaxed ${
                              isChecked ? 'line-through text-muted-foreground' : 'text-muted-foreground'
                            }`}>
                              {item.text}
                            </p>
                          </div>

                          {/* Collapsible comment section */}
                          <Collapsible open={isExpanded} onOpenChange={() => toggleCommentExpansion(itemId)}>
                            <CollapsibleContent className="mt-4 ml-7">
                              <div onClick={(e) => e.stopPropagation()}> {/* Prevent triggering checkbox change when clicking in textarea area */}
                                <StandardizedTextarea
                                  id={`comment-${itemId}`}
                                  label="Kommentar (valfritt)"
                                  value={comment}
                                  onChange={(e) => handleCommentChange(itemId, e.target.value)}
                                  onBlur={(e) => handleCommentBlur(itemId, e.target.value)}
                                  placeholder="Lägg till din kommentar här..."
                                  rows={3}
                                  className="mb-2"
                                />
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Completion message */}
          {progress.filled === progress.total && progress.total > 0 && (
            <Card className="mt-6 bg-success/10 border-success/20">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-success font-medium">
                  <ClipboardCheck className="h-5 w-5" />
                  Perfekt! Du har genomfört en komplett professionell besiktning
                </div>
                <p className="text-body text-muted-foreground mt-2">
                  Alla viktiga aspekter har kontrollerats för att säkerställa ett välgrundat köpbeslut
                </p>
              </CardContent>
            </Card>
          )}

          {/* Show error state if needed */}
          {checklistError && (
            <Card className="mt-6 bg-destructive/10 border-destructive/20">
              <CardContent className="p-6 text-center">
                <div className="text-destructive font-medium mb-2">
                  {checklistError}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => user && loadChecklistItems(user.id)}
                >
                  Försök igen
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistSection;