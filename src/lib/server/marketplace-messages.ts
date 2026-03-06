import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MarketplaceMessage,
  MarketplaceMessageAttachment,
  MarketplaceThreadMessage,
} from "@/lib/marketplace/types";

const MARKETPLACE_MESSAGE_SELECT = "id,inquiry_id,sender_user_id,body,created_at,updated_at";
const MARKETPLACE_ATTACHMENT_SELECT =
  "id,inquiry_id,message_id,uploader_user_id,storage_bucket,storage_path,file_name,mime_type,size_bytes,created_at,updated_at";

export async function listMessagesForInquiry(supabase: SupabaseClient, inquiryId: string) {
  const { data, error } = await supabase
    .from("marketplace_messages")
    .select(MARKETPLACE_MESSAGE_SELECT)
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: true });

  return {
    messages: (data ?? []) as MarketplaceMessage[],
    error,
  };
}

export async function listAttachmentsForInquiry(supabase: SupabaseClient, inquiryId: string) {
  const { data, error } = await supabase
    .from("marketplace_message_attachments")
    .select(MARKETPLACE_ATTACHMENT_SELECT)
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: true });

  return {
    attachments: (data ?? []) as MarketplaceMessageAttachment[],
    error,
  };
}

export async function listThreadForInquiry(
  supabase: SupabaseClient,
  inquiryId: string
): Promise<{ thread: MarketplaceThreadMessage[]; error: unknown }> {
  const [messagesRes, attachmentsRes] = await Promise.all([
    listMessagesForInquiry(supabase, inquiryId),
    listAttachmentsForInquiry(supabase, inquiryId),
  ]);

  if (messagesRes.error || attachmentsRes.error) {
    return {
      thread: [],
      error: messagesRes.error ?? attachmentsRes.error,
    };
  }

  const groupedAttachments = new Map<string, MarketplaceMessageAttachment[]>();
  for (const attachment of attachmentsRes.attachments) {
    const current = groupedAttachments.get(attachment.message_id) ?? [];
    current.push(attachment);
    groupedAttachments.set(attachment.message_id, current);
  }

  const thread = messagesRes.messages.map((message) => ({
    ...message,
    attachments: groupedAttachments.get(message.id) ?? [],
  }));

  return {
    thread,
    error: null,
  };
}

export async function createMarketplaceMessage(
  supabase: SupabaseClient,
  input: {
    inquiryId: string;
    senderUserId: string;
    body: string;
  }
) {
  const { data, error } = await supabase
    .from("marketplace_messages")
    .insert({
      inquiry_id: input.inquiryId,
      sender_user_id: input.senderUserId,
      body: input.body,
    })
    .select(MARKETPLACE_MESSAGE_SELECT)
    .single<MarketplaceMessage>();

  if (!error && data) {
    await supabase.from("marketplace_inquiry_events").insert({
      inquiry_id: input.inquiryId,
      actor_user_id: input.senderUserId,
      event_type: "message_sent",
      event_payload: {
        message_id: data.id,
      },
    });
  }

  return {
    message: data ?? null,
    error,
  };
}

export async function getMarketplaceMessageById(supabase: SupabaseClient, messageId: string) {
  const { data, error } = await supabase
    .from("marketplace_messages")
    .select(MARKETPLACE_MESSAGE_SELECT)
    .eq("id", messageId)
    .maybeSingle<MarketplaceMessage>();

  return {
    message: data ?? null,
    error,
  };
}

export async function createMarketplaceAttachment(
  supabase: SupabaseClient,
  input: {
    inquiryId: string;
    messageId: string;
    uploaderUserId: string;
    storagePath: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }
) {
  const { data, error } = await supabase
    .from("marketplace_message_attachments")
    .insert({
      inquiry_id: input.inquiryId,
      message_id: input.messageId,
      uploader_user_id: input.uploaderUserId,
      storage_bucket: "marketplace-chat",
      storage_path: input.storagePath,
      file_name: input.fileName,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
    })
    .select(MARKETPLACE_ATTACHMENT_SELECT)
    .single<MarketplaceMessageAttachment>();

  if (!error && data) {
    await supabase.from("marketplace_inquiry_events").insert({
      inquiry_id: input.inquiryId,
      actor_user_id: input.uploaderUserId,
      event_type: "attachment_added",
      event_payload: {
        message_id: input.messageId,
        attachment_id: data.id,
      },
    });
  }

  return {
    attachment: data ?? null,
    error,
  };
}

export async function createAttachmentSignedUrl(supabase: SupabaseClient, storagePath: string, ttlSeconds = 60 * 60) {
  const signed = await supabase.storage.from("marketplace-chat").createSignedUrl(storagePath, ttlSeconds);
  return {
    signedUrl: signed.data?.signedUrl ?? null,
    error: signed.error,
  };
}
