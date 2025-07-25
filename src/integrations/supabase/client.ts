// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nysfnvsjufhfrnglayqn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2ZudnNqdWZoZnJuZ2xheXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjgyODIsImV4cCI6MjA2NzQwNDI4Mn0.o1T-HZpaqavDpM0L2j2yIkcRecUkdcBAld8Py-tF6fs";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});