import { NextResponse } from "next/server";
import { extractPdfTextByPage, getOcrProvider, getTermExtractionProvider, isOpenAiConfigured } from "@/lib/legal/extraction";
import { filterCitationBackedTerms } from "@/lib/legal/extraction/validate";
import { badRequest, requireApiUser, serverError } from "@/lib/server/api";
import { getAgreementForUser, getDocumentForUser } from "@/lib/server/legal-agreements";

export const runtime = "nodejs";
export const maxDuration = 60;

function shortErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Extraction failed";
  }

  return error.message.slice(0, 300);
}

function isImageMimeType(mimeType: string) {
  return mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/heic";
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  const context = await requireApiUser();
  if (context.response || !context.user || !context.profile) {
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

  await context.supabase
    .from("legal_agreement_documents")
    .update({ extraction_status: "processing", extraction_error: null })
    .eq("id", document.id)
    .eq("user_id", context.user.id);

  try {
    if (!isOpenAiConfigured()) {
      throw new Error("OpenAI API key is not configured on this deployment. Set OPENAI_API_KEY and redeploy.");
    }

    const { data: fileData, error: fileError } = await context.supabase.storage.from("agreements").download(document.storage_path);

    if (fileError || !fileData) {
      throw new Error("Unable to read agreement document from storage");
    }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer());

    let textByPage: Array<{ page: number; text: string }> = [];

    if (document.mime_type === "application/pdf") {
      textByPage = await extractPdfTextByPage(fileBuffer);
    } else if (isImageMimeType(document.mime_type)) {
      const ocrProvider = getOcrProvider();
      const text = await ocrProvider.extractTextFromImage({
        mimeType: document.mime_type,
        base64: fileBuffer.toString("base64"),
      });
      textByPage = [{ page: 1, text }];
    } else {
      throw new Error("Unsupported document type for extraction");
    }

    const combinedSourceText = textByPage.map((entry) => entry.text).join("\n\n").trim();
    if (!combinedSourceText) {
      throw new Error("No readable text found in uploaded document");
    }

    const termProvider = getTermExtractionProvider();
    const extractedTerms = await termProvider.extractTerms({
      agreement,
      document,
      textByPage,
      jurisdiction: context.profile.jurisdiction,
    });

    const citationBackedTerms = filterCitationBackedTerms(extractedTerms, combinedSourceText);

    const { error: clearError } = await context.supabase
      .from("legal_agreement_terms")
      .delete()
      .eq("user_id", context.user.id)
      .eq("source_document_id", document.id);

    if (clearError) {
      throw new Error("Unable to clear existing extracted terms");
    }

    if (citationBackedTerms.length > 0) {
      const inserts = citationBackedTerms.map((term) => ({
        id: crypto.randomUUID(),
        agreement_id: agreement.id,
        user_id: context.user.id,
        term_type: term.term_type,
        term_payload: term.term_payload,
        impact_direction: term.impact_direction,
        confidence: term.confidence,
        citation: term.citation,
        source_document_id: document.id,
      }));

      const { error: insertError } = await context.supabase.from("legal_agreement_terms").insert(inserts);
      if (insertError) {
        throw new Error("Unable to save extracted agreement terms");
      }
    }

    const nextSourceStatus = citationBackedTerms.length > 0 ? "terms_extracted" : "extraction_failed";

    const { data: updatedDocument, error: updateError } = await context.supabase
      .from("legal_agreement_documents")
      .update({ extraction_status: "completed", extraction_error: null, processed_at: new Date().toISOString() })
      .eq("id", document.id)
      .eq("user_id", context.user.id)
      .select(
        "id,agreement_id,user_id,file_name,mime_type,size_bytes,storage_path,extraction_status,extraction_error,processed_at,created_at,updated_at"
      )
      .single();

    if (updateError || !updatedDocument) {
      throw new Error("Unable to update extraction status");
    }

    await context.supabase
      .from("legal_agreements")
      .update({ source_status: nextSourceStatus })
      .eq("id", agreement.id)
      .eq("user_id", context.user.id);

    return NextResponse.json({ document: updatedDocument, extracted_terms_count: citationBackedTerms.length });
  } catch (error) {
    const errorMessage = shortErrorMessage(error);
    const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : { error };

    console.error("Legal agreement extraction failed", {
      agreementId: id,
      documentId,
      userId: context.user.id,
      ...errorDetails,
    });

    await context.supabase
      .from("legal_agreement_documents")
      .update({ extraction_status: "failed", extraction_error: errorMessage })
      .eq("id", document.id)
      .eq("user_id", context.user.id);

    await context.supabase
      .from("legal_agreements")
      .update({ source_status: "extraction_failed" })
      .eq("id", agreement.id)
      .eq("user_id", context.user.id);

    return serverError(errorMessage);
  }
}
