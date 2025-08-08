import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Home, FileText, Building, BarChart3, Save, GitCompare, Minus, MapPin, Euro, Star, Edit, ClipboardCheck } from 'lucide-react';
import AutoComparisonWidget from '@/components/AutoComparisonWidget';
import EvaluationNavigationToggle from '@/components/EvaluationNavigationToggle';
import { supabase } from '@/integrations/supabase/client';
import cityscapeNeutral from '@/assets/cityscape-neutral.png';
import { formatValue as formatDisplayValue } from '@/utils/formatValue';

const EvaluationHub = () => {
  console.log('EvaluationHub component starting to render');
  
  const { user } = useAuth();
  const { data, updateAddress, loadEvaluation, getCompletionStatus, updatePhysicalData } = useEvaluation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentEvaluationId, setCurrentEvaluationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'evaluation' | 'comparison'>('input');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedAddress, setEditedAddress] = useState('');
  const [hasAutoSaved, setHasAutoSaved] = useState(false);
  const [checklistProgress, setChecklistProgress] = useState({ filled: 0, total: 16 });
  
  console.log('EvaluationHub: hooks initialized successfully');
  console.log('EvaluationHub: Current data:', data);
  console.log('EvaluationHub: User:', user);

  const fetchChecklistProgress = async () => {
    if (!user) return { filled: 0, total: 16 };
    
    try {
      const { data: items, error } = await supabase
        .from('checklist_items')
        .select('is_checked')
        .eq('user_id', user.id);

      if (error) throw error;

      const filled = items?.filter(item => item.is_checked).length || 0;
      const progress = { filled, total: 16 };
      setChecklistProgress(progress);
      return progress;
    } catch (error) {
      console.error('Error fetching checklist progress:', error);
      return { filled: 0, total: 16 };
    }
  };

  const toBase = (v: any): number | null => {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return v;
    const num = parseFloat(v.toString().replace(/\s/g, '').replace(',', '.'));
    return isNaN(num) ? null : num;
  };

  // Load checklist progress
  useEffect(() => {
    if (user) {
      fetchChecklistProgress();
    }
  }, [user]);

  // Load existing evaluation if edit mode
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && user && !currentEvaluationId) {
      setLoading(true);
      setCurrentEvaluationId(editId);
      
      const fetchEvaluation = async () => {
        try {
          const { data: evaluation, error } = await supabase
            .from('apartment_evaluations')
            .select('*')
            .eq('id', editId)
            .eq('user_id', user.id)
            .single();

          if (error) throw error;
          
          if (evaluation) {
            loadEvaluation(evaluation.id);
          }
        } catch (err) {
          console.error('Error loading evaluation for editing:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchEvaluation();
    }
  }, [searchParams, user, currentEvaluationId]); // Removed loadEvaluation from deps

  // Helper function to calculate progress for a section
  const calculateSectionProgress = (section: 'general' | 'financial' | 'physical' | 'checklist') => {
    if (section === 'general') {
      const fields = [data.address, data.general?.size, data.general?.rooms, data.general?.price, data.general?.finalPrice, data.general?.monthlyFee];
      const filledFields = fields.filter(field => field && field !== '').length;
      return { filled: filledFields, total: fields.length };
    } else if (section === 'financial') {
      const fields = [data.financial?.debtPerSqm, data.financial?.cashflowPerSqm, data.financial?.majorMaintenanceDone, data.financial?.ownsLand, data.financial?.underhållsplan];
      const filledFields = fields.filter(field => field !== null && field !== undefined && field !== '').length;
      return { filled: filledFields, total: fields.length };
    } else if (section === 'physical') {
      const ratings = [data.physical?.planlösning, data.physical?.kitchen, data.physical?.bathroom, data.physical?.bedrooms, data.physical?.surfaces, data.physical?.förvaring, data.physical?.ljusinsläpp, data.physical?.balcony];
      const filledRatings = ratings.filter(rating => rating && rating > 0).length;
      return { filled: filledRatings, total: ratings.length };
    }
    return checklistProgress;
  };

  const evaluationSections = [
    {
      title: 'Lägenhetsdata',
      description: 'Grundläggande information om lägenheten',
      icon: Building,
      path: '/evaluate/general/Lägenhetsdata',
      completed: getCompletionStatus('general'),
      progress: calculateSectionProgress('general')
    },
    {
      title: 'Föreningsanalys',
      description: 'Ekonomisk information och föreningsdata',
      icon: BarChart3,
      path: '/evaluate/financial/Föreningsanalys',
      completed: getCompletionStatus('financial'),
      progress: calculateSectionProgress('financial')
    },
    {
      title: 'Lägenhetsbedömning',
      description: 'Kvalitativ bedömning av lägenheten',
      icon: FileText,
      path: '/evaluate/physical/Lägenhetsbedömning',
      completed: getCompletionStatus('physical'),
      progress: calculateSectionProgress('physical')
    },
    {
      title: 'Checklista under visning',
      description: 'Viktiga punkter att kontrollera under visning',
      icon: ClipboardCheck,
      path: '/evaluate/checklist/Checklista under visning',
      completed: 'not-started',
      progress: calculateSectionProgress('checklist')
    }
  ];

  // Calculate physical assessment average if data exists
  const calculatePhysicalAverage = () => {
    if (!data.physical) return 0;
    const ratings = [
      data.physical.planlösning,
      data.physical.kitchen,
      data.physical.bathroom,
      data.physical.bedrooms,
      data.physical.surfaces,
      data.physical.förvaring,
      data.physical.ljusinsläpp,
      data.physical.balcony
    ].filter(rating => rating && rating > 0);
    
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  };

  const physicalAverage = calculatePhysicalAverage();
  const hasAnyData = data.address || data.general?.size || data.general?.price || data.physical || data.financial;

  // Functions to check if data exists for each category
  const hasLägenhetsdata = () => {
    return data.address || data.general?.size || data.general?.rooms || data.general?.price || data.general?.finalPrice || data.general?.monthlyFee;
  };

  const hasFöreningsinformation = () => {
    return data.financial?.debtPerSqm || data.financial?.cashflowPerSqm || 
           data.financial?.majorMaintenanceDone !== undefined || data.financial?.ownsLand !== undefined || 
           data.financial?.underhållsplan;
  };

  const hasBedömning = () => {
    return data.physical?.planlösning || data.physical?.kitchen || data.physical?.bathroom || 
           data.physical?.bedrooms || data.physical?.surfaces || data.physical?.förvaring || 
           data.physical?.ljusinsläpp || data.physical?.balcony || data.physical?.comments;
  };

  // Auto-save effect - saves whenever there's data and user is present
  useEffect(() => {
    const autoSave = async () => {
      if (!user || !hasAnyData || !data.address || hasAutoSaved) return;
      
      try {
        if (currentEvaluationId) {
          // Update existing evaluation as draft
          await supabase
            .from('apartment_evaluations')
            .update({
              address: data.address,
              size: data.general?.size ? toBase(data.general.size) : null,
              rooms: data.general?.rooms || null,
              price: toBase(data.general?.price),
              final_price: toBase(data.general?.finalPrice),
              monthly_fee: toBase(data.general?.monthlyFee),
              debt_per_sqm: toBase(data.financial?.debtPerSqm),
              cashflow_per_sqm: toBase(data.financial?.cashflowPerSqm),
              major_maintenance_done: data.financial?.majorMaintenanceDone,
              owns_land: data.financial?.ownsLand,
              underhållsplan: data.financial?.underhållsplan,
              planlösning: data.physical?.planlösning || null,
              kitchen: data.physical?.kitchen || null,
              bathroom: data.physical?.bathroom || null,
              bedrooms: data.physical?.bedrooms || null,
              surfaces: data.physical?.surfaces || null,
              förvaring: data.physical?.förvaring || null,
              ljusinsläpp: data.physical?.ljusinsläpp || null,
              balcony: data.physical?.balcony || null,
              planlösning_comment: data.physical?.planlösning_comment,
              kitchen_comment: data.physical?.kitchen_comment,
              bathroom_comment: data.physical?.bathroom_comment,
              bedrooms_comment: data.physical?.bedrooms_comment,
              surfaces_comment: data.physical?.surfaces_comment,
              förvaring_comment: data.physical?.förvaring_comment,
              ljusinsläpp_comment: data.physical?.ljusinsläpp_comment,
              balcony_comment: data.physical?.balcony_comment,
              comments: data.physical?.comments,
              is_draft: true
            })
            .eq('id', currentEvaluationId)
            .eq('user_id', user.id);
        } else {
          // Create new evaluation as draft
          const { data: newEvaluation } = await supabase
            .from('apartment_evaluations')
            .insert({
              user_id: user.id,
              address: data.address,
              size: data.general?.size ? toBase(data.general.size) : null,
              rooms: data.general?.rooms || null,
              price: toBase(data.general?.price),
              final_price: toBase(data.general?.finalPrice),
              monthly_fee: toBase(data.general?.monthlyFee),
              debt_per_sqm: toBase(data.financial?.debtPerSqm),
              cashflow_per_sqm: toBase(data.financial?.cashflowPerSqm),
              major_maintenance_done: data.financial?.majorMaintenanceDone,
              owns_land: data.financial?.ownsLand,
              underhållsplan: data.financial?.underhållsplan,
              planlösning: data.physical?.planlösning || null,
              kitchen: data.physical?.kitchen || null,
              bathroom: data.physical?.bathroom || null,
              bedrooms: data.physical?.bedrooms || null,
              surfaces: data.physical?.surfaces || null,
              förvaring: data.physical?.förvaring || null,
              ljusinsläpp: data.physical?.ljusinsläpp || null,
              balcony: data.physical?.balcony || null,
              planlösning_comment: data.physical?.planlösning_comment,
              kitchen_comment: data.physical?.kitchen_comment,
              bathroom_comment: data.physical?.bathroom_comment,
              bedrooms_comment: data.physical?.bedrooms_comment,
              surfaces_comment: data.physical?.surfaces_comment,
              förvaring_comment: data.physical?.förvaring_comment,
              ljusinsläpp_comment: data.physical?.ljusinsläpp_comment,
              balcony_comment: data.physical?.balcony_comment,
              comments: data.physical?.comments,
              is_draft: true
            })
            .select('id')
            .single();
          
          if (newEvaluation) {
            setCurrentEvaluationId(newEvaluation.id);
          }
        }
        setHasAutoSaved(true);
        console.log('Auto-saved evaluation');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    const timer = setTimeout(autoSave, 2000); // Auto-save after 2 seconds
    return () => clearTimeout(timer);
  }, [user, hasAnyData, data, currentEvaluationId, hasAutoSaved]);

  const handleSave = async () => {
    if (!user) {
      console.error('No user logged in');
      return;
    }

    if (!data.address) {
      console.error('No address provided');
      return;
    }

    try {
      if (currentEvaluationId) {
        // Update existing evaluation
        const { error } = await supabase
          .from('apartment_evaluations')
          .update({
            address: data.address,
            // General data
            size: data.general?.size ? toBase(data.general.size) : null,
            rooms: data.general?.rooms || null,
            price: toBase(data.general?.price),
            final_price: toBase(data.general?.finalPrice),
            monthly_fee: toBase(data.general?.monthlyFee),
            // Financial data
            debt_per_sqm: toBase(data.financial?.debtPerSqm),
            cashflow_per_sqm: toBase(data.financial?.cashflowPerSqm),
            major_maintenance_done: data.financial?.majorMaintenanceDone,
            owns_land: data.financial?.ownsLand,
            underhållsplan: data.financial?.underhållsplan,
            // Physical data
            planlösning: data.physical?.planlösning || null,
            kitchen: data.physical?.kitchen || null,
            bathroom: data.physical?.bathroom || null,
            bedrooms: data.physical?.bedrooms || null,
            surfaces: data.physical?.surfaces || null,
            förvaring: data.physical?.förvaring || null,
            ljusinsläpp: data.physical?.ljusinsläpp || null,
            balcony: data.physical?.balcony || null,
            // Comments
            planlösning_comment: data.physical?.planlösning_comment,
            kitchen_comment: data.physical?.kitchen_comment,
            bathroom_comment: data.physical?.bathroom_comment,
            bedrooms_comment: data.physical?.bedrooms_comment,
            surfaces_comment: data.physical?.surfaces_comment,
            förvaring_comment: data.physical?.förvaring_comment,
            ljusinsläpp_comment: data.physical?.ljusinsläpp_comment,
            balcony_comment: data.physical?.balcony_comment,
            comments: data.physical?.comments,
            is_draft: false
          })
          .eq('id', currentEvaluationId)
          .eq('user_id', user.id);

        if (error) throw error;
        console.log('Evaluation updated successfully');
      } else {
        // Create new evaluation
        const { error } = await supabase
          .from('apartment_evaluations')
          .insert({
            user_id: user.id,
            address: data.address,
            // General data
            size: data.general?.size ? toBase(data.general.size) : null,
            rooms: data.general?.rooms || null,
            price: toBase(data.general?.price),
            final_price: toBase(data.general?.finalPrice),
            monthly_fee: toBase(data.general?.monthlyFee),
            // Financial data
            debt_per_sqm: toBase(data.financial?.debtPerSqm),
            
            cashflow_per_sqm: toBase(data.financial?.cashflowPerSqm),
            major_maintenance_done: data.financial?.majorMaintenanceDone,
            owns_land: data.financial?.ownsLand,
            underhållsplan: data.financial?.underhållsplan,
            // Physical data
            planlösning: data.physical?.planlösning || null,
            kitchen: data.physical?.kitchen || null,
            bathroom: data.physical?.bathroom || null,
            bedrooms: data.physical?.bedrooms || null,
            surfaces: data.physical?.surfaces || null,
            förvaring: data.physical?.förvaring || null,
            ljusinsläpp: data.physical?.ljusinsläpp || null,
            balcony: data.physical?.balcony || null,
            // Comments
            planlösning_comment: data.physical?.planlösning_comment,
            kitchen_comment: data.physical?.kitchen_comment,
            bathroom_comment: data.physical?.bathroom_comment,
            bedrooms_comment: data.physical?.bedrooms_comment,
            surfaces_comment: data.physical?.surfaces_comment,
            förvaring_comment: data.physical?.förvaring_comment,
            ljusinsläpp_comment: data.physical?.ljusinsläpp_comment,
            balcony_comment: data.physical?.balcony_comment,
            comments: data.physical?.comments,
            is_draft: false
          });

        if (error) throw error;
        console.log('Evaluation created successfully');
      }
      navigate('/evaluations');
    } catch (err) {
      console.error('Error saving evaluation:', err);
    }
  };

  const handleCompare = () => {
    navigate('/compare');
  };

  const handleEditAddress = () => {
    setEditedAddress(data.address || '');
    setIsEditingAddress(true);
  };

  const handleSaveAddress = () => {
    if (editedAddress.trim()) {
      updateAddress(editedAddress.trim());
    }
    setIsEditingAddress(false);
  };

  const handleCancelAddressEdit = () => {
    setIsEditingAddress(false);
    setEditedAddress('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <div className="text-foreground">Laddar utvärdering...</div>
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
          {/* Top navigation with title */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
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
            
            <h2 className="text-xl font-bold text-foreground">
              Lägenhetsutvärdering
            </h2>
            
            <div className="w-20"></div> {/* Spacer for balance */}
          </div>

           {/* Address display */}
           {data.address && (
             <div className="max-w-md mx-auto mb-6">
               <div className="flex items-center gap-3 p-4 bg-primary rounded-lg border-2 border-primary shadow-lg">
                 <MapPin className="h-5 w-5 text-primary-foreground flex-shrink-0" />
                 <div className="flex-1 min-w-0">
                   {isEditingAddress ? (
                     <div className="space-y-2">
                       <Input
                         value={editedAddress}
                         onChange={(e) => setEditedAddress(e.target.value)}
                         placeholder="Ange adress"
                         className="text-sm"
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                             handleSaveAddress();
                           } else if (e.key === 'Escape') {
                             handleCancelAddressEdit();
                           }
                         }}
                         autoFocus
                       />
                       <div className="flex gap-2">
                         <Button
                           size="sm"
                           onClick={handleSaveAddress}
                           className="h-6 px-2 text-xs"
                         >
                           Spara
                         </Button>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={handleCancelAddressEdit}
                           className="h-6 px-2 text-xs"
                         >
                           Avbryt
                         </Button>
                       </div>
                     </div>
                   ) : (
                     <>
                       <p className="text-sm font-semibold text-primary-foreground">{data.address}</p>
                       <p className="text-xs text-primary-foreground/80">Adress för utvärdering</p>
                     </>
                   )}
                 </div>
                 {!isEditingAddress && (
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={handleEditAddress}
                     className="p-2 hover:bg-primary-foreground/20 text-primary-foreground flex-shrink-0"
                     title="Redigera adress"
                   >
                     <Edit className="h-5 w-5" />
                   </Button>
                 )}
               </div>
             </div>
           )}

           {/* Navigation Toggle */}
           <EvaluationNavigationToggle 
             activeTab={activeTab}
             onTabChange={setActiveTab}
           />
           
           {/* Content based on active tab */}
           {activeTab === 'input' && (
             <div className="space-y-3 mb-8">
               {evaluationSections.map((section, index) => {
                 const IconComponent = section.icon;
                 
                  const renderProgressIndicator = (progress: { filled: number, total: number }) => {
                    const percentage = progress.total > 0 ? Math.round((progress.filled / progress.total) * 100) : 0;
                    
                    return (
                      <div className="flex flex-col items-end gap-1 min-w-[60px]">
                        <div className="text-xs text-muted-foreground">
                          {progress.filled}/{progress.total}
                        </div>
                        <div className="w-12 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  };
                 
                 return (
                    <Card 
                      key={section.title} 
                      className="group overflow-hidden bg-card border transition-all duration-300 hover:shadow-md hover:bg-hover hover:border-hover shadow-sm cursor-pointer h-20"
                      onClick={() => navigate(section.path)}
                    >
                     <div className="w-full p-3 flex items-center gap-4 text-left transition-all duration-300">
                       {/* Icon - Left */}
                        <div className="p-2 rounded-lg flex-shrink-0 bg-primary/10 group-hover:bg-hover-foreground/20">
                          <IconComponent className="h-5 w-5 text-primary group-hover:text-hover-foreground" />
                       </div>
                       
                       {/* Text - Center */}
                       <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold group-hover:text-hover-foreground mb-1 truncate">
                            {section.title}
                          </h3>
                          <p className="text-xs text-muted-foreground group-hover:text-hover-foreground/70 line-clamp-2">
                           {section.description}
                         </p>
                       </div>
                       
                        {/* Progress - Right */}
                        <div className="flex-shrink-0">
                          {renderProgressIndicator(section.progress)}
                        </div>
                     </div>
                   </Card>
                 );
               })}
               
             </div>
           )}

           {activeTab === 'evaluation' && (
              <div className="space-y-4 mb-8">
                {/* Lägenhetsdata */}
                <Card className="bg-card border shadow-md">
                  <div className="p-4">
                     <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                       <div className="p-2 rounded-lg bg-primary/10">
                         <Building className="h-5 w-5 text-primary" />
                       </div>
                       Lägenhetsdata
                     </h3>
                    {hasLägenhetsdata() ? (
                      <div className="space-y-2">
                        {data.address && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Adress:</span>
                            <span className="text-sm font-medium text-foreground">{data.address}</span>
                          </div>
                        )}
                        {data.general?.size && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Boarea:</span>
                            <span className="text-sm font-medium text-foreground">{formatDisplayValue(data.general.size, 'area')}</span>
                          </div>
                        )}
                        {data.general?.rooms && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Antal rum:</span>
                            <span className="text-sm font-medium text-foreground">{formatDisplayValue(data.general.rooms, 'rooms')}</span>
                          </div>
                        )}
                        {data.general?.price && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Pris:</span>
                            <span className="text-sm font-medium text-foreground">{formatDisplayValue(data.general.price, 'price')}</span>
                          </div>
                        )}
                        {data.general?.finalPrice && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Slutpris:</span>
                            <span className="text-sm font-medium text-foreground">{formatDisplayValue(data.general.finalPrice, 'price')}</span>
                          </div>
                        )}
                         {data.general?.monthlyFee && (
                           <div className="flex justify-between py-2 border-b border-border/30">
                             <span className="text-sm text-muted-foreground">Avgift:</span>
                             <span className="text-sm font-medium text-foreground">{formatDisplayValue(data.general.monthlyFee, 'fee')}</span>
                           </div>
                         )}
                         {data.general?.price && data.general?.size && (
                           <div className="flex justify-between py-2 border-b border-border/30 bg-secondary/30 px-2 rounded">
                             <span className="text-sm font-medium text-foreground">Pris per kvm:</span>
                             <span className="text-sm font-bold text-foreground">{formatDisplayValue(Math.round(parseInt(data.general.price.replace(/\s/g, '')) / parseInt(data.general.size)), 'price_per_sqm')}</span>
                           </div>
                         )}
                         {data.general?.monthlyFee && data.general?.size && (
                           <div className="flex justify-between py-2 bg-secondary/30 px-2 rounded">
                             <span className="text-sm font-medium text-foreground">Avgift per kvm:</span>
                             <span className="text-sm font-bold text-foreground">{formatDisplayValue(Math.round(parseInt(data.general.monthlyFee.replace(/\s/g, '')) / parseInt(data.general.size)), 'fee_per_sqm')}</span>
                           </div>
                         )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Ingen information tillagd</p>
                    )}
                  </div>
                </Card>

                {/* Föreningsinformation */}
                <Card className="bg-card border shadow-md">
                  <div className="p-4">
                     <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                       <div className="p-2 rounded-lg bg-primary/10">
                         <BarChart3 className="h-5 w-5 text-primary" />
                       </div>
                       Föreningsinformation
                     </h3>
                    {hasFöreningsinformation() ? (
                      <div className="space-y-2">
                        {data.financial?.debtPerSqm && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Skuldsättning:</span>
                            <span className="text-sm font-medium text-foreground">{formatDisplayValue(data.financial.debtPerSqm, 'debt_per_sqm')}</span>
                          </div>
                        )}
                        {data.financial?.cashflowPerSqm && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Kassaflöde per kvm:</span>
                            <span className="text-sm font-medium text-foreground">{formatDisplayValue(data.financial.cashflowPerSqm, 'fee_per_sqm')}</span>
                          </div>
                        )}
                        {data.financial?.majorMaintenanceDone !== undefined && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Stora renoveringar genomförda:</span>
                            <span className="text-sm font-medium text-foreground">{data.financial.majorMaintenanceDone ? 'Ja' : 'Nej'}</span>
                          </div>
                        )}
                        {data.financial?.ownsLand !== undefined && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Äger mark:</span>
                            <span className="text-sm font-medium text-foreground">{data.financial.ownsLand ? 'Ja' : 'Nej (tomträtt)'}</span>
                          </div>
                        )}
                        {data.financial?.underhållsplan && (
                          <div className="py-2">
                            <span className="text-sm text-muted-foreground block mb-1">Underhållsplan:</span>
                            <span className="text-sm font-medium text-foreground">{data.financial.underhållsplan}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Ingen information tillagd</p>
                    )}
                  </div>
                </Card>

                 {/* Lägenhetsbedömning */}
                 <Card className="bg-card border shadow-md">
                   <div className="p-4">
                       <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                         <div className="p-2 rounded-lg bg-primary/10">
                           <FileText className="h-5 w-5 text-primary" />
                         </div>
                         Lägenhetsbedömning
                       </h3>
                    {hasBedömning() ? (
                      <div className="space-y-2">
                        {data.physical?.planlösning && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Planlösning:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.planlösning}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.kitchen && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Kök:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.kitchen}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.bathroom && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Badrum:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.bathroom}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.bedrooms && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Sovrum:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.bedrooms}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.surfaces && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Ytor:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.surfaces}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.förvaring && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Förvaring:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.förvaring}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.ljusinsläpp && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Ljusinsläpp:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.ljusinsläpp}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.balcony && (
                          <div className="flex justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Balkong/Uteplats:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.balcony}/5 ⭐</span>
                          </div>
                        )}
                        {physicalAverage > 0 && (
                          <div className="flex justify-between py-2 border-b border-border/30 bg-secondary/30 px-2 rounded">
                            <span className="text-sm font-medium text-foreground">Genomsnittlig bedömning:</span>
                            <span className="text-sm font-bold text-foreground">{physicalAverage.toFixed(1)}/5 ⭐</span>
                          </div>
                        )}
                        {data.physical?.comments && (
                          <div className="py-2">
                            <span className="text-sm text-muted-foreground block mb-1">Mina anteckningar:</span>
                            <span className="text-sm font-medium text-foreground">{data.physical.comments}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Ingen information tillagd</p>
                    )}
                  </div>
                </Card>

                {/* Comments input */}
                {hasBedömning() && (
                  <Card className="bg-card border shadow-md">
                    <div className="p-4">
                      <div className="space-y-2">
                        <Label htmlFor="comments" className="text-sm font-medium text-foreground">
                          Redigera slutkommentarer
                        </Label>
                        <Textarea
                          id="comments"
                          value={data.physical?.comments || ''}
                          onChange={(e) => {
                            updatePhysicalData({ comments: e.target.value });
                          }}
                          placeholder="Lägg till dina reflektioner och slutsatser om lägenheten..."
                          className="min-h-[80px] resize-none text-sm"
                        />
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

           {activeTab === 'comparison' && currentEvaluationId && (
              <div className="mb-8">
                <AutoComparisonWidget evaluationId={currentEvaluationId} />
              </div>
            )}
           
           {/* Action buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Save className="h-4 w-4 mr-2" />
              Spara
            </Button>
            
            <Button
              onClick={handleCompare}
              variant="outline"
              className="flex-1 h-12"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Slutför
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationHub;