import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { supabaseAdmin, Subscription, User } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, isAfter } from "date-fns";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Filter,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { updateSubscription, deleteSubscription } from "@/lib/subscription-utils";
import { SubscriptionActions } from "@/components/SubscriptionActions";

const ITEMS_PER_PAGE = 10;

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all", // Changed from empty string to "all"
    type: "all",   // Changed from empty string to "all"
  });
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Form state for editing
  const [form, setForm] = useState({
    subscription_type: "",
    subscription_status: "",
    end_date: "",
    trial_used: false,
    is_recurring: false,
  });

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      let query = supabaseAdmin
        .from("subscriptions")
        .select("*", { count: "exact" });

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`);
      }

      if (filters.status && filters.status !== "all") { // Changed condition
        query = query.eq("subscription_status", filters.status);
      }

      if (filters.type && filters.type !== "all") { // Changed condition
        query = query.eq("subscription_type", filters.type);
      }

      // Calculate pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      setSubscriptions(data || []);
      
      if (count !== null) {
        setTotalCount(count);
        setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load subscriptions",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [currentPage, searchTerm, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleEdit = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setForm({
      subscription_type: subscription.subscription_type,
      subscription_status: subscription.subscription_status,
      end_date: new Date(subscription.end_date).toISOString().split("T")[0],
      trial_used: subscription.trial_used,
      is_recurring: subscription.is_recurring,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleViewDetails = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleUpdateSubscription = async () => {
    if (!selectedSubscription || !form) return;

    try {
      await updateSubscription(selectedSubscription.id, {
        subscription_type: form.subscription_type as any,
        subscription_status: form.subscription_status as any,
        is_recurring: form.is_recurring,
        end_date: form.end_date,
      });

      toast({
        title: "Success",
        description: "Subscription updated successfully",
      });

      await fetchSubscriptions();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update subscription",
      });
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    try {
      await deleteSubscription(subscriptionId);
      toast({
        title: "Success",
        description: "Subscription deleted successfully",
      });
      await fetchSubscriptions();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete subscription",
      });
    }
  };

  const renderStatusBadge = (status: Subscription["subscription_status"]) => {
    switch (status) {
      case "Active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "Suspended":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Suspended
          </Badge>
        );
      case "Cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-admin-primary">Subscriptions</h1>
        </div>
        
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by email or name..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center">
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Trial">Trial</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({ status: "all", type: "all" }); // Changed from empty string to "all"
                setSearchTerm("");
              }}
              className="gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Auto-renew</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-admin-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{subscription.display_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {subscription.subscription_type}
                      </Badge>
                      {subscription.trial_used && (
                        <Badge variant="secondary" className="ml-2">
                          Trial Used
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(subscription.subscription_status)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={subscription.is_recurring ? "default" : "outline"}>
                        {subscription.is_recurring ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(subscription.start_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {format(new Date(subscription.end_date), "MMM d, yyyy")}
                        {isAfter(new Date(subscription.end_date), new Date()) ? (
                          <Badge variant="outline" className="bg-green-50">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50">Expired</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <SubscriptionActions
                        subscription={subscription}
                        onView={handleViewDetails}
                        onEdit={handleEdit}
                        onDelete={handleDeleteSubscription}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Subscription Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditing
                  ? "Edit Subscription"
                  : `Subscription Details`}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the subscription information below."
                  : `Viewing details for ${selectedSubscription?.display_name}'s subscription.`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="subscription-type">Subscription Type</Label>
                    <Select
                      value={form.subscription_type}
                      onValueChange={(value) =>
                        setForm({ ...form, subscription_type: value })
                      }
                    >
                      <SelectTrigger id="subscription-type">
                        <SelectValue placeholder="Select subscription type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Trial">Trial</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Lifetime">Lifetime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subscription-status">Status</Label>
                    <Select
                      value={form.subscription_status}
                      onValueChange={(value) =>
                        setForm({ ...form, subscription_status: value })
                      }
                    >
                      <SelectTrigger id="subscription-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={form.end_date}
                      onChange={(e) =>
                        setForm({ ...form, end_date: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="trial-used"
                      checked={form.trial_used}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, trial_used: checked })
                      }
                    />
                    <Label htmlFor="trial-used">Trial Used</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-renew"
                      checked={form.is_recurring}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, is_recurring: checked })
                      }
                    />
                    <Label htmlFor="auto-renew">Auto-renew Subscription</Label>
                  </div>
                </>
              ) : (
                selectedSubscription && (
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium">User:</div>
                      <div>{selectedSubscription.display_name} ({selectedSubscription.email})</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Subscription Type:</div>
                      <div>{selectedSubscription.subscription_type}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Status:</div>
                      <div className="flex items-center">
                        {renderStatusBadge(selectedSubscription.subscription_status)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Start Date:</div>
                      <div>
                        {format(new Date(selectedSubscription.start_date), "MMMM d, yyyy")}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">End Date:</div>
                      <div>
                        {format(new Date(selectedSubscription.end_date), "MMMM d, yyyy")}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Trial Used:</div>
                      <div>{selectedSubscription.trial_used ? "Yes" : "No"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Created At:</div>
                      <div>
                        {format(new Date(selectedSubscription.created_at), "MMMM d, yyyy HH:mm")}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <DialogFooter>
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateSubscription}>Save Changes</Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      if (selectedSubscription) {
                        handleEdit(selectedSubscription);
                      }
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Close
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Subscriptions;
