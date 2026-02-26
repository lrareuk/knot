import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, requireApiUser, serverError } from "@/lib/server/api";
import { supabaseAdmin } from "@/lib/supabase/admin";

const payloadSchema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT"),
});

export async function POST(req: Request) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid payload");
  }

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Confirmation text did not match");
  }

  const admin = supabaseAdmin();

  const { data: reports } = await admin
    .from("reports")
    .select("storage_path")
    .eq("user_id", context.user.id);

  if (reports && reports.length > 0) {
    const paths = reports.map((report) => report.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await admin.storage.from("reports").remove(paths);
    }
  }

  const { error } = await admin.auth.admin.deleteUser(context.user.id);

  if (error) {
    return serverError("Unable to delete account");
  }

  return NextResponse.json({ ok: true });
}
