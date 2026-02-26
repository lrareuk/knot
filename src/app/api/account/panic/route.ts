import { NextResponse } from "next/server";
import { requireApiUser, serverError } from "@/lib/server/api";
import { supabaseAdmin } from "@/lib/supabase/admin";

const REMOVE_CHUNK_SIZE = 1000;
const HUNDRED_YEARS_IN_HOURS = "876000h";

function parseRetentionDays() {
  const parsed = Number(process.env.RECOVERY_SNAPSHOT_RETENTION_DAYS ?? "30");
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 30;
  }
  return Math.floor(parsed);
}

function chunk<T>(input: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < input.length; index += size) {
    chunks.push(input.slice(index, index + size));
  }
  return chunks;
}

type PanicResult = {
  snapshot_id: string;
  report_paths: string[];
};

function toPanicResult(data: unknown): PanicResult | null {
  if (Array.isArray(data)) {
    const first = data[0] as PanicResult | undefined;
    return first ?? null;
  }

  if (data && typeof data === "object") {
    return data as PanicResult;
  }

  return null;
}

export async function POST() {
  const context = await requireApiUser();
  if (context.response || !context.user || !context.profile) {
    return context.response;
  }

  if (context.profile.account_state !== "active") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const retentionDays = parseRetentionDays();
  const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();

  const admin = supabaseAdmin();
  const { data: panicData, error: panicError } = await admin.rpc("activate_panic_mode", {
    p_user_id: context.user.id,
    p_expires_at: expiresAt,
  });

  if (panicError) {
    return serverError("Unable to hide account");
  }

  const parsed = toPanicResult(panicData);
  const reportPaths = parsed?.report_paths ?? [];

  if (reportPaths.length > 0) {
    const batches = chunk(reportPaths.filter(Boolean), REMOVE_CHUNK_SIZE);
    for (const batch of batches) {
      const { error: removeError } = await admin.storage.from("reports").remove(batch);
      if (removeError) {
        return serverError("Unable to hide account");
      }
    }
  }

  const { error: banError } = await admin.auth.admin.updateUserById(context.user.id, {
    ban_duration: HUNDRED_YEARS_IN_HOURS,
  });

  if (banError) {
    return serverError("Unable to hide account");
  }

  return NextResponse.json({ ok: true });
}
