import { NextResponse } from "next/server";
import { badRequest, requireApiUser, serverError } from "@/lib/server/api";
import { getAgreementForUser, getDocumentForUser } from "@/lib/server/legal-agreements";

const SIGNED_URL_TTL_SECONDS = 30 * 24 * 60 * 60;

export async function GET(_: Request, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { id, documentId } = await params;
  const { agreement, error: agreementError } = await getAgreementForUser(context.supabase, context.user.id, id);
  if (agreementError || !agreement) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  const { document, error: documentError } = await getDocumentForUser(context.supabase, context.user.id, documentId);
  if (documentError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.agreement_id !== agreement.id) {
    return badRequest("Document does not belong to this agreement");
  }

  const signed = await context.supabase.storage.from("agreements").createSignedUrl(document.storage_path, SIGNED_URL_TTL_SECONDS);

  if (signed.error || !signed.data?.signedUrl) {
    return serverError("Unable to create signed URL");
  }

  return NextResponse.json({
    url: signed.data.signedUrl,
    expires_at: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString(),
  });
}
