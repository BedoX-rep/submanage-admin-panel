
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
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
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
