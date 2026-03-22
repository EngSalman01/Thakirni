import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminSidebar } from "./_components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth");
  }

  const adminStatus = await isAdmin(user.id);

  // DEBUG: run raw query to expose exact failure
  const debugClient = createServiceClient();
  const { data: debugData, error: debugError } = await debugClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!adminStatus) {
    return (
      <div style={{ padding: 40, fontFamily: "monospace" }}>
        <p>DEBUG: layout ran</p>
        <p>user.id: {user.id}</p>
        <p>isAdmin: {String(adminStatus)}</p>
        <p>raw data: {JSON.stringify(debugData)}</p>
        <p>raw error: {JSON.stringify(debugError)}</p>
      </div>
    );
  }

  // Fetch profile for sidebar
  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const fullName = profile?.full_name ?? user.email?.split("@")[0] ?? "Admin";

  return (
    <div className="min-h-screen bg-[#fbf9f8]">
      <AdminSidebar fullName={fullName} />
      <main className="ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
