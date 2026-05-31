import { NextResponse } from "next/server";
import { notifyNewOrder } from "@/lib/notify";
import { assertAdmin, supabaseAdmin } from "@/lib/supabaseAdmin";
import type { MenuItem, OrderItem } from "@/lib/types";

const defaultSlug = process.env.NEXT_PUBLIC_KITCHEN_SLUG || "warm-kitchen";

export async function GET(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || defaultSlug;
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("kitchen_slug", slug)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data || [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const kitchenSlug = body.kitchen_slug || defaultSlug;
  const requestedItems = Array.isArray(body.items) ? body.items : [];

  if (!String(body.guest_name || "").trim()) {
    return NextResponse.json({ error: "guest_name is required" }, { status: 400 });
  }
  if (!requestedItems.length) {
    return NextResponse.json({ error: "items are required" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const ids = requestedItems.map((item: any) => item.menu_item_id);
  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("*")
    .eq("kitchen_slug", kitchenSlug)
    .in("id", ids)
    .eq("available", true);

  if (menuError) return NextResponse.json({ error: menuError.message }, { status: 500 });
  if (!menuItems?.length) return NextResponse.json({ error: "No available menu items found" }, { status: 400 });

  const byId = new Map((menuItems as MenuItem[]).map((item) => [item.id, item]));
  const orderItems = requestedItems
    .map((item: any) => {
      const menuItem = byId.get(item.menu_item_id);
      const quantity = Math.max(1, Number(item.quantity || 1));
      if (!menuItem) return null;
      return {
        menu_item_id: menuItem.id,
        name_snapshot: menuItem.name,
        price_snapshot: menuItem.price,
        quantity
      };
    })
    .filter(Boolean) as OrderItem[];

  const total = orderItems.reduce((sum, item) => sum + item.price_snapshot * item.quantity, 0);
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      kitchen_slug: kitchenSlug,
      guest_name: String(body.guest_name || "").trim(),
      contact: body.contact || null,
      requested_time: body.requested_time || null,
      note: body.note || null,
      status: "pending",
      total
    })
    .select("*")
    .single();

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  const rows = orderItems.map((item) => ({ ...item, order_id: order.id }));
  const { error: itemError } = await supabase.from("order_items").insert(rows);
  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });

  await notifyNewOrder(order, orderItems);
  return NextResponse.json({ order: { ...order, order_items: orderItems } }, { status: 201 });
}
