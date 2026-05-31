import type { OrderItem } from "./types";

type NotificationOrder = {
  id: string;
  guest_name: string;
  contact: string | null;
  requested_time: string | null;
  note: string | null;
  total: number;
};

export async function notifyNewOrder(order: NotificationOrder, items: OrderItem[]) {
  const text = buildOrderText(order, items);
  const tasks: Promise<unknown>[] = [];

  if (process.env.RESEND_API_KEY && process.env.ORDER_NOTIFY_EMAIL) {
    tasks.push(sendEmail(text, order));
  }

  if (process.env.NOTIFY_WEBHOOK_URL) {
    tasks.push(sendWebhook(text, order, items));
  }

  const results = await Promise.allSettled(tasks);
  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length) {
    console.error("Notification failures", failed);
  }
}

function buildOrderText(order: NotificationOrder, items: OrderItem[]) {
  return [
    "暖厨新订单",
    `订单号：${order.id}`,
    `姓名：${order.guest_name}`,
    `联系：${order.contact || "未填"}`,
    `时间：${order.requested_time || "未填"}`,
    "菜品：",
    ...items.map((item) => `- ${item.name_snapshot} × ${item.quantity}，¥${item.price_snapshot * item.quantity}`),
    `合计：¥${order.total}`,
    order.note ? `备注：${order.note}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendEmail(text: string, order: NotificationOrder) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.ORDER_FROM_EMAIL || "Warm Kitchen <onboarding@resend.dev>",
      to: process.env.ORDER_NOTIFY_EMAIL,
      subject: `暖厨新订单：${order.guest_name}`,
      text
    })
  });

  if (!response.ok) {
    throw new Error(`Resend failed: ${response.status} ${await response.text()}`);
  }
}

async function sendWebhook(text: string, order: NotificationOrder, items: OrderItem[]) {
  const response = await fetch(process.env.NOTIFY_WEBHOOK_URL as string, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, order, items })
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status} ${await response.text()}`);
  }
}
