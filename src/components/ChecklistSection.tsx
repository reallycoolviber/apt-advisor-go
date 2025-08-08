import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Home, ClipboardCheck, MessageSquare, Save, Building2, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import cityscapeNeutral from '@/assets/cityscape-neutral.png';

interface ChecklistItem {
  id: string;
  is_checked: boolean;
  comment: string;
}

const ChecklistSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const checklistItems = [
    {
      category: 'Föreningen - Viktiga Frågor till Mäklaren & Styrelsen',
      icon: Building2,
      items: [
        'När gjordes stambyte senast? När är nästa planerat?',
        'När byttes fönster/tak/fasad senast?',
        'Finns några stora planerade renoveringar eller avgiftshöjningar?',
        'Vad ingår i avgiften (värme, vatten, TV, bredband)?',
        'Finns det några kända problem med skadedjur, fukt eller buller i fastigheten?',
        'Hur är situationen med förråd, tvättstuga, cykelrum och parkering?',
        'Vilka regler gäller för husdjur, uthyrning och renovering?',
        'Har föreningen några ekonomiska utmaningar eller skulder?'
      ]
    },
    {
      category: 'Lägenheten - Din Personliga Inspektion',
      icon: Eye,
      items: [
        'Kontrollera badrummet noggrant: Finns tecken på fukt/mögel? Hur ser golvbrunnen ut? Fråga efter kvalitetsdokument/våtrumsintyg.',
        'Kontrollera köket: Testa alla vitvaror. Kolla trycket i vattenkranen.',
        'Öppna och stäng fönster och dörrar. Är de i gott skick?',
        'Lyssna efter störande ljud från grannar, trapphus eller utifrån.',
        'Kontrollera elen: Finns jordade uttag i alla rum? Ser elcentralen modern ut?',
        'Undersök golv, väggar och tak efter sprickor, fläckar eller skador.',
        'Testa ventilationen i badrum och kök. Fungerar den korrekt?',
        'Kontrollera värmesystemet: Radiatorernas skick och temperaturkontroll.'
      ]
    }
  ];

  // Load existing checklist data
  useEffect(() => {
    if (user) {
      loadChecklistData();
    }
  }, [user]);

  const loadChecklistData = async () => {
    if (!user) return;
    
    try {
      const { data: items, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const checkedState: Record<string, boolean> = {};
      const commentsState: Record<string, string> = {};

      items?.forEach(item => {
        const itemId = `${item.item_category}-${item.item_index}`;
        checkedState[itemId] = item.is_checked;
        commentsState[itemId] = item.comment || '';
      });

      setCheckedItems(checkedState);
      setComments(commentsState);
    } catch (error) {
      console.error('Error loading checklist data:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda checklistdata",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveChecklistItem = async (categoryIndex: number, itemIndex: number, isChecked: boolean, comment: string) => {
    if (!user) return;

    const category = checklistItems[categoryIndex].category;
    const itemText = checklistItems[categoryIndex].items[itemIndex];

    try {
      const { error } = await supabase
        .from('checklist_items')
        .upsert({
          user_id: user.id,
          item_category: category,
          item_index: itemIndex,
          item_text: itemText,
          is_checked: isChecked,
          comment: comment,
        }, {
          onConflict: 'user_id,item_category,item_index'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving checklist item:', error);
      toast({
        title: "Fel vid sparning",
        description: "Kunde inte spara checklistobjekt",
        variant: "destructive",
      });
    }
  };

  const handleCheckboxChange = async (itemId: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));

    const [categoryIndex, itemIndex] = itemId.split('-').map(Number);
    const comment = comments[itemId] || '';
    await saveChecklistItem(categoryIndex, itemIndex, checked, comment);
  };

  const handleCommentSave = async (itemId: string) => {
    setSaving(true);
    const [categoryIndex, itemIndex] = itemId.split('-').map(Number);
    const isChecked = checkedItems[itemId] || false;
    const comment = comments[itemId] || '';
    
    await saveChecklistItem(categoryIndex, itemIndex, isChecked, comment);
    
    setExpandedComments(prev => ({
      ...prev,
      [itemId]: false
    }));
    setSaving(false);
    
    toast({
      title: "Kommentar sparad",
      description: "Din kommentar har sparats",
    });
  };

  const toggleCommentExpansion = (itemId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getTotalItems = () => {
    return checklistItems.reduce((total, category) => total + category.items.length, 0);
  };

  const getCheckedCount = () => {
    return Object.values(checkedItems).filter(Boolean).length;
  };

  const getProgressPercentage = () => {
    const total = getTotalItems();
    const checked = getCheckedCount();
    return total > 0 ? Math.round((checked / total) * 100) : 0;
  };

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
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-hover"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-2 hover:bg-hover"
              >
                <Home className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                Professionell Visningsmall
              </h1>
            </div>
            
            <div className="w-20"></div> {/* Spacer for balance */}
          </div>

          {/* Progress indicator */}
          <Card className="mb-6 bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  {getCheckedCount()} av {getTotalItems()} punkter klara
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <div className="space-y-6">
            {checklistItems.map((category, categoryIndex) => {
              const CategoryIcon = category.icon;
              return (
                <Card key={categoryIndex} className="bg-card border shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-3">
                      <CategoryIcon className="h-5 w-5 text-primary" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {category.items.map((item, itemIndex) => {
                      const itemId = `${categoryIndex}-${itemIndex}`;
                      const isChecked = checkedItems[itemId] || false;
                      const hasComment = comments[itemId] && comments[itemId].trim() !== '';
                      const isExpanded = expandedComments[itemId] || false;
                      
                      return (
                        <div key={itemIndex} className="border rounded-lg p-4 bg-background/50">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={itemId}
                              checked={isChecked}
                              onCheckedChange={(checked) => handleCheckboxChange(itemId, checked as boolean)}
                              className="mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1 space-y-2">
                              <label 
                                htmlFor={itemId}
                                className={`text-sm cursor-pointer block ${
                                  isChecked ? 'line-through text-muted-foreground' : 'text-foreground'
                                }`}
                              >
                                {item}
                              </label>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleCommentExpansion(itemId)}
                                  className="text-xs h-7"
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  {hasComment ? 'Redigera kommentar' : 'Lägg till kommentar'}
                                  {hasComment && <span className="ml-1 h-2 w-2 bg-primary rounded-full"></span>}
                                </Button>
                              </div>

                              <Collapsible open={isExpanded} onOpenChange={() => toggleCommentExpansion(itemId)}>
                                <CollapsibleContent className="space-y-3 mt-3">
                                  <Textarea
                                    placeholder="Lägg till din kommentar här..."
                                    value={comments[itemId] || ''}
                                    onChange={(e) => setComments(prev => ({ ...prev, [itemId]: e.target.value }))}
                                    className="min-h-[80px] text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleCommentSave(itemId)}
                                      disabled={saving}
                                      className="h-8"
                                    >
                                      <Save className="h-3 w-3 mr-1" />
                                      {saving ? 'Sparar...' : 'Spara kommentar'}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleCommentExpansion(itemId)}
                                      className="h-8"
                                    >
                                      Avbryt
                                    </Button>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Completion message */}
          {getProgressPercentage() === 100 && (
            <Card className="mt-6 bg-success/10 border-success/20">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-success font-medium">
                  <ClipboardCheck className="h-5 w-5" />
                  Perfekt! Du har genomfört en komplett professionell besiktning
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Alla viktiga aspekter har kontrollerats för att säkerställa ett välgrundat köpbeslut
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="mt-6">
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  Laddar din checklista...
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistSection;