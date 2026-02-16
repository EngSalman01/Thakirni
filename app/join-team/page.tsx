import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

interface JoinTeamPageProps {
  searchParams: {
    token?: string;
  };
}

export default async function JoinTeamPage({
  searchParams,
}: JoinTeamPageProps) {
  const token = searchParams.token;
  const supabase = await createClient();

  // 1. Validate Token
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" /> Invalid Link
            </CardTitle>
            <CardDescription>
              This invitation link is missing a token.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/vault">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 2. Check Authentication FIRST (before querying invitation to satisfy RLS)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If NOT logged in, redirect to Sign Up (with return URL)
  if (!user) {
    const returnUrl = encodeURIComponent(`/join-team?token=${token}`);
    redirect(`/auth?next=${returnUrl}`);
  }

  // 3. Fetch Invitation (now authenticated, RLS will allow read)
  const { data: invitation, error: inviteError } = await supabase
    .from("team_invitations")
    .select("*, teams(name)")
    .eq("token", token)
    .single();

  if (inviteError || !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <ShieldAlert className="w-5 h-5" /> Invitation Not Found
            </CardTitle>
            <CardDescription>
              This invitation may have expired, been revoked, or already
              accepted. Or it may have been sent to a different email (
              {user.email}).
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="default" className="w-full">
              <Link href="/vault">Return Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const teamName = (invitation.teams as any)?.name || "the team";

  // 4. Check if already a member
  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", invitation.team_id)
    .eq("user_id", user.id)
    .single();

  if (membership) {
    // Already member -> Redirect to team
    redirect(`/vault/settings/teams/${invitation.team_id}`);
  }

  // 5. User is logged in, valid invite, not a member yet.
  // We can auto-accept here (Server Action logic inline or separate)
  // Or show a confirmation button.
  // The user requested: "If they are logged in -> Add them to team_members immediately."

  // Perform Join Operation
  const { error: joinError } = await supabase.from("team_members").insert({
    team_id: invitation.team_id,
    user_id: user.id,
    role: invitation.role,
  });

  if (joinError) {
    console.error("Join error:", joinError);
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to Join</CardTitle>
            <CardDescription>
              Something went wrong while adding you to the team.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Delete invitation (consume it) - Optional: keep it for history or delete
  // Usually good to delete or mark as accepted to prevent re-use if one-time
  await supabase.from("team_invitations").delete().eq("token", token);

  // Success!
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
      <Card className="w-full max-w-md border-green-500/20 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-6 h-6" /> Welcome to {teamName}!
          </CardTitle>
          <CardDescription className="text-green-600/80">
            You have successfully joined the team.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            asChild
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Link href={`/vault/teams/${invitation.team_id}`}>
              Go to Team Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
