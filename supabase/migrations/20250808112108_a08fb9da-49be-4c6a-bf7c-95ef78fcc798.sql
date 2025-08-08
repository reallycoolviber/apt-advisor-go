-- Lägg till source_id kolumn för att identifiera unika lägenheter
ALTER TABLE apartment_evaluations 
ADD COLUMN source_id text;

-- Lägg till index för snabbare sökningar baserat på source_id och user_id
CREATE INDEX idx_apartment_evaluations_source_id_user ON apartment_evaluations(source_id, user_id);

-- Lägg till en unik constraint för att förhindra dubbletter per användare
-- En användare kan bara ha en utvärdering per unique source_id
ALTER TABLE apartment_evaluations 
ADD CONSTRAINT unique_user_source_evaluation 
UNIQUE (user_id, source_id);