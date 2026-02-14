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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);

    try {
      const result = await inviteMember(teamId, email, role);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Invitation sent to ${email}`);
        setEmail("");
        setRole("member");
        onOpenChange(false);
        window.location.reload();
      }
    } catch (error) {
      toast.error("Failed to send invitation");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    {
      value: "viewer",
      label: "Viewer",
      description: "Can only view team content",
      icon: Eye,
      gradient: "from-slate-400 to-slate-500",
    },
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Invite Team Member
            </span>
          </DialogTitle>
          <DialogDescription className="pt-2">
            Send an invitation to collaborate. They'll get access based on their
            assigned role.
          </DialogDescription>
        </DialogHeader>

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
                <Sparkles className="w-4 h-4 text-purple-500" />
                Role & Permissions
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

              {selectedRole && (
                <div
                  className={`flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r ${selectedRole.gradient} bg-opacity-10 border border-${selectedRole.value === "admin" ? "indigo" : selectedRole.value === "member" ? "sky" : "slate"}-200 dark:border-${selectedRole.value === "admin" ? "indigo" : selectedRole.value === "member" ? "sky" : "slate"}-900`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedRole.gradient} flex items-center justify-center shadow-md`}
                  >
                    <selectedRole.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-0.5">
                      {selectedRole.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedRole.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
