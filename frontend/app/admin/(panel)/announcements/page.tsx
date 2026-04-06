"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Loader2, Eye } from "lucide-react";
import { useAdminConfirm, AdminConfirmDialog } from "@/components/admin/password-confirm";

interface Announcement {
  id: string;
  title: string;
  message: string;
  target: string;
  channel: string;
  sent_at: string | null;
  sent_count: number;
  created_at: string;
}

function ChannelBadge({ channel }: { channel: string }) {
  const styles: Record<string, string> = {
    whatsapp: "bg-green-100 text-green-700",
    banner: "bg-blue-100 text-blue-700",
    both: "bg-purple-100 text-purple-700",
  };
  const labels: Record<string, string> = {
    whatsapp: "WhatsApp",
    banner: "Banner",
    both: "Both",
  };
  const key = channel.toLowerCase();
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-label font-bold ${styles[key] ?? "bg-slate-100 text-slate-600"}`}
    >
      {labels[key] ?? channel}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewAnnouncement, setViewAnnouncement] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { confirm, dialogProps } = useAdminConfirm();

  // Form
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formTarget, setFormTarget] = useState("all");
  const [formChannel, setFormChannel] = useState("banner");

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) setAnnouncements(await res.json());
      else toast.error("Failed to load announcements");
    } catch (e) {
      console.error("[Admin/Announcements] fetch error:", e);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function handleCreate() {
    if (!formTitle.trim() || !formMessage.trim()) {
      toast.error("Title and message are required");
      return;
    }
    const ok = await confirm("send this announcement");
    if (!ok) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          message: formMessage,
          target: formTarget,
          channel: formChannel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      if (formChannel === "whatsapp" || formChannel === "both") {
        toast.success(`Sent to ${data.sent_count} users via WhatsApp`);
      } else {
        toast.success("Banner announcement queued");
      }
      setCreateOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setFormTitle("");
    setFormMessage("");
    setFormTarget("all");
    setFormChannel("banner");
  }

  const targetLabel = (t: string) => {
    const map: Record<string, string> = { all: "All Users", free: "Free", pro: "Pro", teams: "Teams" };
    return map[t] ?? t;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500 font-label mt-1">
            Send messages and banners to users
          </p>
        </div>
        <Button
          onClick={() => { resetForm(); setCreateOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-label"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Table */}
      <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e4e2e1]">
                {["Title", "Target", "Channel", "Sent At", "Reach", "Actions"].map((h) => (
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
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="p-3">
                        <Skeleton className="h-10 rounded-xl" />
                      </td>
                    </tr>
                  ))
                : announcements.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-[#e4e2e1]/50 last:border-0 hover:bg-white/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-label font-medium text-slate-800">
                        {a.title}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs capitalize">
                        {targetLabel(a.target)}
                      </td>
                      <td className="py-3 px-4">
                        <ChannelBadge channel={a.channel} />
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {formatDate(a.sent_at)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {a.sent_count > 0 ? `${a.sent_count} users` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-lg"
                          onClick={() => setViewAnnouncement(a)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
              {!loading && announcements.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-label">
                    No announcements yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title (internal) <span className="text-red-500">*</span></Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Ramadan Promo"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Message <span className="text-red-500">*</span></Label>
              <Textarea
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                placeholder="Write the message that will be sent..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Target Audience</Label>
                <Select value={formTarget} onValueChange={setFormTarget}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="free">Free Users</SelectItem>
                    <SelectItem value="pro">Pro Users</SelectItem>
                    <SelectItem value="teams">Teams Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select value={formChannel} onValueChange={setFormChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">In-app Banner</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs text-slate-400 font-label">
              Announcements are sent immediately.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminConfirmDialog {...dialogProps} />

      {/* View Dialog */}
      <Dialog open={!!viewAnnouncement} onOpenChange={(o) => !o && setViewAnnouncement(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewAnnouncement?.title}</DialogTitle>
          </DialogHeader>
          {viewAnnouncement && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <ChannelBadge channel={viewAnnouncement.channel} />
                <span className="text-xs text-slate-500 font-label">
                  → {targetLabel(viewAnnouncement.target)}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 text-sm text-slate-700 font-label whitespace-pre-wrap">
                {viewAnnouncement.message}
              </div>
              <p className="text-xs text-slate-400">
                Sent: {formatDate(viewAnnouncement.sent_at)} · Reached {viewAnnouncement.sent_count} users
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
