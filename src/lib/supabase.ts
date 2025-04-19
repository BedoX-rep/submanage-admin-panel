
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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a client with the service role key for admin operations
export const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : supabase;

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(userId);

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return user?.user_metadata?.is_admin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
