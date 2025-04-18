
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
};

export type User = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
};

// These URLs will be provided by Supabase once you connect your project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a client with the service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return data?.is_admin || false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
