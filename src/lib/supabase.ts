
import { createClient } from "@supabase/supabase-js";

export type Subscription = {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  start_date: string;
  end_date: string;
  subscription_type: "Trial" | "Monthly" | "Quarterly" | "Lifetime";
  trial_used: boolean;
  subscription_status: "Active" | "Suspended" | "Cancelled";
  created_at: string;
  is_recurring: boolean;
};

export type User = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
};

// Use the variables from the client.ts file which is properly set up
const SUPABASE_URL = "https://uhzjrtfppzvsuvekcrda.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoempydGZwcHp2c3V2ZWtjcmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MTYyOTQsImV4cCI6MjA1OTE5MjI5NH0.nczNPVysOG3bi2Us7jzypXOZGpv31MYiV-AMdXQZWuU";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoempydGZwcHp2c3V2ZWtjcmRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzYxNjI5NCwiZXhwIjoyMDU5MTkyMjk0fQ.15ORNpZqOIbV03CVz_YYdqjATS-FFdFCYwLHeqduZXQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create a client with the service role key for admin operations
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // Get user data directly from auth.users using the admin client
    const { data, error } = await supabaseAdmin
      .auth
      .admin
      .getUserById(userId);

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    // Check if user_metadata contains is_admin flag
    return data?.user?.user_metadata?.is_admin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
