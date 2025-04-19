
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Subscription } from "@/lib/supabase";
import { format } from "date-fns";

interface SubscriptionViewModalProps {
  subscription: Subscription | null;
  onClose: () => void;
}

export function SubscriptionViewModal({ subscription, onClose }: SubscriptionViewModalProps) {
  if (!subscription) return null;

  return (
    <Dialog open={!!subscription} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subscription Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">User</div>
              <div className="mt-1">{subscription.display_name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Email</div>
              <div className="mt-1">{subscription.email}</div>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-500">Start Date</div>
            <div className="mt-1">{subscription.start_date ? format(new Date(subscription.start_date), "PPP HH:mm:ss") : "Not set"}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-500">End Date</div>
            <div className="mt-1">{subscription.end_date ? format(new Date(subscription.end_date), "PPP HH:mm:ss") : "Not set"}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-500">Status</div>
            <div className="mt-1">{subscription.subscription_status}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-500">Type</div>
            <div className="mt-1">{subscription.subscription_type || "None"}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-500">Created At</div>
            <div className="mt-1">{format(new Date(subscription.created_at), "PPP HH:mm:ss")}</div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500">Trial Status</div>
              <div className="mt-1">{subscription.trial_used ? "Used" : "Available"}</div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500">Auto Renewal</div>
              <div className="mt-1">{subscription.is_recurring ? "Enabled" : "Disabled"}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
