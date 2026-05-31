export type Category = "main" | "dessert" | "drink";
export type OrderStatus = "pending" | "accepted" | "cooking" | "completed" | "cancelled";

export const categoryOrder: Category[] = ["main", "dessert", "drink"];

export const categoryLabels: Record<Category, string> = {
  main: "主菜",
  dessert: "甜点",
  drink: "饮料"
};

export const statusLabels: Record<OrderStatus, string> = {
  pending: "待确认",
  accepted: "已确认",
  cooking: "备餐中",
  completed: "已完成",
  cancelled: "已取消"
};

export type MenuItem = {
  id: string;
  kitchen_slug: string;
  name: string;
  category: Category;
  description: string | null;
  price: number;
  image_url: string | null;
  prep_time: string | null;
  tags: string[];
  available: boolean;
  recommended: boolean;
  daily_limit: number | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type OrderItem = {
  id?: string;
  order_id?: string;
  menu_item_id: string;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
};

export type Order = {
  id: string;
  kitchen_slug: string;
  guest_name: string;
  contact: string | null;
  requested_time: string | null;
  note: string | null;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at?: string;
  order_items?: OrderItem[];
};
