import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { supabaseAdmin, Subscription } from "@/lib/supabase";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isAfter, parseISO } from "date-fns";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  updateSubscription, 
  deleteSubscription, 
  removeSubscription, 
  SubscriptionPlan, 
  checkAndRenewSubscriptions 
} from "@/lib/subscription-utils";
import { SubscriptionActions } from "@/components/SubscriptionActions";
import { cn } from "@/lib/utils";

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
    status: "all",
    type: "all",
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

      if (filters.status && filters.status !== "all") {
        query = query.eq("subscription_status", filters.status);
      }

      if (filters.type && filters.type !== "all") {
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

  // Poll for subscriptions that need renewal every hour
  useEffect(() => {
    const renewalCheck = async () => {
      try {
        const result = await checkAndRenewSubscriptions();
        if (result.renewed > 0) {
          console.log(`Renewed ${result.renewed} subscriptions`);
          fetchSubscriptions(); // Refresh the list after renewals
        }
      } catch (error) {
        console.error("Error during subscription renewal check:", error);
      }
    };

    // Run immediately and then every hour
    renewalCheck();
    const interval = setInterval(renewalCheck, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, []);

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
      const updates = {
        subscription_type: form.subscription_type as SubscriptionPlan,
        subscription_status: form.subscription_status as any,
        is_recurring: form.is_recurring,
        end_date: form.end_date,
        trial_used: form.subscription_type === "Trial" || form.trial_used
      };

      await updateSubscription(selectedSubscription.id, updates);

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

  const handleRemoveSubscription = async (subscriptionId: string) => {
    try {
      await removeSubscription(subscriptionId);
      toast({
        title: "Success",
        description: "Subscription removed successfully",
      });
      await fetchSubscriptions();
    } catch (error) {
      console.error("Error removing subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove subscription",
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

  const DatePickerField = ({ 
    date, 
    onChange, 
    label = "Date",
    disabled = false
  }: { 
    date: string | null, 
    onChange: (date: string) => void, 
    label?: string,
    disabled?: boolean 
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {date ? format(parseISO(date), "MMM d, yyyy") : <span>Select date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="single"
          selected={date ? parseISO(date) : undefined}
          onSelect={(selectedDate) => {
            if (selectedDate) {
              onChange(selectedDate.toISOString());
            }
          }}
          initialFocus
          className="pointer-events-auto p-3"
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-admin-primary">Subscriptions</h1>
          <Button onClick={async () => {
            try {
              const result = await checkAndRenewSubscriptions();
              toast({
                title: "Renewal Check",
                description: `Checked for renewals: ${result.renewed} subscriptions renewed`,
              });
              if (result.renewed > 0) {
                fetchSubscriptions();
              }
            } catch (error) {
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to check subscriptions for renewal",
              });
            }
          }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Renewals
          </Button>
        </div>

        {/* Search and filters with improved styling */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
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
                  <SelectItem value="inActive">Inactive</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
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
                setFilters({ status: "all", type: "all" });
                setSearchTerm("");
              }}
              className="gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </div>

        {/* Table with improved styling */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="py-3">User</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-admin-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.id} className="hover:bg-gray-50">
                    {/* User Column */}
                    <TableCell className="max-w-[250px]">
                      <div className="space-y-1">
                        <Input
                          value={subscription.display_name}
                          onChange={async (e) => {
                            try {
                              await updateSubscription(subscription.id, {
                                display_name: e.target.value
                              });
                              await fetchSubscriptions();
                            } catch (error) {
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: "Failed to update display name"
                              });
                            }
                          }}
                          className="font-medium mb-1"
                        />
                        <Input
                          value={subscription.email}
                          onChange={async (e) => {
                            try {
                              await updateSubscription(subscription.id, {
                                email: e.target.value
                              });
                              await fetchSubscriptions();
                            } catch (error) {
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: "Failed to update email"
                              });
                            }
                          }}
                          className="text-sm text-muted-foreground"
                        />
                      </div>
                    </TableCell>

                    {/* Subscription Details Column */}
                    <TableCell>
                      <div className="flex flex-row gap-4 items-center">
                        <Select
                          value={subscription.subscription_type || ""}
                          onValueChange={async (value) => {
                            try {
                              await updateSubscription(subscription.id, {
                                subscription_type: value as SubscriptionPlan,
                                trial_used: value === "Trial" || subscription.trial_used
                              });
                              await fetchSubscriptions();
                            } catch (error) {
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: "Failed to update subscription type"
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Trial">Trial</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                            <SelectItem value="Lifetime">Lifetime</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={subscription.is_recurring}
                            onCheckedChange={async (checked) => {
                              try {
                                await updateSubscription(subscription.id, {
                                  is_recurring: checked
                                });
                                await fetchSubscriptions();
                              } catch (error) {
                                toast({
                                  variant: "destructive",
                                  title: "Error",
                                  description: "Failed to update auto-renew"
                                });
                              }
                            }}
                          />
                          <span className="text-sm">Auto-renew</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Dates Column */}
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium w-20">Start:</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-[200px] justify-start text-left font-normal"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {subscription.start_date ? 
                                  format(new Date(subscription.start_date), "MMM d, yyyy HH:mm:ss") 
                                  : <span>Select date & time</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4" align="start">
                              <div className="space-y-2">
                                <CalendarComponent
                                  mode="single"
                                  selected={subscription.start_date ? new Date(subscription.start_date) : undefined}
                                  onSelect={async (date) => {
                                    if (date) {
                                      const current = subscription.start_date ? new Date(subscription.start_date) : new Date();
                                      date.setHours(current.getHours(), current.getMinutes(), current.getSeconds());
                                      try {
                                        await updateSubscription(subscription.id, {
                                          start_date: date.toISOString()
                                        });
                                        fetchSubscriptions();
                                      } catch (error) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: "Failed to update start date"
                                        });
                                      }
                                    }
                                  }}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                                <div className="flex gap-2">
                                  <Input
                                    type="time"
                                    step="1"
                                    defaultValue={subscription.start_date ? 
                                      format(new Date(subscription.start_date), "HH:mm:ss") :
                                      format(new Date(), "HH:mm:ss")
                                    }
                                    onChange={async (e) => {
                                      const [hours, minutes, seconds] = e.target.value.split(':').map(Number);
                                      const date = subscription.start_date ? new Date(subscription.start_date) : new Date();
                                      date.setHours(hours, minutes, seconds);
                                      try {
                                        await updateSubscription(subscription.id, {
                                          start_date: date.toISOString()
                                        });
                                        fetchSubscriptions();
                                      } catch (error) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: "Failed to update start time"
                                        });
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium w-20">End:</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-[200px] justify-start text-left font-normal",
                                  subscription.end_date && isAfter(new Date(subscription.end_date), new Date())
                                    ? "text-green-600"
                                    : "text-red-600"
                                )}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {subscription.end_date ? 
                                  format(new Date(subscription.end_date), "MMM d, yyyy HH:mm:ss")
                                  : <span>Select date & time</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4" align="start">
                              <div className="space-y-2">
                                <CalendarComponent
                                  mode="single"
                                  selected={subscription.end_date ? new Date(subscription.end_date) : undefined}
                                  onSelect={async (date) => {
                                    if (date) {
                                      const current = subscription.end_date ? new Date(subscription.end_date) : new Date();
                                      date.setHours(current.getHours(), current.getMinutes(), current.getSeconds());
                                      try {
                                        await updateSubscription(subscription.id, {
                                          end_date: date.toISOString()
                                        });
                                        fetchSubscriptions();
                                      } catch (error) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: "Failed to update end date"
                                        });
                                      }
                                    }
                                  }}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                                <div className="flex gap-2">
                                  <Input
                                    type="time"
                                    step="1"
                                    defaultValue={subscription.end_date ? 
                                      format(new Date(subscription.end_date), "HH:mm:ss") :
                                      format(new Date(), "HH:mm:ss")
                                    }
                                    onChange={async (e) => {
                                      const [hours, minutes, seconds] = e.target.value.split(':').map(Number);
                                      const date = subscription.end_date ? new Date(subscription.end_date) : new Date();
                                      date.setHours(hours, minutes, seconds);
                                      try {
                                        await updateSubscription(subscription.id, {
                                          end_date: date.toISOString()
                                        });
                                        fetchSubscriptions();
                                      } catch (error) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: "Failed to update end time"
                                        });
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status Column */}
                    <TableCell>
                      <Select
                        value={subscription.subscription_status}
                        onValueChange={async (value) => {
                          try {
                            await updateSubscription(subscription.id, {
                              subscription_status: value as any
                            });
                            await fetchSubscriptions();
                          } catch (error) {
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: "Failed to update status"
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="inActive">Inactive</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="text-right">
                      <SubscriptionActions
                        subscription={subscription}
                        onView={handleViewDetails}
                        onEdit={handleEdit}
                        onDelete={handleDeleteSubscription}
                        onRemove={handleRemoveSubscription}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination with improved styling */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-lg shadow-sm">
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

        {/* Details Dialog */}
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
                      onValueChange={(value) => {
                        const startDate = new Date();
                        let endDate = new Date();

                        switch(value) {
                          case "Trial":
                            endDate.setDate(startDate.getDate() + 7);
                            break;
                          case "Monthly":
                            endDate.setDate(startDate.getDate() + 31);
                            break;
                          case "Quarterly":
                            endDate.setDate(startDate.getDate() + 90);
                            break;
                          case "Lifetime":
                            endDate.setFullYear(startDate.getFullYear() + 200);
                            break;
                        }

                        setForm({
                          ...form,
                          subscription_type: value,
                          subscription_status: "Active",
                          trial_used: value === "Trial" ? true : form.trial_used,
                          end_date: endDate.toISOString().split('T')[0]
                        });

                        // Also update the subscription with the new dates
                        if (selectedSubscription) {
                          updateSubscription(selectedSubscription.id, {
                            subscription_type: value as SubscriptionPlan,
                            subscription_status: "Active",
                            start_date: startDate.toISOString(),
                            end_date: endDate.toISOString()
                          });
                        }
                      }}
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
                    <Label htmlFor="end-date">End Date</Label>
                    <DatePickerField
                      date={form.end_date ? new Date(form.end_date).toISOString() : null}
                      onChange={(date) => setForm({ ...form, end_date: new Date(date).toISOString().split('T')[0] })}
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