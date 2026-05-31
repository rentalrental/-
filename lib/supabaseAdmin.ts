import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false }
  });
}

export function assertAdmin(request: Request) {
  const expected = process.env.ADMIN_TOKEN;
  const actual = request.headers.get("x-admin-token");

  if (!expected) {
    return Response.json({ error: "ADMIN_TOKEN is not configured" }, { status: 500 });
  }

  if (!actual || actual !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
