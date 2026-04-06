import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { sanitizeString } from "@/lib/validate";

const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  // Validate + sanitize search to prevent expensive unbounded ILIKE queries
  const rawSearch = searchParams.get("search") ?? "";
  const search = sanitizeString(rawSearch, 100) ?? "";

  const plan = searchParams.get("plan") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1), 100);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("profiles")
    .select("id, full_name, avatar_url, plan_tier, created_at, phone_number", {
      count: "exact",
    });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
  }

  if (plan && plan !== "all") {
    if (plan === "free") {
      query = query.or("plan_tier.eq.FREE,plan_tier.eq.INDIVIDUAL,plan_tier.is.null");
    } else if (plan === "pro") {
      query = query.eq("plan_tier", "PRO");
    } else if (plan === "teams") {
      query = query.or("plan_tier.eq.COMPANY,plan_tier.eq.TEAM,plan_tier.eq.TEAMS");
    }
  }

  const allowedSorts = new Set(["newest", "oldest", "name"]);
  const safeSort = allowedSorts.has(sort) ? sort : "newest";
  if (safeSort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (safeSort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    query = query.order("full_name", { ascending: true });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error: dbError, count } = await query;
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500, headers: NO_STORE });
  }

  // Fetch emails from auth.users via service client admin API
  const userIds = (data ?? []).map((u) => u.id);
  const emailMap: Record<string, string> = {};
  if (userIds.length > 0) {
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      for (const au of authUsers?.users ?? []) {
        if (userIds.includes(au.id)) emailMap[au.id] = au.email ?? "";
      }
    } catch {
      // email fetch failed, continue without
    }
  }

  const users = (data ?? []).map((u) => ({ ...u, email: emailMap[u.id] ?? "" }));

  return NextResponse.json(
    { users, total: count ?? 0, page, limit },
    { headers: NO_STORE }
  );
}
