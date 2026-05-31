import { NextResponse } from "next/server";
import { assertAdmin, supabaseAdmin } from "@/lib/supabaseAdmin";

const bucketName = "menu-images";

export async function POST(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  try {
    await ensureBucket();
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Storage bucket setup failed" }, { status: 500 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const path = `menu/${safeName}`;

  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage.from(bucketName).upload(path, bytes, {
    contentType: file.type,
    upsert: false
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}

async function ensureBucket() {
  const supabase = supabaseAdmin();
  const { data } = await supabase.storage.getBucket(bucketName);
  if (data) return;

  const { error } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"]
  });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw error;
  }
}
