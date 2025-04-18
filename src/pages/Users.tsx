
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { supabaseAdmin, User } from "@/lib/supabase";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { 
  CheckCircle, 
  XCircle, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  Search,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const ITEMS_PER_PAGE = 10;

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Use a function that the service role key has access to
      let query = supabaseAdmin
        .from("users")
        .select("id, email, created_at, last_sign_in_at, is_admin", { count: "exact" });

      if (searchTerm) {
        query = query.ilike("email", `%${searchTerm}%`);
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

      setUsers(data || []);
      
      if (count !== null) {
        setTotalCount(count);
        setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      const { error } = await supabaseAdmin
        .from("users")
        .update({ is_admin: !isCurrentlyAdmin })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Admin privileges ${isCurrentlyAdmin ? "removed" : "granted"}`,
      });

      // Update the local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_admin: !isCurrentlyAdmin } : user
      ));
      
      // If we're in the user dialog, update the selected user as well
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, is_admin: !isCurrentlyAdmin });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user",
      });
    }
  };

  const getSubscriptionCountForUser = async (userId: string): Promise<number> => {
    try {
      const { count, error } = await supabaseAdmin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error("Error getting subscription count:", error);
      return 0;
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      // Get subscription count
      const subscriptionCount = await getSubscriptionCountForUser(userId);
      
      if (selectedUser) {
        // Add subscription count to the user object
        setSelectedUser({
          ...selectedUser,
          subscriptionCount,
        } as any);
      }
    } catch (error) {
      console.error("Error loading user details:", error);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      loadUserDetails(selectedUser.id);
    }
  }, [selectedUser]);

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-admin-primary mb-6">Users</h1>
        
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm("");
            }}
            className="gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-admin-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at
                        ? format(new Date(user.last_sign_in_at), "MMM d, yyyy")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {user.is_admin ? (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewUser(user)}
                        >
                          <span className="sr-only">View details</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                        >
                          <span className="sr-only">
                            {user.is_admin ? "Remove admin" : "Make admin"}
                          </span>
                          {user.is_admin ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Shield className="h-4 w-4 text-blue-500" />
                          )}
                        </Button>
                      </div>
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

        {/* User Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">User ID:</div>
                  <div className="text-sm bg-muted p-2 rounded overflow-x-auto">
                    {selectedUser.id}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Email:</div>
                  <div>{selectedUser.email}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Created:</div>
                  <div>
                    {format(new Date(selectedUser.created_at), "MMMM d, yyyy HH:mm")}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Last Sign In:</div>
                  <div>
                    {selectedUser.last_sign_in_at
                      ? format(new Date(selectedUser.last_sign_in_at), "MMMM d, yyyy HH:mm")
                      : "Never"}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Subscriptions:</div>
                  <div>
                    {(selectedUser as any).subscriptionCount !== undefined
                      ? (selectedUser as any).subscriptionCount
                      : "Loading..."}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="admin-toggle"
                    checked={selectedUser.is_admin}
                    onCheckedChange={() => handleToggleAdmin(selectedUser.id, selectedUser.is_admin)}
                  />
                  <Label htmlFor="admin-toggle">Admin Privileges</Label>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Users;
