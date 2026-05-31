import { NextResponse } from "next/server";
import { assertAdmin, supabaseAdmin } from "@/lib/supabaseAdmin";

const defaultSlug = process.env.NEXT_PUBLIC_KITCHEN_SLUG || "warm-kitchen";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || defaultSlug;
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("kitchen_slug", slug)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const body = await request.json();
  const supabase = supabaseAdmin();
  const item = normalizeMenuItem(body);

  const { data, error } = await supabase.from("menu_items").insert(item).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}

function normalizeMenuItem(body: any) {
  return {
    kitchen_slug: body.kitchen_slug || defaultSlug,
    name: String(body.name || "").trim(),
    category: body.category || "main",
    description: body.description || "",
    price: Number(body.price || 0),
    image_url: body.image_url || null,
    prep_time: body.prep_time || null,
    tags: Array.isArray(body.tags) ? body.tags : [],
    available: body.available !== false,
    recommended: Boolean(body.recommended),
    daily_limit: body.daily_limit ? Number(body.daily_limit) : null,
    sort_order: Number(body.sort_order || 0)
  };
}
