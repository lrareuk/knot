import { NextResponse } from "next/server";
import { badRequest, requireApiUser, serverError } from "@/lib/server/api";
import {
  AGREEMENT_ALLOWED_MIME_TYPES,
  AGREEMENT_MAX_DOCUMENTS,
  AGREEMENT_MAX_FILE_BYTES,
  documentCountForAgreement,
  getAgreementForUser,
} from "@/lib/server/legal-agreements";

function cleanFileName(input: string) {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160) || "agreement";
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { id } = await params;
  const { agreement, error: agreementError } = await getAgreementForUser(context.supabase, context.user.id, id);
  if (agreementError || !agreement) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  const { count, error: countError } = await documentCountForAgreement(context.supabase, context.user.id, agreement.id);
  if (countError) {
    return serverError("Unable to validate document limit");
  }

  if (count >= AGREEMENT_MAX_DOCUMENTS) {
    return badRequest(`Maximum ${AGREEMENT_MAX_DOCUMENTS} documents per agreement`);
  }

  const formData = await req.formData().catch(() => null);
  const maybeFile = formData?.get("file");

  if (!(maybeFile instanceof File)) {
    return badRequest("Document upload requires a file");
  }

  if (!AGREEMENT_ALLOWED_MIME_TYPES.has(maybeFile.type)) {
    return badRequest("Unsupported file type. Use PDF, JPG, PNG, or HEIC");
  }

  if (maybeFile.size > AGREEMENT_MAX_FILE_BYTES) {
    return badRequest("File exceeds 25MB limit");
  }

  const documentId = crypto.randomUUID();
  const fileName = cleanFileName(maybeFile.name);
  const storagePath = `${context.user.id}/${agreement.id}/${documentId}-${fileName}`;
  const arrayBuffer = await maybeFile.arrayBuffer();

  const upload = await context.supabase.storage
    .from("agreements")
    .upload(storagePath, arrayBuffer, { contentType: maybeFile.type, upsert: false });

  if (upload.error) {
    return serverError("Unable to upload agreement document");
  }

  const { data, error } = await context.supabase
    .from("legal_agreement_documents")
    .insert({
      id: documentId,
      agreement_id: agreement.id,
      user_id: context.user.id,
      file_name: fileName,
      mime_type: maybeFile.type,
      size_bytes: maybeFile.size,
      storage_path: storagePath,
      extraction_status: "pending",
    })
    .select(
      "id,agreement_id,user_id,file_name,mime_type,size_bytes,storage_path,extraction_status,extraction_error,processed_at,created_at,updated_at"
    )
    .single();

  if (error || !data) {
    await context.supabase.storage.from("agreements").remove([storagePath]);
    return serverError("Unable to save agreement document");
  }

  await context.supabase
    .from("legal_agreements")
    .update({ source_status: "document_uploaded" })
    .eq("id", agreement.id)
    .eq("user_id", context.user.id);

  return NextResponse.json({ document: data }, { status: 201 });
}
