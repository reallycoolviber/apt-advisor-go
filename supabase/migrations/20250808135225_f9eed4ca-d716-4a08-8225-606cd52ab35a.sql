-- Add unique constraint on user_id, item_category, item_index combination
-- This will allow the upsert operation to work properly
ALTER TABLE public.checklist_items 
ADD CONSTRAINT checklist_items_user_category_index_unique 
UNIQUE (user_id, item_category, item_index);