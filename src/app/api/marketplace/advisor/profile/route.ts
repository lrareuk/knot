import { NextResponse } from "next/server";
import { badRequest, requireActiveApiUser, serverError } from "@/lib/server/api";
import { marketplaceProfileCreateSchema, marketplaceProfilePatchSchema } from "@/lib/marketplace/schemas";
import {
  createOwnMarketplaceProfile,
  getOwnMarketplaceProfile,
  patchOwnMarketplaceProfile,
} from "@/lib/server/marketplace-profiles";

function normalizeNullableText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeCreatePayload(payload: ReturnType<typeof marketplaceProfileCreateSchema.parse>) {
  return {
    ...payload,
    firm_name: normalizeNullableText(payload.firm_name),
    headline: normalizeNullableText(payload.headline),
    bio: normalizeNullableText(payload.bio),
    contact_email: normalizeNullableText(payload.contact_email),
    contact_url: normalizeNullableText(payload.contact_url),
    languages: Array.from(new Set(payload.languages.map((value) => value.trim()))),
  };
}

function normalizePatchPayload(payload: ReturnType<typeof marketplaceProfilePatchSchema.parse>) {
  return {
    ...payload,
    ...(payload.firm_name !== undefined ? { firm_name: normalizeNullableText(payload.firm_name) } : {}),
    ...(payload.headline !== undefined ? { headline: normalizeNullableText(payload.headline) } : {}),
    ...(payload.bio !== undefined ? { bio: normalizeNullableText(payload.bio) } : {}),
    ...(payload.contact_email !== undefined ? { contact_email: normalizeNullableText(payload.contact_email) } : {}),
    ...(payload.contact_url !== undefined ? { contact_url: normalizeNullableText(payload.contact_url) } : {}),
    ...(payload.languages ? { languages: Array.from(new Set(payload.languages.map((value) => value.trim()))) } : {}),
  };
}

export async function GET() {
  const context = await requireActiveApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { profile, error } = await getOwnMarketplaceProfile(context.supabase, context.user.id);
  if (error) {
    return serverError("Unable to load advisor marketplace profile");
  }

  return NextResponse.json({ profile });
}

export async function POST(req: Request) {
  const context = await requireActiveApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid payload");
  }

  const parsed = marketplaceProfileCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Invalid advisor marketplace profile");
  }

  const existing = await getOwnMarketplaceProfile(context.supabase, context.user.id);
  if (existing.profile) {
    return badRequest("Marketplace profile already exists");
  }

  const { profile, error } = await createOwnMarketplaceProfile(
    context.supabase,
    context.user.id,
    normalizeCreatePayload(parsed.data)
  );

  if (error || !profile) {
    return serverError("Unable to create advisor marketplace profile");
  }

  return NextResponse.json({ profile }, { status: 201 });
}

export async function PATCH(req: Request) {
  const context = await requireActiveApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid payload");
  }

  const parsed = marketplaceProfilePatchSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Invalid advisor marketplace profile patch");
  }

  const { profile, error } = await patchOwnMarketplaceProfile(
    context.supabase,
    context.user.id,
    normalizePatchPayload(parsed.data)
  );

  if (error || !profile) {
    return serverError("Unable to update advisor marketplace profile");
  }

  return NextResponse.json({ profile });
}
