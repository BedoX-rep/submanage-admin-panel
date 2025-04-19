
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
  // Calculate exact end date based on current time
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

export async function checkAndRenewSubscriptions() {
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
  
  // Check for expired subscriptions (non-recurring and past end date)
  const { data: expiredSubscriptions, error: expiredError } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("subscription_status", "Active")
    .eq("is_recurring", false)
    .lt("end_date", now.toISOString());

  if (expiredError) {
    console.error("Error checking expired subscriptions:", expiredError);
  } else if (expiredSubscriptions) {
    for (const subscription of expiredSubscriptions) {
      try {
        await updateSubscription(subscription.id, {
          subscription_status: "Expired"
        });
      } catch (error) {
        console.error(`Error updating expired subscription ${subscription.id}:`, error);
      }
    }
  }

  // Get all active recurring subscriptions that end within the next 2 hours
  const { data: subscriptionsToRenew, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("is_recurring", true)
    .eq("subscription_status", "Active")
    .lt("end_date", twoHoursFromNow);
    
  if (error) {
    console.error("Error checking subscriptions for renewal:", error);
    return { success: false, error };
  }
  
  if (!subscriptionsToRenew || subscriptionsToRenew.length === 0) {
    return { success: true, renewed: 0, expired: expiredSubscriptions?.length || 0 };
  }
  
  let renewedCount = 0;
  
  // Process each subscription
  for (const subscription of subscriptionsToRenew) {
    try {
      const plan = subscription.subscription_type as SubscriptionPlan;
      const newEndDate = addDays(now, SUBSCRIPTION_DURATIONS[plan]);
      
      // Update the subscription
      await updateSubscription(subscription.id, {
        start_date: now.toISOString(),
        end_date: newEndDate.toISOString()
      });
      
      renewedCount++;
    } catch (error) {
      console.error(`Error renewing subscription ${subscription.id}:`, error);
    }
  }
  
  // Trigger a page refresh after processing is complete
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
  
  return { 
    success: true, 
    renewed: renewedCount,
    expired: expiredSubscriptions?.length || 0 
  };
}
