import type { OrderItem } from "./types";

type NotificationOrder = {
  id: string;
  guest_name: string;
  contact: string | null;
  requested_time: string | null;
  note: string | null;
  total: number;
};

const defaultNotifyEmail = "rentongg@outlook.com";
const defaultFromEmail = "Warm Kitchen <onboarding@resend.dev>";

export function getNotificationSettings() {
  return {
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    hasWebhookUrl: Boolean(process.env.NOTIFY_WEBHOOK_URL),
    notifyEmail: process.env.ORDER_NOTIFY_EMAIL || defaultNotifyEmail,
    fromEmail: process.env.ORDER_FROM_EMAIL || defaultFromEmail
  };
}

export async function notifyNewOrder(order: NotificationOrder, items: OrderItem[]) {
  const text = buildOrderText(order, items);
  const tasks: Promise<unknown>[] = [];
  const settings = getNotificationSettings();

  if (settings.hasResendApiKey) {
    tasks.push(sendEmail(text, `暖厨新订单：${order.guest_name}`, settings.notifyEmail, settings.fromEmail));
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

export async function sendTestEmail() {
  const settings = getNotificationSettings();
  if (!settings.hasResendApiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  await sendEmail(
    "暖厨邮件通知测试成功。\n以后朋友提交订单后，你会在这个邮箱收到提醒。",
    "暖厨测试通知",
    settings.notifyEmail,
    settings.fromEmail
  );
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

async function sendEmail(text: string, subject: string, notifyEmail: string, fromEmail: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: notifyEmail,
      subject,
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
