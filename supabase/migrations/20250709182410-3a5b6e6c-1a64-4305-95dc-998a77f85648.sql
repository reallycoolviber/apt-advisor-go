-- Add comment fields for individual ratings in apartment_evaluations table
ALTER TABLE public.apartment_evaluations 
ADD COLUMN planlösning_comment TEXT,
ADD COLUMN kitchen_comment TEXT,
ADD COLUMN bathroom_comment TEXT,
ADD COLUMN bedrooms_comment TEXT,
ADD COLUMN surfaces_comment TEXT,
ADD COLUMN förvaring_comment TEXT,
ADD COLUMN ljusinsläpp_comment TEXT,
ADD COLUMN balcony_comment TEXT;

-- Add draft functionality
ALTER TABLE public.apartment_evaluations 
ADD COLUMN is_draft BOOLEAN DEFAULT FALSE;

-- Add index for better performance when filtering drafts
CREATE INDEX idx_apartment_evaluations_is_draft ON public.apartment_evaluations(is_draft);
CREATE INDEX idx_apartment_evaluations_user_draft ON public.apartment_evaluations(user_id, is_draft);