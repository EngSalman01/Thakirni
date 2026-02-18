import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Trash2, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/language-provider";

interface TeamMembersTabProps {
  teamId: string;
  teamName: string;
  members: Array<{ id: string; name: string; avatar?: string }>;
}

export function TeamMembersTab({
  teamId,
  teamName,
  members,
}: TeamMembersTabProps) {
  const { t } = useLanguage();
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  const handleInvite = async () => {
    if (inviteEmail.trim()) {
      // TODO: Implement invitation logic
      setInviteEmail("");
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    // TODO: Implement remove member logic
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-600" />
          <div>
            <h3 className="text-lg font-semibold">{teamName}</h3>
            <p className="text-sm text-slate-600">
              {members.length} {t("members", "أعضاء")}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsInviting(true)}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("Invite Member", "دعوة عضو")}
        </Button>
      </div>

      {/* Invite Form */}
      {isInviting && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-slate-200 p-4 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Email", "البريد الإلكتروني")}
            </label>
            <Input
              type="email"
              placeholder={t("member@example.com", "عضو@مثال.com")}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Role", "الدور")}
            </label>
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">{t("Member", "عضو")}</SelectItem>
                <SelectItem value="admin">{t("Admin", "مسؤول")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail.trim()}
            >
              {t("Send Invite", "إرسال دعوة")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsInviting(false)}
            >
              {t("Cancel", "إلغاء")}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Members List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          <AnimatePresence>
            {members.map((member) => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-semibold text-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">
                      {member.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {t("Member", "عضو")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <p className="text-sm text-blue-900">
          {t(
            "Team members can collaborate on tasks, share memories, and manage reminders together.",
            "يمكن لأعضاء الفريق التعاون على المهام ومشاركة الذكريات وإدارة التذكيرات معاً."
          )}
        </p>
      </div>
    </div>
  );
}
