
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye, Ban } from "lucide-react";
import type { Subscription } from "@/lib/supabase";

interface SubscriptionActionsProps {
  subscription: Subscription;
  onView: (subscription: Subscription) => void;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onRemove: (id: string) => void;
}

export function SubscriptionActions({
  subscription,
  onView,
  onEdit,
  onDelete,
  onRemove,
}: SubscriptionActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onView(subscription)}
      >
        <span className="sr-only">View details</span>
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(subscription)}
      >
        <span className="sr-only">Edit</span>
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(subscription.id)}
        className="text-amber-500 hover:text-amber-600"
      >
        <span className="sr-only">Remove Subscription</span>
        <Ban className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(subscription.id)}
        className="text-red-500 hover:text-red-600"
      >
        <span className="sr-only">Delete</span>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
