import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    redirect("/admin/login");
  }

  // Use authenticated client to read profile — avoids broken service role key
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin !== true) {
    redirect("/admin/login");
  }

  const fullName = profile?.full_name ?? user.email?.split("@")[0] ?? "Admin";

  return (
    <div className="dark min-h-screen bg-[#0E0B07] hero-mesh" dir="ltr">
      <AdminSidebar fullName={fullName} />
      <main className="ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
