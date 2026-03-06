"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { MarketplaceInquiryStatus, MarketplaceThreadMessage } from "@/lib/marketplace/types";

type Props = {
  inquiryId: string;
  currentUserId: string;
  mode: "client" | "advisor";
  initialStatus: MarketplaceInquiryStatus;
};

type InquiryPayload = {
  inquiry: {
    status: MarketplaceInquiryStatus;
  };
  participant_role: "requester" | "advisor";
};

export default function ChatThread({ inquiryId, currentUserId, mode, initialStatus }: Props) {
  const [thread, setThread] = useState<MarketplaceThreadMessage[]>([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [inquiryStatus, setInquiryStatus] = useState<MarketplaceInquiryStatus>(initialStatus);
  const [participantRole, setParticipantRole] = useState<"requester" | "advisor">("requester");

  const refreshThread = useCallback(async () => {
    const [threadRes, inquiryRes] = await Promise.all([
      fetch(`/api/marketplace/inquiries/${inquiryId}/messages`, { cache: "no-store" }),
      fetch(`/api/marketplace/inquiries/${inquiryId}`, { cache: "no-store" }),
    ]);

    if (threadRes.ok) {
      const payload = (await threadRes.json()) as { messages?: MarketplaceThreadMessage[] };
      setThread(payload.messages ?? []);
    }

    if (inquiryRes.ok) {
      const payload = (await inquiryRes.json()) as InquiryPayload;
      setInquiryStatus(payload.inquiry.status);
      setParticipantRole(payload.participant_role);
    }
  }, [inquiryId]);

  useEffect(() => {
    void refreshThread();

    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`marketplace-inquiry-${inquiryId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marketplace_messages", filter: `inquiry_id=eq.${inquiryId}` },
        () => {
          void refreshThread();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_message_attachments",
          filter: `inquiry_id=eq.${inquiryId}`,
        },
        () => {
          void refreshThread();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marketplace_inquiries", filter: `id=eq.${inquiryId}` },
        () => {
          void refreshThread();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [inquiryId, refreshThread]);

  const canUpdateStatus = useMemo(() => mode === "advisor" && participantRole === "advisor", [mode, participantRole]);

  async function onSubmitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const sendRes = await fetch(`/api/marketplace/inquiries/${inquiryId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      });

      const sendPayload = (await sendRes.json()) as { message?: { id: string }; error?: string };

      if (!sendRes.ok || !sendPayload.message) {
        setStatusMessage(sendPayload.error ?? "Unable to send message");
        return;
      }

      if (file) {
        const formData = new FormData();
        formData.set("message_id", sendPayload.message.id);
        formData.set("file", file);

        const attachmentRes = await fetch(`/api/marketplace/inquiries/${inquiryId}/attachments`, {
          method: "POST",
          body: formData,
        });

        if (!attachmentRes.ok) {
          const attachmentPayload = (await attachmentRes.json()) as { error?: string };
          setStatusMessage(attachmentPayload.error ?? "Message sent but attachment failed");
        }
      }

      setBody("");
      setFile(null);
      await refreshThread();
    } catch {
      setStatusMessage("Unable to send message");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(nextStatus: MarketplaceInquiryStatus) {
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/marketplace/advisor/inquiries/${inquiryId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = (await response.json()) as { inquiry?: { status: MarketplaceInquiryStatus }; error?: string };

      if (!response.ok || !payload.inquiry) {
        setStatusMessage(payload.error ?? "Unable to update status");
        return;
      }

      setInquiryStatus(payload.inquiry.status);
      await refreshThread();
    } catch {
      setStatusMessage("Unable to update status");
    }
  }

  return (
    <div className="marketplace-thread-wrap">
      <div className="marketplace-thread-header">
        <h3>Conversation</h3>
        <p className="dashboard-status">Status: {inquiryStatus}</p>
      </div>

      {canUpdateStatus ? (
        <div className="marketplace-status-actions">
          <button
            type="button"
            className="dashboard-btn-ghost"
            disabled={inquiryStatus === "contacted"}
            onClick={() => updateStatus("contacted")}
          >
            Mark contacted
          </button>
          <button
            type="button"
            className="dashboard-btn-ghost"
            disabled={inquiryStatus === "closed"}
            onClick={() => updateStatus("closed")}
          >
            Close inquiry
          </button>
        </div>
      ) : null}

      <div className="marketplace-thread-list">
        {thread.length === 0 ? <p className="dashboard-status">No messages yet.</p> : null}

        {thread.map((message) => (
          <article key={message.id} className="marketplace-thread-item">
            <p className="marketplace-thread-meta">
              <strong>{message.sender_user_id === currentUserId ? "You" : "Participant"}</strong> ·{" "}
              {new Date(message.created_at).toLocaleString()}
            </p>
            <p>{message.body}</p>

            {message.attachments.length > 0 ? (
              <ul className="marketplace-attachments-list">
                {message.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <a href={`/api/marketplace/inquiries/${inquiryId}/attachments?path=${encodeURIComponent(attachment.storage_path)}`}>
                      {attachment.file_name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>

      <form onSubmit={onSubmitMessage} className="marketplace-composer">
        <label>
          Message
          <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={5000} required />
        </label>

        <label>
          Attachment (optional)
          <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </label>

        <button type="submit" className="dashboard-btn-ghost" disabled={submitting}>
          {submitting ? "Sending..." : "Send"}
        </button>
        {statusMessage ? <p className="dashboard-status">{statusMessage}</p> : null}
      </form>
    </div>
  );
}
