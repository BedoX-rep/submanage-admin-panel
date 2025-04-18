
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://uhzjrtfppzvsuvekcrda.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoempydGZwcHp2c3V2ZWtjcmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MTYyOTQsImV4cCI6MjA1OTE5MjI5NH0.nczNPVysOG3bi2Us7jzypXOZGpv31MYiV-AMdXQZWuU";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
