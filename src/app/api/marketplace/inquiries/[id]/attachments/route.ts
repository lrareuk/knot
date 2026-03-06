import { NextResponse } from "next/server";
import { badRequest, forbidden, requireActiveApiUser, serverError } from "@/lib/server/api";
import { marketplaceAttachmentCreateSchema } from "@/lib/marketplace/schemas";
import { getInquiryParticipant } from "@/lib/server/marketplace-inquiries";
import {
  createAttachmentSignedUrl,
  createMarketplaceAttachment,
  getMarketplaceMessageById,
} from "@/lib/server/marketplace-messages";

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

function cleanFileName(input: string) {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180) || "attachment";
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

  const formData = await req.formData().catch(() => null);
  const maybeFile = formData?.get("file");
  const messageId = formData?.get("message_id");

  if (!(maybeFile instanceof File)) {
    return badRequest("Attachment upload requires a file");
  }

  const payloadParse = marketplaceAttachmentCreateSchema.safeParse({
    message_id: typeof messageId === "string" ? messageId : "",
  });

  if (!payloadParse.success) {
    return badRequest("Invalid attachment payload");
  }

  if (maybeFile.size > MAX_ATTACHMENT_BYTES) {
    return badRequest("Attachment exceeds 25MB limit");
  }

  const { message, error: messageError } = await getMarketplaceMessageById(context.supabase, payloadParse.data.message_id);

  if (messageError || !message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (message.inquiry_id !== id) {
    return badRequest("Message does not belong to this inquiry");
  }

  if (message.sender_user_id !== context.user.id) {
    return forbidden("You can only attach files to your own messages");
  }

  const safeFileName = cleanFileName(maybeFile.name);
  const storagePath = `${id}/${message.id}/${crypto.randomUUID()}-${safeFileName}`;
  const content = await maybeFile.arrayBuffer();

  const upload = await context.supabase.storage
    .from("marketplace-chat")
    .upload(storagePath, content, { contentType: maybeFile.type || "application/octet-stream", upsert: false });

  if (upload.error) {
    return serverError("Unable to upload attachment");
  }

  const { attachment, error } = await createMarketplaceAttachment(context.supabase, {
    inquiryId: id,
    messageId: message.id,
    uploaderUserId: context.user.id,
    storagePath,
    fileName: safeFileName,
    mimeType: maybeFile.type || "application/octet-stream",
    sizeBytes: maybeFile.size,
  });

  if (error || !attachment) {
    await context.supabase.storage.from("marketplace-chat").remove([storagePath]);
    return serverError("Unable to save attachment metadata");
  }

  const { signedUrl } = await createAttachmentSignedUrl(context.supabase, storagePath, 30 * 24 * 60 * 60);

  return NextResponse.json(
    {
      attachment,
      url: signedUrl,
    },
    { status: 201 }
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return badRequest("Missing attachment path");
  }

  if (!path.startsWith(`${id}/`)) {
    return forbidden("Attachment does not belong to this inquiry");
  }

  const { signedUrl, error } = await createAttachmentSignedUrl(context.supabase, path, 5 * 60);
  if (error || !signedUrl) {
    return serverError("Unable to create attachment URL");
  }

  return NextResponse.redirect(signedUrl);
}
