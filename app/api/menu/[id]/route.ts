import { NextResponse } from "next/server";
import { assertAdmin, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const supabase = supabaseAdmin();
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.category !== undefined) patch.category = body.category;
  if (body.description !== undefined) patch.description = body.description;
  if (body.price !== undefined) patch.price = Number(body.price);
  if (body.image_url !== undefined) patch.image_url = body.image_url;
  if (body.prep_time !== undefined) patch.prep_time = body.prep_time;
  if (Array.isArray(body.tags)) patch.tags = body.tags;
  if (body.available !== undefined) patch.available = body.available;
  if (body.recommended !== undefined) patch.recommended = body.recommended;
  if (body.daily_limit !== undefined) patch.daily_limit = body.daily_limit === "" ? null : Number(body.daily_limit);
  if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order);

  const { data, error } = await supabase.from("menu_items").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
