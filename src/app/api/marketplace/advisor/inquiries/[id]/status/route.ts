import { NextResponse } from "next/server";
import { badRequest, forbidden, requireActiveApiUser, serverError } from "@/lib/server/api";
import { marketplaceInquiryStatusPatchSchema } from "@/lib/marketplace/schemas";
import { getInquiryById, patchInquiryStatus } from "@/lib/server/marketplace-inquiries";
import { getOwnMarketplaceProfile } from "@/lib/server/marketplace-profiles";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const parsed = marketplaceInquiryStatusPatchSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Invalid inquiry status payload");
  }

  const { id } = await params;

  const [{ profile, error: profileError }, { inquiry, error: inquiryError }] = await Promise.all([
    getOwnMarketplaceProfile(context.supabase, context.user.id),
    getInquiryById(context.supabase, id),
  ]);

  if (profileError || inquiryError) {
    return serverError("Unable to validate inquiry ownership");
  }

  if (!profile || !inquiry) {
    return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
  }

  if (inquiry.profile_id !== profile.id) {
    return forbidden();
  }

  const { inquiry: updatedInquiry, error } = await patchInquiryStatus(
    context.supabase,
    inquiry.id,
    parsed.data.status,
    context.user.id
  );

  if (error || !updatedInquiry) {
    return serverError("Unable to update inquiry status");
  }

  return NextResponse.json({ inquiry: updatedInquiry });
}
