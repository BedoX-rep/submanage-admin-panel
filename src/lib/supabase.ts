
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
  subscription_status: "Active" | "inActive" | "Expired" | "Suspended" | "Cancelled";
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

// Hard-coded values for the Lovable environment
// Replace these with your actual Supabase project details
const supabaseUrl = "https://uhzjrtfppzvsuvekcrda.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoempydGZwcHp2c3V2ZWtjcmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MTYyOTQsImV4cCI6MjA1OTE5MjI5NH0.nczNPVysOG3bi2Us7jzypXOZGpv31MYiV-AMdXQZWuU";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoempydGZwcHp2c3V2ZWtjcmRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzYxNjI5NCwiZXhwIjoyMDU5MTkyMjk0fQ.7G0LmDsw0uQGWeU90eJrHrR2X-6zHU_IrQQD6TVFS-w";

// Create client instances
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a client with the service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .auth
      .admin
      .getUserById(userId);

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return data?.user?.user_metadata?.is_admin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
