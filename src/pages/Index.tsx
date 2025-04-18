
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListChecks, AlertCircle } from "lucide-react";
import { supabaseAdmin, Subscription, User } from "@/lib/supabase";

const Index = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    suspendedSubscriptions: 0,
    cancelledSubscriptions: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/login");
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      const fetchStats = async () => {
        try {
          // Get total users
          const { count: totalUsers } = await supabaseAdmin
            .from("users")
            .select("*", { count: "exact", head: true });

          // Get subscription stats
          const { data: subscriptions } = await supabaseAdmin
            .from("subscriptions")
            .select("subscription_status");

          const activeCount = subscriptions?.filter(
            (sub) => sub.subscription_status === "Active"
          ).length || 0;
          
          const suspendedCount = subscriptions?.filter(
            (sub) => sub.subscription_status === "Suspended"
          ).length || 0;
          
          const cancelledCount = subscriptions?.filter(
            (sub) => sub.subscription_status === "Cancelled"
          ).length || 0;

          setStats({
            totalUsers: totalUsers || 0,
            totalSubscriptions: subscriptions?.length || 0,
            activeSubscriptions: activeCount,
            suspendedSubscriptions: suspendedCount,
            cancelledSubscriptions: cancelledCount,
          });
        } catch (error) {
          console.error("Error fetching stats:", error);
        } finally {
          setIsLoadingStats(false);
        }
      };

      fetchStats();
    }
  }, [user, isAdmin]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-admin-primary mb-6">Dashboard</h1>

        {isLoadingStats ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-admin-primary"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-admin-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Registered users in the system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Subscriptions
                </CardTitle>
                <ListChecks className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((stats.activeSubscriptions / stats.totalSubscriptions) * 100 || 0).toFixed(1)}% of all subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Inactive Subscriptions
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.suspendedSubscriptions + stats.cancelledSubscriptions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.suspendedSubscriptions} suspended, {stats.cancelledSubscriptions} cancelled
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <Button onClick={() => navigate("/subscriptions")} className="bg-admin-primary hover:bg-admin-secondary">
              Manage Subscriptions
            </Button>
            <Button onClick={() => navigate("/users")} variant="outline">
              Manage Users
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Index;
