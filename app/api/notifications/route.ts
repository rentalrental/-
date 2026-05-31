import { NextResponse } from "next/server";
import { getNotificationSettings, sendTestEmail } from "@/lib/notify";
import { assertAdmin } from "@/lib/supabaseAdmin";

export function GET(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  return NextResponse.json({ settings: getNotificationSettings() });
}

export async function POST(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  try {
    await sendTestEmail();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Test email failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
