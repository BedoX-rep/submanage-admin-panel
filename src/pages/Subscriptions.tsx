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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SubscriptionPlan, checkAndRenewSubscriptions, updateSubscription, deleteSubscription, removeSubscription } from "@/lib/subscription-utils";
import { SubscriptionActions } from "@/components/SubscriptionActions";
import { SubscriptionDatePicker } from "@/components/SubscriptionDatePicker";
import { cn } from "@/lib/utils";
import { SubscriptionDetails } from "@/components/SubscriptionDetails";
import { SubscriptionViewModal } from "@/components/SubscriptionViewModal";

const ITEMS_PER_PAGE = 10;

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
  });

  const { toast } = useToast();

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

  const [viewingSubscription, setViewingSubscription] = useState<Subscription | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  // Check if subscription is expired
  const checkSubscriptionStatus = (subscription: Subscription) => {
    if (subscription.end_date && new Date(subscription.end_date) < new Date() && !subscription.is_recurring) {
      return updateSubscription(subscription.id, {
        subscription_status: "Expired"
      });
    }
  };

  // Add to useEffect
  useEffect(() => {
    subscriptions.forEach(checkSubscriptionStatus);
  }, [subscriptions]);

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Subscriptions
          </h1>
          <Button 
            onClick={async () => {
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
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Renewals
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by email or name..."
                className="pl-10 bg-gray-50 border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-[150px] bg-gray-50 border-gray-200">
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
            
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger className="w-[150px] bg-gray-50 border-gray-200">
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
            
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({ status: "all", type: "all" });
                setSearchTerm("");
              }}
              className="gap-1 border-gray-200 hover:bg-gray-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="py-3 font-semibold text-gray-600">User</TableHead>
                <TableHead className="font-semibold text-gray-600">Subscription</TableHead>
                <TableHead className="font-semibold text-gray-600">Dates</TableHead>
                <TableHead className="font-semibold text-gray-600">Status</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow 
                    key={subscription.id} 
                    className={cn(
                      "hover:bg-gray-50/50 transition-colors",
                      subscription.subscription_status === "Expired" && "bg-red-50/30",
                      subscription.subscription_status === "Active" && "bg-green-50/30"
                    )}
                  >
                    <TableCell className="py-4">
                      <SubscriptionDetails 
                        subscription={subscription}
                        onUpdate={fetchSubscriptions}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col gap-2">
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
                          <SelectTrigger className="w-[120px] bg-gray-50 border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Trial">Trial</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                            <SelectItem value="Lifetime">Lifetime</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="flex items-center gap-2">
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
                          <span className="text-sm text-gray-600">Auto-renew</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-gray-500">Start</span>
                          <SubscriptionDatePicker
                            date={subscription.start_date ? new Date(subscription.start_date) : null}
                            onSelect={async (date) => {
                              try {
                                await updateSubscription(subscription.id, {
                                  start_date: date.toISOString()
                                });
                                await fetchSubscriptions();
                              } catch (error) {
                                toast({
                                  variant: "destructive",
                                  title: "Error",
                                  description: "Failed to update start date"
                                });
                              }
                            }}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-gray-500">End</span>
                          <SubscriptionDatePicker
                            date={subscription.end_date ? new Date(subscription.end_date) : null}
                            onSelect={async (date) => {
                              try {
                                await updateSubscription(subscription.id, {
                                  end_date: date.toISOString()
                                });
                                await fetchSubscriptions();
                                await checkSubscriptionStatus(subscription);
                              } catch (error) {
                                toast({
                                  variant: "destructive",
                                  title: "Error",
                                  description: "Failed to update end date"
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>

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
                        <SelectTrigger className={cn(
                          "w-[120px] border-gray-200",
                          subscription.subscription_status === "Active" && "bg-green-50 text-green-700",
                          subscription.subscription_status === "Expired" && "bg-red-50 text-red-700",
                          subscription.subscription_status === "Suspended" && "bg-amber-50 text-amber-700",
                          subscription.subscription_status === "Cancelled" && "bg-gray-50 text-gray-700",
                        )}>
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
                    
                    <TableCell className="text-right">
                      <SubscriptionActions
                        subscription={subscription}
                        onDelete={handleDeleteSubscription}
                        onRemove={handleRemoveSubscription}
                        onView={() => setViewingSubscription(subscription)}
                        onEdit={() => setEditingSubscription(subscription)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="border-gray-200 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="border-gray-200 hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <SubscriptionViewModal
          subscription={viewingSubscription}
          onClose={() => setViewingSubscription(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default Subscriptions;
