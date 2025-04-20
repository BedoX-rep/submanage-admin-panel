
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseAdmin, Subscription } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { SubscriptionActions } from "@/components/SubscriptionActions";
import { assignSubscription, updateSubscription, deleteSubscription, removeSubscription } from "@/lib/subscription-utils";

const Subscriptions = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/login");
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchSubscriptions();
    }
  }, [user, isAdmin]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      let query = supabaseAdmin.from("subscriptions").select("*");
      
      // Apply filters based on the selected tab
      if (selectedTab === "active") {
        query = query.eq("subscription_status", "Active");
      } else if (selectedTab === "inactive") {
        query = query.eq("subscription_status", "inActive");
      } else if (selectedTab === "expired") {
        query = query.eq("subscription_status", "Expired");
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch subscriptions. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      await deleteSubscription(id);
      toast({
        title: "Success",
        description: "Subscription deleted successfully",
      });
      fetchSubscriptions();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete subscription",
      });
    }
  };

  const handleRemoveSubscription = async (id: string) => {
    try {
      await removeSubscription(id);
      toast({
        title: "Success",
        description: "Subscription deactivated successfully",
      });
      fetchSubscriptions();
    } catch (error) {
      console.error("Error deactivating subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deactivate subscription",
      });
    }
  };

  const handleViewSubscription = (subscription: Subscription) => {
    setCurrentSubscription(subscription);
    setViewModalOpen(true);
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setCurrentSubscription(subscription);
    setModalOpen(true);
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      sub.email.toLowerCase().includes(searchLower) ||
      sub.display_name.toLowerCase().includes(searchLower) ||
      sub.subscription_type.toLowerCase().includes(searchLower) ||
      sub.subscription_status.toLowerCase().includes(searchLower)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-admin-primary">Subscriptions</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchSubscriptions}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex justify-between mb-6">
          <Input
            placeholder="Search subscriptions..."
            className="max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-admin-primary"></div>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No subscriptions found
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredSubscriptions.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    onView={handleViewSubscription}
                    onEdit={handleEditSubscription}
                    onDelete={handleDeleteSubscription}
                    onRemove={handleRemoveSubscription}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {/* Same content structure as "all" tab */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-admin-primary"></div>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active subscriptions found
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredSubscriptions.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    onView={handleViewSubscription}
                    onEdit={handleEditSubscription}
                    onDelete={handleDeleteSubscription}
                    onRemove={handleRemoveSubscription}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inactive" className="space-y-4">
            {/* Similar structure for inactive subscriptions */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-admin-primary"></div>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No inactive subscriptions found
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredSubscriptions.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    onView={handleViewSubscription}
                    onEdit={handleEditSubscription}
                    onDelete={handleDeleteSubscription}
                    onRemove={handleRemoveSubscription}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-4">
            {/* Similar structure for expired subscriptions */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-admin-primary"></div>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expired subscriptions found
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredSubscriptions.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    onView={handleViewSubscription}
                    onEdit={handleEditSubscription}
                    onDelete={handleDeleteSubscription}
                    onRemove={handleRemoveSubscription}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal components would be here */}
      </div>
    </AdminLayout>
  );
};

const SubscriptionCard = ({
  subscription,
  onView,
  onEdit,
  onDelete,
  onRemove,
}: {
  subscription: Subscription;
  onView: (subscription: Subscription) => void;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onRemove: (id: string) => void;
}) => {
  return (
    <Card className={
      subscription.subscription_status === "Active"
        ? "border-l-4 border-l-green-500"
        : subscription.subscription_status === "inActive"
        ? "border-l-4 border-l-amber-500"
        : subscription.subscription_status === "Expired"
        ? "border-l-4 border-l-red-500"
        : ""
    }>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          {subscription.display_name || "Unknown User"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{subscription.email}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan:</span>
            <span className="font-medium">{subscription.subscription_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className={
              subscription.subscription_status === "Active"
                ? "text-green-500"
                : subscription.subscription_status === "inActive"
                ? "text-amber-500"
                : subscription.subscription_status === "Expired"
                ? "text-red-500"
                : ""
            }>
              {subscription.subscription_status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recurring:</span>
            <span>{subscription.is_recurring ? "Yes" : "No"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expires:</span>
            <span>{subscription.end_date ? format(parseISO(subscription.end_date), "PP") : "N/A"}</span>
          </div>
        </div>

        <SubscriptionActions
          subscription={subscription}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onRemove={onRemove}
        />
      </CardContent>
    </Card>
  );
};

export default Subscriptions;
