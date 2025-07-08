-- Add user profile fields to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS buyer_type TEXT CHECK (buyer_type IN ('buyer', 'agent', 'investor')),
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- The profiles table already has RLS enabled and the basic trigger
-- Add policies for the new columns if they don't exist
DO $$
BEGIN
    -- Check if policies already exist, if not create them
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" 
        ON public.profiles 
        FOR SELECT 
        USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON public.profiles 
        FOR UPDATE 
        USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can create their own profile'
    ) THEN
        CREATE POLICY "Users can create their own profile" 
        ON public.profiles 
        FOR INSERT 
        WITH CHECK (auth.uid() = id);
    END IF;
END
$$;