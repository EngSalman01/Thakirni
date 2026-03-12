"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, ShieldAlert, Users, Clock } from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface JoinTeamPageProps {
  searchParams: Promise<{ token?: string }>;
}

// ── Server Action ─────────────────────────────────────────────────────────────

async function acceptInvitation(formData: FormData) {
  "use server";

  const token = formData.get("token") as string;
  const teamId = formData.get("teamId") as string;
  const role = formData.get("role") as string;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/auth?next=${encodeURIComponent(`/join-team?token=${token}`)}`);

  // Double-check invite is still valid before writing
  const { data: invite } = await supabase
    .from("team_invitations")
    .select("id, expires_at, email")
    .eq("token", token)
    .single();

  if (!invite) {
    redirect("/join-team?error=not_found");
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    redirect("/join-team?error=expired");
  }

  // Upsert to handle any race conditions gracefully
  const { error: joinError } = await supabase
    .from("team_members")
    .upsert(
      { team_id: teamId, user_id: user.id, role },
      { onConflict: "team_id,user_id", ignoreDuplicates: true }
    );

  if (joinError) {
    console.error("[JoinTeam] Insert error:", joinError);
    redirect("/join-team?error=join_failed");
  }

  // Mark invitation as accepted (soft delete is better than hard delete for audit trail)
  await supabase
    .from("team_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("token", token);

  revalidatePath(`/vault/teams/${teamId}`);
  redirect(`/vault/teams/${teamId}`);
}

// ── Error Card Helper ─────────────────────────────────────────────────────────

function ErrorCard({
  icon: Icon,
  title,
  description,
  cta = "Go to Dashboard",
  href = "/vault",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  cta?: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
      <Card className="w-full max-w-md border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Icon className="w-5 h-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href={href}>{cta}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function JoinTeamPage({ searchParams }: JoinTeamPageProps) {
  // Next.js 15: searchParams is async
  const { token, error: errorParam } = await searchParams;

  // ── Handle error redirects from the server action ──
  if (errorParam === "expired") {
    return (
      <ErrorCard
        icon={Clock}
        title="Invitation Expired"
        description="This invitation link has expired. Ask the team admin to send a new one."
      />
    );
  }

  if (errorParam === "join_failed") {
    return (
      <ErrorCard
        icon={XCircle}
        title="Failed to Join"
        description="Something went wrong while adding you to the team. Please try again or contact support."
      />
    );
  }

  if (errorParam === "not_found") {
    return (
      <ErrorCard
        icon={ShieldAlert}
        title="Invitation Not Found"
        description="This invitation may have already been used or revoked."
      />
    );
  }

  // ── No token ──
  if (!token) {
    return (
      <ErrorCard
        icon={XCircle}
        title="Invalid Link"
        description="This invitation link is missing a required token. Please use the full link from your email."
      />
    );
  }

  // ── Auth check ──
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(`/join-team?token=${token}`)}`);
  }

  // ── Fetch invitation ──
  const { data: invitation, error: inviteError } = await supabase
    .from("team_invitations")
    .select("*, teams(name)")
    .eq("token", token)
    .single();

  if (inviteError || !invitation) {
    return (
      <ErrorCard
        icon={ShieldAlert}
        title="Invitation Not Found"
        description={`This invitation may have expired, been revoked, or already accepted. Make sure you're signed in with the correct account (currently: ${user.email}).`}
      />
    );
  }

  // ── Expiry check ──
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return (
      <ErrorCard
        icon={Clock}
        title="Invitation Expired"
        description="This invitation link has expired. Ask the team admin to send a new one."
      />
    );
  }

  // ── Email mismatch check ──
  if (invitation.email && invitation.email !== user.email) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
        <Card className="w-full max-w-md border-yellow-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <ShieldAlert className="w-5 h-5" />
              Wrong Account
            </CardTitle>
            <CardDescription className="space-y-1">
              <p>
                This invitation was sent to{" "}
                <span className="font-semibold">{invitation.email}</span>, but
                you are signed in as{" "}
                <span className="font-semibold">{user.email}</span>.
              </p>
              <p className="mt-2">
                Please sign in with the correct account to accept this invitation.
              </p>
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href={`/auth?next=${encodeURIComponent(`/join-team?token=${token}`)}`}>
                Sign in with a different account
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/vault">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const teamName = (invitation.teams as any)?.name || "the team";

  // ── Already a member ──
  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", invitation.team_id)
    .eq("user_id", user.id)
    .single();

  if (membership) {
    redirect(`/vault/teams/${invitation.team_id}`);
  }

  // ── Confirmation screen (user must click to join) ──
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl">You've been invited!</CardTitle>
          <CardDescription className="text-base mt-1">
            You've been invited to join{" "}
            <span className="font-semibold text-foreground">{teamName}</span>{" "}
            as a{" "}
            <span className="font-semibold text-foreground capitalize">
              {invitation.role}
            </span>
            .
          </CardDescription>
        </CardHeader>

        <CardContent className="text-sm text-muted-foreground text-center">
          Signing in as{" "}
          <span className="font-medium text-foreground">{user.email}</span>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {/* Server Action form — no client JS needed */}
          <form action={acceptInvitation} className="w-full">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="teamId" value={invitation.team_id} />
            <input type="hidden" name="role" value={invitation.role} />
            <Button type="submit" className="w-full">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Accept &amp; Join {teamName}
            </Button>
          </form>

          <Button asChild variant="ghost" className="w-full text-muted-foreground">
            <Link href="/vault">Decline</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}