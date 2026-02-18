"use client";

import { useState } from "react";
import { inviteMember } from "@/app/actions/teams";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  UserPlus,
  Mail,
  Shield,
  User,
  Eye,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  teamId,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin" | "viewer">("member");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);

    try {
      const result = await inviteMember(teamId, email, role); // Calls createInvitation under the hood

      if (result.error) {
        toast.error(result.error);
      } else {
        // Success - prioritize email message
        toast.success(`Invitation sent to ${email}`);

        // Optional: still set link if you want to allow copying as backup,
        // but user requested "send email not a link".
        // We'll reset and close to emphasize "sent".
        onOpenChange(false);
        setEmail("");
        setRole("member");
      }
    } catch (error) {
      toast.error("Failed to send invitation");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Link copied to clipboard!");
    }
  };

  const reset = () => {
    setInviteLink(null);
    setEmail("");
    setRole("member");
    onOpenChange(false);
  };

  const roleOptions = [
    {
      value: "member",
      label: "Member",
      description: "Can create and edit tasks",
      icon: User,
      gradient: "from-sky-500 to-sky-600",
    },
    {
      value: "admin",
      label: "Admin",
      description: "Can manage team and members",
      icon: Shield,
      gradient: "from-indigo-500 to-purple-500",
    },
  ];

  const selectedRole = roleOptions.find((r) => r.value === role);

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="sm:max-w-[500px] border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {inviteLink ? "Invitation Ready" : "Invite Team Member"}
            </span>
          </DialogTitle>
          <DialogDescription className="pt-2">
            {inviteLink
              ? "Share this link with your team member to let them join."
              : "Generate an invitation link for your team member."}
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="grid gap-4 py-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Invitation Link
              </p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={inviteLink}
                  className="font-mono text-xs bg-background"
                />
                <Button size="icon" variant="outline" onClick={copyLink}>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={reset} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              <div className="grid gap-3">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-indigo-500" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-11 border-border/50 focus:border-indigo-500"
                />
              </div>

              <div className="grid gap-3">
                <Label
                  htmlFor="role"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-purple-500" />
                  Role permission
                </Label>
                <Select
                  value={role}
                  onValueChange={(value: any) => setRole(value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="role" className="h-11 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          <span className="font-medium">{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/20"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Invitation Link
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
