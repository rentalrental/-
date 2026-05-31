import { NextResponse } from "next/server";
import { assertAdmin, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const status = body.status;
  if (!["pending", "accepted", "cooking", "completed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select("*, order_items(*)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}
