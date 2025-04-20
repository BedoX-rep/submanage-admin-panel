
import { supabaseAdmin } from "@/lib/supabase";
import { addDays } from "date-fns";

export type SubscriptionPlan = "Trial" | "Monthly" | "Quarterly" | "Lifetime";

export const SUBSCRIPTION_DURATIONS: Record<SubscriptionPlan, number> = {
  Trial: 7,
  Monthly: 30,
  Quarterly: 90,
  Lifetime: 365 * 200, // 200 years
};

export async function assignSubscription(
  userId: string,
  email: string,
  displayName: string,
  plan: SubscriptionPlan,
  isRecurring: boolean = false
) {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + (SUBSCRIPTION_DURATIONS[plan] * 24 * 60 * 60 * 1000));

  // First, check if user has used trial before
  const { data: existingData } = await supabaseAdmin
    .from("subscriptions")
    .select("trial_used")
    .eq("user_id", userId)
    .single();

  const hasUsedTrial = existingData?.trial_used || false;

  // Then create new subscription with precise timestamps
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      user_id: userId,
      email,
      display_name: displayName,
      subscription_type: plan,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      is_recurring: isRecurring,
      trial_used: plan === "Trial" || hasUsedTrial,
      subscription_status: "Active"
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateSubscription(
  subscriptionId: string,
  updates: Partial<{
    subscription_type: SubscriptionPlan;
    subscription_status: "Active" | "inActive" | "Expired" | "Suspended" | "Cancelled";
    is_recurring: boolean;
    start_date: string;
    end_date: string;
    trial_used: boolean;
    email: string;
    display_name: string;
  }>
) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update(updates)
    .eq("id", subscriptionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteSubscription(subscriptionId: string) {
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .delete()
    .eq("id", subscriptionId);

  if (error) {
    throw error;
  }
}

export async function removeSubscription(subscriptionId: string) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      start_date: null,
      end_date: null,
      subscription_type: null,
      subscription_status: "inActive"
    })
    .eq("id", subscriptionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
