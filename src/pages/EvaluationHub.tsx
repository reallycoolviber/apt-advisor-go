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
import { ArrowLeft, Home, FileText, Building, BarChart3, Save, GitCompare, Minus, MapPin, Euro, Star, Edit } from 'lucide-react';
import EvaluationComparison from '@/components/EvaluationComparison';
import EvaluationNavigationToggle from '@/components/EvaluationNavigationToggle';
import { supabase } from '@/integrations/supabase/client';
import cityscapeNeutral from '@/assets/cityscape-neutral.png';

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
  
  console.log('EvaluationHub: hooks initialized successfully');
  console.log('EvaluationHub: Current data:', data);
  console.log('EvaluationHub: User:', user);

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
            loadEvaluation(evaluation);
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

  const evaluationSections = [
    {
      title: 'Lägenhetsdata',
      description: 'Grundläggande information om lägenheten',
      icon: Building,
      path: '/evaluate/general',
      completed: getCompletionStatus('general')
    },
    {
      title: 'Föreningsanalys',
      description: 'Ekonomisk information och föreningsdata',
      icon: BarChart3,
      path: '/evaluate/financial',
      completed: getCompletionStatus('financial')
    },
    {
      title: 'Din bedömning av lägenheten',
      description: 'Bedömning av lägenhets kvalitet och egenskaper',
      icon: FileText,
      path: '/evaluate/physical',
      completed: getCompletionStatus('physical')
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
              size: data.general?.size ? parseFloat(data.general.size) : null,
              rooms: data.general?.rooms || null,
              price: data.general?.price ? parseFloat(data.general.price) : null,
              final_price: data.general?.finalPrice ? parseFloat(data.general.finalPrice) : null,
              monthly_fee: data.general?.monthlyFee ? parseFloat(data.general.monthlyFee) : null,
              debt_per_sqm: data.financial?.debtPerSqm ? parseFloat(data.financial.debtPerSqm) : null,
              fee_per_sqm: data.financial?.feePerSqm ? parseFloat(data.financial.feePerSqm) : null,
              cashflow_per_sqm: data.financial?.cashflowPerSqm ? parseFloat(data.financial.cashflowPerSqm) : null,
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
              size: data.general?.size ? parseFloat(data.general.size) : null,
              rooms: data.general?.rooms || null,
              price: data.general?.price ? parseFloat(data.general.price) : null,
              final_price: data.general?.finalPrice ? parseFloat(data.general.finalPrice) : null,
              monthly_fee: data.general?.monthlyFee ? parseFloat(data.general.monthlyFee) : null,
              debt_per_sqm: data.financial?.debtPerSqm ? parseFloat(data.financial.debtPerSqm) : null,
              fee_per_sqm: data.financial?.feePerSqm ? parseFloat(data.financial.feePerSqm) : null,
              cashflow_per_sqm: data.financial?.cashflowPerSqm ? parseFloat(data.financial.cashflowPerSqm) : null,
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
            size: data.general?.size ? parseFloat(data.general.size) : null,
            rooms: data.general?.rooms || null,
            price: data.general?.price ? parseFloat(data.general.price) : null,
            final_price: data.general?.finalPrice ? parseFloat(data.general.finalPrice) : null,
            monthly_fee: data.general?.monthlyFee ? parseFloat(data.general.monthlyFee) : null,
            // Financial data
            debt_per_sqm: data.financial?.debtPerSqm ? parseFloat(data.financial.debtPerSqm) : null,
            fee_per_sqm: data.financial?.feePerSqm ? parseFloat(data.financial.feePerSqm) : null,
            cashflow_per_sqm: data.financial?.cashflowPerSqm ? parseFloat(data.financial.cashflowPerSqm) : null,
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
            size: data.general?.size ? parseFloat(data.general.size) : null,
            rooms: data.general?.rooms || null,
            price: data.general?.price ? parseFloat(data.general.price) : null,
            final_price: data.general?.finalPrice ? parseFloat(data.general.finalPrice) : null,
            monthly_fee: data.general?.monthlyFee ? parseFloat(data.general.monthlyFee) : null,
            // Financial data
            debt_per_sqm: data.financial?.debtPerSqm ? parseFloat(data.financial.debtPerSqm) : null,
            fee_per_sqm: data.financial?.feePerSqm ? parseFloat(data.financial.feePerSqm) : null,
            cashflow_per_sqm: data.financial?.cashflowPerSqm ? parseFloat(data.financial.cashflowPerSqm) : null,
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
                className="p-2 hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-2 hover:bg-accent"
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
                 
                 const renderStatusCheckbox = (status: string) => {
                   if (status === 'completed') {
                     return <Checkbox checked={true} className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />;
                   } else if (status === 'in-progress') {
                     return (
                       <div className="relative w-4 h-4 border-2 border-primary rounded-sm flex items-center justify-center bg-background">
                         <Minus className="h-2 w-2 text-primary" />
                       </div>
                     );
                   } else {
                     return <Checkbox checked={false} />;
                   }
                 };
                 
                 return (
                   <Card 
                     key={section.title} 
                     className="group overflow-hidden bg-card border transition-all duration-300 hover:shadow-md hover:bg-accent hover:border-accent shadow-sm cursor-pointer"
                     onClick={() => navigate(section.path)}
                   >
                     <div className="w-full p-3 flex items-center gap-4 text-left transition-all duration-300">
                       {/* Icon - Left */}
                       <div className="p-2 rounded-lg flex-shrink-0 bg-primary/10 group-hover:bg-accent-foreground/20">
                         <IconComponent className="h-5 w-5 text-primary group-hover:text-accent-foreground" />
                       </div>
                       
                       {/* Text - Center */}
                       <div className="flex-1 min-w-0">
                         <h3 className="text-sm font-semibold group-hover:text-accent-foreground mb-1 truncate">
                           {section.title}
                         </h3>
                         <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/70 line-clamp-2">
                           {section.description}
                         </p>
                       </div>
                       
                       {/* Status - Right */}
                       <div className="flex-shrink-0">
                         {renderStatusCheckbox(section.completed)}
                       </div>
                     </div>
                   </Card>
                 );
               })}
               
               {/* Progress section under input cards */}
               <Card className="bg-card border shadow-md mt-6">
                 <div className="p-4">
                   <h3 className="font-semibold text-foreground mb-4 text-center">
                     Framsteg
                   </h3>
                   
                   <div className="space-y-3">
                     {evaluationSections.map((section) => {
                       const IconComponent = section.icon;
                       const completed = section.completed === 'completed';
                       const inProgress = section.completed === 'in-progress';
                       
                       return (
                         <div key={section.title} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                           <div className={`p-1 rounded ${completed ? 'bg-green-100' : inProgress ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                             <IconComponent className={`h-4 w-4 ${completed ? 'text-green-600' : inProgress ? 'text-yellow-600' : 'text-gray-500'}`} />
                           </div>
                           <div className="flex-1">
                             <p className="text-sm font-medium text-foreground">{section.title}</p>
                             <p className="text-xs text-muted-foreground">
                               {completed ? 'Slutförd' : inProgress ? 'Påbörjad' : 'Ej påbörjad'}
                             </p>
                           </div>
                           <div className="flex-shrink-0">
                             {completed && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                             {inProgress && <div className="w-2 h-2 bg-yellow-500 rounded-full" />}
                             {!completed && !inProgress && <div className="w-2 h-2 bg-gray-300 rounded-full" />}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               </Card>
             </div>
           )}

           {activeTab === 'evaluation' && hasAnyData && (
             <Card className="bg-card border shadow-md mb-8">
               <div className="p-4">
                 <h3 className="font-semibold text-foreground mb-4 text-center">
                   Sammanfattning
                 </h3>
                 
                 {/* Overview Cards */}
                 <div className="space-y-3 mb-4">
                   {data.address && (
                     <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                       <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-medium text-foreground">{data.address}</p>
                         <p className="text-xs text-muted-foreground">
                           {data.general?.size && `${data.general.size} kvm`} 
                           {data.general?.rooms && ` • ${data.general.rooms} rum`}
                         </p>
                       </div>
                     </div>
                   )}
                   
                   {(data.general?.price || data.general?.monthlyFee) && (
                     <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                       <Euro className="h-4 w-4 text-primary flex-shrink-0" />
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-medium text-foreground">
                           {data.general?.price ? `${parseInt(data.general.price).toLocaleString()} SEK` : 'Inget pris angivet'}
                         </p>
                         <p className="text-xs text-muted-foreground">
                           {data.general?.monthlyFee && `${parseInt(data.general.monthlyFee).toLocaleString()} SEK/mån`}
                         </p>
                       </div>
                     </div>
                   )}
                   
                   {physicalAverage > 0 && (
                     <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                       <Star className="h-4 w-4 text-primary flex-shrink-0" />
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-medium text-foreground">
                           Fysisk bedömning: {physicalAverage.toFixed(1)}/5
                         </p>
                         <div className="flex gap-1 mt-1">
                           {[1, 2, 3, 4, 5].map((star) => (
                             <span
                               key={star}
                               className={`text-xs ${star <= physicalAverage ? 'text-yellow-400' : 'text-muted-foreground'}`}
                             >
                               ★
                             </span>
                           ))}
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
                 
                 {/* Comments */}
                 <div className="space-y-2">
                   <Label htmlFor="comments" className="text-sm font-medium text-foreground">
                     Slutkommentarer
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

           {activeTab === 'comparison' && (
             <div className="mb-8">
               <EvaluationComparison 
                 currentEvaluationId={currentEvaluationId}
                 currentData={data}
               />
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
              Jämför
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationHub;