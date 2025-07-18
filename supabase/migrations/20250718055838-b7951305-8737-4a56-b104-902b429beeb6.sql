-- Create table for saved comparisons
CREATE TABLE public.saved_comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  selected_evaluations TEXT[] NOT NULL, -- Array of evaluation IDs
  selected_fields TEXT[] NOT NULL, -- Array of field keys
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_comparisons ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own saved comparisons" 
ON public.saved_comparisons 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own saved comparisons" 
ON public.saved_comparisons 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own saved comparisons" 
ON public.saved_comparisons 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own saved comparisons" 
ON public.saved_comparisons 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_saved_comparisons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_comparisons_updated_at
BEFORE UPDATE ON public.saved_comparisons
FOR EACH ROW
EXECUTE FUNCTION public.update_saved_comparisons_updated_at();