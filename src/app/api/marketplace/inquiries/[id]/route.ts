import { NextResponse } from "next/server";
import { forbidden, requireActiveApiUser, serverError } from "@/lib/server/api";
import { getInquiryById, getInquiryParticipant } from "@/lib/server/marketplace-inquiries";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireActiveApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { id } = await params;
  const [{ inquiry, error: inquiryError }, { participant, error: participantError }] = await Promise.all([
    getInquiryById(context.supabase, id),
    getInquiryParticipant(context.supabase, id, context.user.id),
  ]);

  if (inquiryError || participantError) {
    return serverError("Unable to load inquiry");
  }

  if (!participant || !inquiry) {
    return forbidden();
  }

  return NextResponse.json({ inquiry, participant_role: participant.role });
}
