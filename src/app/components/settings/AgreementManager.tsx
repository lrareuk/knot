"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { jurisdictionGroupsForApi } from "@/lib/legal/jurisdictions";
import type { LegalAgreement, LegalAgreementDocument, LegalAgreementTerm } from "@/lib/legal/types";

type Props = {
  initialDisclosure: boolean | null;
};

type AgreementsPayload = {
  has_relevant_agreements: boolean | null;
  agreements: LegalAgreement[];
  documents: LegalAgreementDocument[];
  terms: LegalAgreementTerm[];
};

const AGREEMENT_TYPE_LABELS: Record<LegalAgreement["agreement_type"], string> = {
  prenup: "Prenuptial agreement",
  postnup: "Postnuptial agreement",
  separation: "Separation agreement",
};

function groupTermsByAgreement(terms: LegalAgreementTerm[]) {
  const map = new Map<string, LegalAgreementTerm[]>();
  for (const term of terms) {
    const current = map.get(term.agreement_id) ?? [];
    current.push(term);
    map.set(term.agreement_id, current);
  }
  return map;
}

function groupDocumentsByAgreement(documents: LegalAgreementDocument[]) {
  const map = new Map<string, LegalAgreementDocument[]>();
  for (const document of documents) {
    const current = map.get(document.agreement_id) ?? [];
    current.push(document);
    map.set(document.agreement_id, current);
  }
  return map;
}

export default function AgreementManager({ initialDisclosure }: Props) {
  const [disclosure, setDisclosure] = useState<boolean | null>(initialDisclosure);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreements, setAgreements] = useState<LegalAgreement[]>([]);
  const [documents, setDocuments] = useState<LegalAgreementDocument[]>([]);
  const [terms, setTerms] = useState<LegalAgreementTerm[]>([]);

  const [newAgreementType, setNewAgreementType] = useState<LegalAgreement["agreement_type"]>("prenup");
  const [newAgreementTitle, setNewAgreementTitle] = useState("");
  const [newAgreementJurisdiction, setNewAgreementJurisdiction] = useState("GB-SCT");
  const [newAgreementDate, setNewAgreementDate] = useState("");
  const [newAgreementSummary, setNewAgreementSummary] = useState("");
  const [busyAgreementId, setBusyAgreementId] = useState<string | null>(null);

  const jurisdictionOptions = useMemo(
    () =>
      jurisdictionGroupsForApi().flatMap((country) =>
        country.subdivisions.map((subdivision) => ({
          code: subdivision.code,
          label: `${country.label} · ${subdivision.display_name}`,
        }))
      ),
    []
  );

  const termsByAgreement = useMemo(() => groupTermsByAgreement(terms), [terms]);
  const documentsByAgreement = useMemo(() => groupDocumentsByAgreement(documents), [documents]);

  const loadAgreements = async () => {
    const response = await fetch("/api/agreements", { method: "GET" });
    const payload = (await response.json().catch(() => ({}))) as AgreementsPayload;

    if (!response.ok) {
      setStatus("Unable to load agreement details.");
      return;
    }

    setDisclosure(payload.has_relevant_agreements ?? null);
    setAgreements(payload.agreements ?? []);
    setDocuments(payload.documents ?? []);
    setTerms(payload.terms ?? []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAgreements();
  }, []);

  const saveDisclosure = async (value: boolean) => {
    setLoading(true);
    setStatus(null);

    const response = await fetch("/api/agreements/disclosure", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ has_relevant_agreements: value }),
    });

    const payload = (await response.json().catch(() => ({}))) as { has_relevant_agreements?: boolean; error?: string };
    setLoading(false);

    if (!response.ok) {
      setStatus(payload.error ?? "Unable to save disclosure");
      return;
    }

    setDisclosure(payload.has_relevant_agreements ?? value);
    setStatus("Agreement disclosure saved.");
  };

  const createAgreement = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    const response = await fetch("/api/agreements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agreement_type: newAgreementType,
        title: newAgreementTitle || null,
        governing_jurisdiction: newAgreementJurisdiction,
        effective_date: newAgreementDate || null,
        user_summary: newAgreementSummary || null,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { agreement?: LegalAgreement; error?: string };
    setLoading(false);

    if (!response.ok || !payload.agreement) {
      setStatus(payload.error ?? "Unable to create agreement");
      return;
    }

    setAgreements((current) => [...current, payload.agreement as LegalAgreement]);
    setNewAgreementTitle("");
    setNewAgreementDate("");
    setNewAgreementSummary("");
    setStatus("Agreement added.");
  };

  const saveAgreement = async (agreement: LegalAgreement) => {
    setBusyAgreementId(agreement.id);
    setStatus(null);

    const response = await fetch(`/api/agreements/${agreement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agreement_type: agreement.agreement_type,
        title: agreement.title,
        governing_jurisdiction: agreement.governing_jurisdiction,
        effective_date: agreement.effective_date,
        user_summary: agreement.user_summary,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { agreement?: LegalAgreement; error?: string };
    setBusyAgreementId(null);

    if (!response.ok || !payload.agreement) {
      setStatus(payload.error ?? "Unable to save agreement");
      return;
    }

    setAgreements((current) => current.map((entry) => (entry.id === agreement.id ? (payload.agreement as LegalAgreement) : entry)));
    setStatus("Agreement updated.");
  };

  const onUploadDocument = async (agreementId: string, file: File) => {
    setBusyAgreementId(agreementId);
    setStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/agreements/${agreementId}/documents`, {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json().catch(() => ({}))) as { document?: LegalAgreementDocument; error?: string };
    setBusyAgreementId(null);

    if (!response.ok || !payload.document) {
      setStatus(payload.error ?? "Unable to upload document");
      return;
    }

    setDocuments((current) => [...current, payload.document as LegalAgreementDocument]);
    setStatus("Document uploaded.");
  };

  const extractTerms = async (agreementId: string, documentId: string) => {
    setBusyAgreementId(agreementId);
    setStatus(null);

    const response = await fetch(`/api/agreements/${agreementId}/documents/${documentId}/extract`, {
      method: "POST",
    });

    const payload = (await response.json().catch(() => ({}))) as {
      document?: LegalAgreementDocument;
      extracted_terms_count?: number;
      error?: string;
    };

    setBusyAgreementId(null);

    if (!response.ok || !payload.document) {
      setStatus(payload.error ?? "Unable to extract terms");
      return;
    }

    setDocuments((current) => current.map((entry) => (entry.id === documentId ? (payload.document as LegalAgreementDocument) : entry)));
    await loadAgreements();
    setStatus(`Extraction complete (${payload.extracted_terms_count ?? 0} citation-backed terms).`);
  };

  const downloadDocument = async (agreementId: string, documentId: string) => {
    setBusyAgreementId(agreementId);
    setStatus(null);

    const response = await fetch(`/api/agreements/${agreementId}/documents/${documentId}/download`);
    const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
    setBusyAgreementId(null);

    if (!response.ok || !payload.url) {
      setStatus(payload.error ?? "Unable to create download link");
      return;
    }

    window.open(payload.url, "_blank", "noopener,noreferrer");
  };

  const removeDocument = async (agreementId: string, documentId: string) => {
    setBusyAgreementId(agreementId);
    setStatus(null);

    const response = await fetch(`/api/agreements/${agreementId}/documents/${documentId}`, { method: "DELETE" });
    const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setBusyAgreementId(null);

    if (!response.ok || !payload.ok) {
      setStatus(payload.error ?? "Unable to delete document");
      return;
    }

    setDocuments((current) => current.filter((entry) => entry.id !== documentId));
    setTerms((current) => current.filter((entry) => entry.source_document_id !== documentId));
    setStatus("Document removed.");
  };

  return (
    <section className="dashboard-settings-section">
      <h2 className="dashboard-scenario-name">Legal agreements</h2>
      <p className="dashboard-help">
        Tell us if any prenup, postnup, or separation agreement could affect your financial position.
      </p>

      <div className="dashboard-inline-actions">
        <button type="button" className="dashboard-btn-ghost" onClick={() => void saveDisclosure(true)} disabled={loading}>
          Yes, I have one
        </button>
        <button type="button" className="dashboard-btn-ghost" onClick={() => void saveDisclosure(false)} disabled={loading}>
          No relevant agreement
        </button>
      </div>

      <p className="dashboard-status">Current disclosure: {disclosure === null ? "Not answered" : disclosure ? "Yes" : "No"}</p>

      {disclosure ? (
        <>
          <form className="stack-sm" onSubmit={createAgreement}>
            <label>
              Agreement type
              <select
                className="dashboard-select"
                value={newAgreementType}
                onChange={(event) => setNewAgreementType(event.target.value as LegalAgreement["agreement_type"])}
              >
                <option value="prenup">Prenup</option>
                <option value="postnup">Postnup</option>
                <option value="separation">Separation agreement</option>
              </select>
            </label>

            <label>
              Title
              <input
                className="dashboard-input"
                value={newAgreementTitle}
                onChange={(event) => setNewAgreementTitle(event.target.value)}
                placeholder="e.g. 2018 Prenuptial Agreement"
              />
            </label>

            <label>
              Governing jurisdiction
              <select
                className="dashboard-select"
                value={newAgreementJurisdiction}
                onChange={(event) => setNewAgreementJurisdiction(event.target.value)}
              >
                {jurisdictionOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Effective date
              <input className="dashboard-input" type="date" value={newAgreementDate} onChange={(event) => setNewAgreementDate(event.target.value)} />
            </label>

            <label>
              Summary
              <textarea
                className="dashboard-input"
                rows={4}
                value={newAgreementSummary}
                onChange={(event) => setNewAgreementSummary(event.target.value)}
                placeholder="Describe key terms or constraints"
              />
            </label>

            <button type="submit" className="dashboard-btn" disabled={loading}>
              {loading ? "Saving..." : "Add agreement"}
            </button>
          </form>

          <div className="stack-md" style={{ marginTop: 20 }}>
            {agreements.length === 0 ? <p className="dashboard-status">No agreements added yet.</p> : null}

            {agreements.map((agreement) => {
              const agreementDocuments = documentsByAgreement.get(agreement.id) ?? [];
              const agreementTerms = termsByAgreement.get(agreement.id) ?? [];

              return (
                <article key={agreement.id} className="dashboard-scenario-card stack-sm">
                  <h3>{AGREEMENT_TYPE_LABELS[agreement.agreement_type]}</h3>

                  <label>
                    Title
                    <input
                      className="dashboard-input"
                      value={agreement.title ?? ""}
                      onChange={(event) =>
                        setAgreements((current) =>
                          current.map((entry) => (entry.id === agreement.id ? { ...entry, title: event.target.value } : entry))
                        )
                      }
                    />
                  </label>

                  <label>
                    Governing jurisdiction
                    <select
                      className="dashboard-select"
                      value={agreement.governing_jurisdiction ?? "GB-SCT"}
                      onChange={(event) =>
                        setAgreements((current) =>
                          current.map((entry) =>
                            entry.id === agreement.id ? { ...entry, governing_jurisdiction: event.target.value } : entry
                          )
                        )
                      }
                    >
                      {jurisdictionOptions.map((option) => (
                        <option key={option.code} value={option.code}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Effective date
                    <input
                      className="dashboard-input"
                      type="date"
                      value={agreement.effective_date ?? ""}
                      onChange={(event) =>
                        setAgreements((current) =>
                          current.map((entry) =>
                            entry.id === agreement.id ? { ...entry, effective_date: event.target.value || null } : entry
                          )
                        )
                      }
                    />
                  </label>

                  <label>
                    Summary
                    <textarea
                      className="dashboard-input"
                      rows={3}
                      value={agreement.user_summary ?? ""}
                      onChange={(event) =>
                        setAgreements((current) =>
                          current.map((entry) =>
                            entry.id === agreement.id ? { ...entry, user_summary: event.target.value } : entry
                          )
                        )
                      }
                    />
                  </label>

                  <div className="dashboard-inline-actions">
                    <button
                      type="button"
                      className="dashboard-btn-ghost"
                      onClick={() => void saveAgreement(agreement)}
                      disabled={busyAgreementId === agreement.id}
                    >
                      {busyAgreementId === agreement.id ? "Saving..." : "Save agreement"}
                    </button>

                    <label className="dashboard-btn-ghost" style={{ display: "inline-flex", cursor: "pointer" }}>
                      Upload document
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/heic"
                        style={{ display: "none" }}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }
                          void onUploadDocument(agreement.id, file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <p className="dashboard-status">Source status: {agreement.source_status.replaceAll("_", " ")}</p>

                  {agreementDocuments.length > 0 ? (
                    <div className="stack-xs">
                      <strong>Documents</strong>
                      {agreementDocuments.map((document) => (
                        <div key={document.id} className="dashboard-inline-actions dashboard-inline-actions-between">
                          <span>
                            {document.file_name} ({document.extraction_status})
                          </span>
                          <div className="dashboard-inline-actions">
                            <button
                              type="button"
                              className="dashboard-btn-text"
                              onClick={() => void extractTerms(agreement.id, document.id)}
                              disabled={busyAgreementId === agreement.id}
                            >
                              Extract
                            </button>
                            <button
                              type="button"
                              className="dashboard-btn-text"
                              onClick={() => void downloadDocument(agreement.id, document.id)}
                              disabled={busyAgreementId === agreement.id}
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              className="dashboard-btn-text is-danger"
                              onClick={() => void removeDocument(agreement.id, document.id)}
                              disabled={busyAgreementId === agreement.id}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {agreementTerms.length > 0 ? (
                    <div className="stack-xs">
                      <strong>Extracted terms</strong>
                      {agreementTerms.map((term) => (
                        <div key={term.id} className="dashboard-status">
                          <p>
                            <strong>{term.term_type}</strong> ({Math.round(term.confidence * 100)}% confidence)
                          </p>
                          <p>
                            Citation: &quot;{term.citation.quote}&quot;{term.citation.page ? ` (page ${term.citation.page})` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      ) : null}

      {status ? <p className="dashboard-status">{status}</p> : null}
    </section>
  );
}
