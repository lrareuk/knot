import { NextResponse } from "next/server";
import { badRequest, requireApiUser, serverError } from "@/lib/server/api";
import { getAgreementForUser, getDocumentForUser } from "@/lib/server/legal-agreements";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; documentId: string }> }) {
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

  const { error: termError } = await context.supabase
    .from("legal_agreement_terms")
    .delete()
    .eq("user_id", context.user.id)
    .eq("source_document_id", document.id);

  if (termError) {
    return serverError("Unable to delete agreement terms");
  }

  const { error: deleteError } = await context.supabase
    .from("legal_agreement_documents")
    .delete()
    .eq("id", document.id)
    .eq("user_id", context.user.id);

  if (deleteError) {
    return serverError("Unable to delete document record");
  }

  await context.supabase.storage.from("agreements").remove([document.storage_path]);

  return NextResponse.json({ ok: true });
}
