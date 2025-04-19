
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Ban, Trash2 } from "lucide-react";
import type { Subscription } from "@/lib/supabase";
import { AlertConfirmDialog } from "./AlertConfirmDialog";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  return (
    <>
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
          onClick={() => setIsRemoveDialogOpen(true)}
          className="text-amber-500 hover:text-amber-600"
        >
          <span className="sr-only">Remove Subscription</span>
          <Ban className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="text-red-500 hover:text-red-600"
        >
          <span className="sr-only">Delete</span>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <AlertConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          onDelete(subscription.id);
          setIsDeleteDialogOpen(false);
        }}
        title="Delete Subscription"
        description="Are you sure you want to delete this subscription? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      <AlertConfirmDialog
        isOpen={isRemoveDialogOpen}
        onClose={() => setIsRemoveDialogOpen(false)}
        onConfirm={() => {
          onRemove(subscription.id);
          setIsRemoveDialogOpen(false);
        }}
        title="Remove Subscription"
        description="Are you sure you want to suspend this subscription?"
        confirmText="Remove"
        cancelText="Cancel"
      />
    </>
  );
}
