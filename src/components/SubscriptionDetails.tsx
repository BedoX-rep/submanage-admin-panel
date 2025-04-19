
import React from 'react';
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Subscription } from "@/lib/supabase";
import { updateSubscription } from "@/lib/subscription-utils";
import { SubscriptionDatePicker } from "./SubscriptionDatePicker";

interface SubscriptionDetailsProps {
  subscription: Subscription;
  onUpdate: () => Promise<void>;
}

export function SubscriptionDetails({ subscription, onUpdate }: SubscriptionDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          value={subscription.display_name}
          onChange={async (e) => {
            await updateSubscription(subscription.id, {
              display_name: e.target.value
            });
            onUpdate();
          }}
          className="font-medium bg-transparent border-transparent hover:border-gray-200 focus:border-purple-500 focus:bg-white"
        />
        <Input
          value={subscription.email}
          onChange={async (e) => {
            await updateSubscription(subscription.id, {
              email: e.target.value
            });
            onUpdate();
          }}
          className="text-sm text-gray-500 bg-transparent border-transparent hover:border-gray-200 focus:border-purple-500 focus:bg-white"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={
          subscription.trial_used 
            ? "bg-orange-100 text-orange-800 hover:bg-orange-100" 
            : "bg-green-100 text-green-800 hover:bg-green-100"
        }>
          Trial {subscription.trial_used ? "Used" : "Available"}
        </Badge>
        <span className="text-xs text-gray-400">
          Created: {format(new Date(subscription.created_at), "MMM d, yyyy HH:mm:ss")}
        </span>
      </div>
    </div>
  );
}
