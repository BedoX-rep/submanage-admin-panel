
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

const supabaseUrl = "https://vbcdgubnvbilavetsjlr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiY2RndWJudmJpbGF2ZXRzamxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTE4MDYsImV4cCI6MjA2MDY2NzgwNn0.aNeLdgw7LTsVl73gzKIjxT5w0AyT99x1bh-BSV3HeCQ";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiY2RndWJudmJpbGF2ZXRzamxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5MTgwNiwiZXhwIjoyMDYwNjY3ODA2fQ.OfQhLyYVcXpJOcU_LpuoD1tvG_NjpoUN3GebVko-3qU";

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
