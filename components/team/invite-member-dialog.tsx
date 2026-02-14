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
import { Loader2, UserPlus, Mail, Shield, User, Eye } from "lucide-react";
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
      color: "text-slate-600 dark:text-slate-400",
    },
    {
      value: "member",
      label: "Member",
      description: "Can create and edit tasks",
      icon: User,
      color: "text-cyan-600 dark:text-cyan-400",
    },
    {
      value: "admin",
      label: "Admin",
      description: "Can manage team and members",
      icon: Shield,
      color: "text-violet-600 dark:text-violet-400",
    },
  ];

  const selectedRole = roleOptions.find((r) => r.value === role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to collaborate on this team. They'll get access
            based on their assigned role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="role" className="text-sm font-medium">
                Role & Permissions
              </Label>
              <Select
                value={role}
                onValueChange={(value: any) => setRole(value)}
                disabled={isLoading}
              >
                <SelectTrigger id="role" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className={`w-4 h-4 ${option.color}`} />
                        <span className="font-medium">{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedRole && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <selectedRole.icon
                    className={`w-4 h-4 mt-0.5 ${selectedRole.color}`}
                  />
                  <div>
                    <p className="text-sm font-medium">{selectedRole.label}</p>
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
              className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500"
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
