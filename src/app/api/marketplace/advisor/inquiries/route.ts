import { NextResponse } from "next/server";
import { requireActiveApiUser, serverError } from "@/lib/server/api";
import { listAdvisorInquiries } from "@/lib/server/marketplace-inquiries";

export async function GET() {
  const context = await requireActiveApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { inquiries, error } = await listAdvisorInquiries(context.supabase, context.user.id);
  if (error) {
    return serverError("Unable to load advisor inquiries");
  }

  return NextResponse.json({ inquiries });
}
