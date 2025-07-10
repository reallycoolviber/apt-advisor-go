-- Add final_price field to apartment_evaluations table
ALTER TABLE public.apartment_evaluations 
ADD COLUMN final_price numeric;

-- Add major_maintenance_done field for the new maintenance question
ALTER TABLE public.apartment_evaluations 
ADD COLUMN major_maintenance_done boolean;