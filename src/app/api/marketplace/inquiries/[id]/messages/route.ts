import { NextResponse } from "next/server";
import { badRequest, forbidden, requireActiveApiUser, serverError } from "@/lib/server/api";
import { marketplaceMessageCreateSchema } from "@/lib/marketplace/schemas";
import { getInquiryParticipant } from "@/lib/server/marketplace-inquiries";
import { createMarketplaceMessage, listThreadForInquiry } from "@/lib/server/marketplace-messages";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireActiveApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { id } = await params;
  const { participant, error: participantError } = await getInquiryParticipant(context.supabase, id, context.user.id);

  if (participantError) {
    return serverError("Unable to validate inquiry access");
  }

  if (!participant) {
    return forbidden();
  }

  const { thread, error } = await listThreadForInquiry(context.supabase, id);
  if (error) {
    return serverError("Unable to load inquiry thread");
  }

  return NextResponse.json({ messages: thread });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireActiveApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { id } = await params;
  const { participant, error: participantError } = await getInquiryParticipant(context.supabase, id, context.user.id);

  if (participantError) {
    return serverError("Unable to validate inquiry access");
  }

  if (!participant) {
    return forbidden();
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid payload");
  }

  const parsed = marketplaceMessageCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Invalid message payload");
  }

  const { message, error } = await createMarketplaceMessage(context.supabase, {
    inquiryId: id,
    senderUserId: context.user.id,
    body: parsed.data.body,
  });

  if (error || !message) {
    return serverError("Unable to send message");
  }

  return NextResponse.json({ message }, { status: 201 });
}
