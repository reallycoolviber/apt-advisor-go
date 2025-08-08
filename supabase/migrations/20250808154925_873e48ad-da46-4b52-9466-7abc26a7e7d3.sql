-- Add checklist column to apartment_evaluations table
ALTER TABLE public.apartment_evaluations 
ADD COLUMN checklist JSONB DEFAULT '[]';

-- Add index for better performance on checklist queries
CREATE INDEX idx_apartment_evaluations_checklist ON public.apartment_evaluations USING GIN(checklist);

-- Update existing evaluations to include their checklist data
UPDATE public.apartment_evaluations 
SET checklist = (
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'category', item_category,
        'index', item_index,
        'text', item_text,
        'checked', is_checked,
        'comment', comment
      ) ORDER BY item_category, item_index
    ), 
    '[]'::json
  )
  FROM checklist_items 
  WHERE checklist_items.evaluation_id = apartment_evaluations.id
);