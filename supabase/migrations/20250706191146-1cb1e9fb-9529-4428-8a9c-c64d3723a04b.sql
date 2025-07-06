
-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create apartment evaluations table
CREATE TABLE public.apartment_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  
  -- Auto input data
  apartment_url TEXT,
  annual_report_url TEXT,
  
  -- General info
  address TEXT,
  size DECIMAL,
  price DECIMAL,
  rooms TEXT,
  monthly_fee DECIMAL,
  
  -- Physical assessment (1-5 ratings)
  planlösning INTEGER CHECK (planlösning >= 1 AND planlösning <= 5),
  kitchen INTEGER CHECK (kitchen >= 1 AND kitchen <= 5),
  bathroom INTEGER CHECK (bathroom >= 1 AND bathroom <= 5),
  bedrooms INTEGER CHECK (bedrooms >= 1 AND bedrooms <= 5),
  surfaces INTEGER CHECK (surfaces >= 1 AND surfaces <= 5),
  förvaring INTEGER CHECK (förvaring >= 1 AND förvaring <= 5),
  ljusinsläpp INTEGER CHECK (ljusinsläpp >= 1 AND ljusinsläpp <= 5),
  balcony INTEGER CHECK (balcony >= 1 AND balcony <= 5),
  
  -- Financial data
  debt_per_sqm DECIMAL,
  fee_per_sqm DECIMAL,
  cashflow_per_sqm DECIMAL,
  owns_land BOOLEAN,
  underhållsplan TEXT,
  
  -- Summary
  comments TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apartment_evaluations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create RLS policies for apartment evaluations
CREATE POLICY "Users can view their own evaluations" 
  ON public.apartment_evaluations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own evaluations" 
  ON public.apartment_evaluations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evaluations" 
  ON public.apartment_evaluations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evaluations" 
  ON public.apartment_evaluations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
