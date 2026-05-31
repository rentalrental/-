create extension if not exists "pgcrypto";

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  kitchen_slug text not null default 'warm-kitchen',
  name text not null,
  category text not null check (category in ('main', 'dessert', 'drink')),
  description text default '',
  price numeric(10, 2) not null default 0,
  image_url text,
  prep_time text,
  tags text[] not null default '{}',
  available boolean not null default true,
  recommended boolean not null default false,
  daily_limit integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  kitchen_slug text not null default 'warm-kitchen',
  guest_name text not null,
  contact text,
  requested_time text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cooking', 'completed', 'cancelled')),
  total numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id),
  name_snapshot text not null,
  price_snapshot numeric(10, 2) not null default 0,
  quantity integer not null check (quantity > 0)
);

create index if not exists menu_items_kitchen_sort_idx on public.menu_items (kitchen_slug, sort_order, created_at);
create index if not exists orders_kitchen_created_idx on public.orders (kitchen_slug, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- This app reads and writes through server-side Next.js API routes using the
-- Supabase service role key. Direct browser access is intentionally blocked by
-- RLS unless you later add explicit public policies.

insert into public.menu_items
  (kitchen_slug, name, category, description, price, image_url, prep_time, tags, available, recommended, daily_limit, sort_order)
values
  ('warm-kitchen', '番茄罗勒炖鸡', 'main', '鸡腿肉炖到入味，番茄汁收浓，适合配饭。', 58, 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=80', '35分钟', array['下饭','微酸','推荐'], true, true, 8, 10),
  ('warm-kitchen', '味噌黄油三文鱼', 'main', '味噌咸香和黄油融合，配清爽时蔬。', 68, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=80', '28分钟', array['清爽','少刺'], true, false, 6, 20),
  ('warm-kitchen', '焦糖布丁', 'dessert', '蛋奶味厚，焦糖微苦，饭后刚好。', 18, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80', '冷藏2小时', array['冷藏','少甜'], true, true, 12, 30),
  ('warm-kitchen', '柠檬磅蛋糕', 'dessert', '柠檬糖霜清爽，切片后适合分享。', 22, 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=900&q=80', '45分钟', array['可外带','酸甜'], true, false, 8, 40),
  ('warm-kitchen', '桂花乌龙冷泡', 'drink', '茶味干净，桂花香轻，配油脂感高的菜很合适。', 15, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80', '提前4小时', array['冷饮','无糖'], true, false, 14, 50)
on conflict do nothing;
