"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlanBadge } from "../_components/plan-badge";
import { useAdminConfirm, AdminConfirmDialog } from "@/components/admin/password-confirm";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Eye,
  MessageCircle,
  Trash2,
  Loader2,
} from "lucide-react";

interface User {
  id: string;
  full_name: string | null;
  email: string;
  plan_tier: string | null;
  created_at: string;
  avatar_url: string | null;
  phone_number: string | null;
}

function UserInitials({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name ?? ""} className="w-8 h-8 rounded-full object-cover" />
    );
  }
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
      {initials}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Sheet state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Message dialog
  const [messageUser, setMessageUser] = useState<User | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Plan updating
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);

  const { confirm, dialogProps } = useAdminConfirm();

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams({
        search,
        plan,
        sort,
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? []);
        setTotal(data.total ?? 0);
      } else {
        setFetchError(true);
        toast.error("Failed to load users");
      }
    } catch (e) {
      console.error("[Admin/Users] fetch error:", e);
      setFetchError(true);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, plan, sort, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {}, 300);
  }

  async function handleSetPlan(userId: string, newPlan: string) {
    const ok = await confirm(`set plan to ${newPlan}`);
    if (!ok) return;
    setUpdatingPlan(userId);
    try {
      const res = await fetch("/api/admin/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan: newPlan }),
      });
      if (!res.ok) throw new Error("Failed to update plan");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, plan_tier: newPlan === "free" ? "FREE" : newPlan === "pro" ? "PRO" : "TEAMS" }
            : u
        )
      );
      toast.success(`Plan updated to ${newPlan}`);
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setUpdatingPlan(null);
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) return;
    const ok = await confirm(`delete ${selectedUser.full_name ?? "this user"}`);
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("User deleted");
      setDeleteDialogOpen(false);
      setSheetOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSendMessage() {
    if (!messageUser || !messageText.trim()) return;
    const ok = await confirm(`send message to ${messageUser.full_name ?? "user"}`);
    if (!ok) return;
    setSendingMessage(true);
    try {
      const res = await fetch("/api/admin/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: messageUser.id, message: messageText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      toast.success(`Message sent to ${messageUser.full_name ?? "user"}`);
      setMessageDialogOpen(false);
      setMessageText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "name", label: "Name" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-headline font-bold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500 font-label mt-1">
          {total.toLocaleString()} total users
        </p>
      </div>

      {/* Filters */}
      <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 bg-white border-0 rounded-xl"
          />
        </div>

        {/* Plan tabs */}
        <Tabs value={plan} onValueChange={(v) => { setPlan(v); setPage(1); }}>
          <TabsList className="bg-white">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="free">Free</TabsTrigger>
            <TabsTrigger value="pro">Pro</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white border-0 rounded-xl">
              {sortOptions.find((s) => s.value === sort)?.label ?? "Sort"}
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {sortOptions.map((s) => (
              <DropdownMenuItem key={s.value} onClick={() => { setSort(s.value); setPage(1); }}>
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e4e2e1]">
                {["User", "Email", "Phone", "Plan", "Joined", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left py-3 px-4 text-xs font-label font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="p-3">
                        <Skeleton className="h-10 rounded-xl" />
                      </td>
                    </tr>
                  ))
                : users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-[#e4e2e1]/50 last:border-0 hover:bg-white/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <UserInitials name={u.full_name} avatarUrl={u.avatar_url} />
                          <span className="font-label font-medium text-slate-800 truncate max-w-[120px]">
                            {u.full_name ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-[160px]">
                        {u.email || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {u.phone_number ?? "—"}
                      </td>
                      <td className="py-3 px-4">
                        <PlanBadge plan={u.plan_tier ?? "free"} />
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {/* Plan dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs rounded-lg border-slate-200"
                                disabled={updatingPlan === u.id}
                              >
                                {updatingPlan === u.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    Plan <ChevronDown className="w-3 h-3 ml-1" />
                                  </>
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleSetPlan(u.id, "free")}>
                                Free
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSetPlan(u.id, "pro")}>
                                Pro
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSetPlan(u.id, "teams")}>
                                Teams
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* View button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 rounded-lg"
                            onClick={() => {
                              setSelectedUser(u);
                              setSheetOpen(true);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {/* Message button (only if phone starts with 966) */}
                          {u.phone_number?.startsWith("966") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 rounded-lg text-green-600"
                              onClick={() => {
                                setMessageUser(u);
                                setMessageDialogOpen(true);
                              }}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              {!loading && fetchError && (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-label">
                    <p className="text-red-500 font-semibold mb-2">Failed to load users</p>
                    <button
                      onClick={() => fetchUsers()}
                      className="text-xs text-indigo-600 dark:text-indigo-400 underline hover:no-underline"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              )}
              {!loading && !fetchError && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-label">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e4e2e1]">
            <p className="text-xs text-slate-500 font-label">
              Page {page} of {totalPages} · {total} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User View Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md bg-background">
          <SheetTitle className="sr-only">User Details</SheetTitle>
          {selectedUser && (
            <div className="space-y-6 pt-4">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <UserInitials
                  name={selectedUser.full_name}
                  avatarUrl={selectedUser.avatar_url}
                />
                <div>
                  <h2 className="text-lg font-headline font-bold text-slate-900">
                    {selectedUser.full_name ?? "Unknown"}
                  </h2>
                  <PlanBadge plan={selectedUser.plan_tier ?? "free"} />
                </div>
              </div>

              {/* Details */}
              <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-4 space-y-3">
                {[
                  { label: "Email", value: selectedUser.email || "—" },
                  { label: "Phone", value: selectedUser.phone_number ?? "—" },
                  { label: "User ID", value: selectedUser.id },
                  { label: "Joined", value: formatDate(selectedUser.created_at) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-start gap-2">
                    <span className="text-xs font-label font-semibold text-slate-500 uppercase tracking-wide">
                      {item.label}
                    </span>
                    <span className="text-sm text-slate-800 font-label text-right break-all max-w-[200px]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stats placeholder */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Memories", value: 0 },
                  { label: "Plans", value: 0 },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-slate-900">{s.value}</p>
                    <p className="text-xs text-slate-500 font-label">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Danger zone */}
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <h3 className="text-sm font-label font-bold text-red-700 mb-1">Danger Zone</h3>
                <p className="text-xs text-red-500 mb-3">
                  Permanently delete this account and all associated data.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete Account
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{selectedUser?.full_name ?? "this user"}&apos;s</strong> account and all
              associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminConfirmDialog {...dialogProps} />

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send WhatsApp Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-500 font-label">
              Sending to:{" "}
              <strong className="text-slate-800">
                {messageUser?.full_name ?? messageUser?.phone_number}
              </strong>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="message-text">Message</Label>
              <Textarea
                id="message-text"
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
