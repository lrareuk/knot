import { extractedTermSchema, extractedTermsPayloadSchema } from "@/lib/legal/schemas";
import type { AgreementTermExtractionInput, OcrProvider, TermExtractionProvider } from "@/lib/legal/types";

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_OCR_MODEL = process.env.OPENAI_OCR_MODEL ?? "gpt-4.1-mini";
const OPENAI_EXTRACTION_MODEL = process.env.OPENAI_EXTRACTION_MODEL ?? "gpt-4.1-mini";
const OPENAI_API_KEY_ENV_KEYS = ["OPENAI_API_KEY", "OPENAI_KEY"] as const;

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
};

const TERM_TYPES = new Set([
  "spousal_support_waiver",
  "spousal_support_cap",
  "separate_property_exclusion",
  "pension_exclusion",
  "debt_allocation_rule",
  "asset_split_ratio",
  "marital_home_allocation",
  "sunset_clause",
  "choice_of_law",
  "other_material_term",
]);

const TERM_TYPE_ALIASES = new Map<string, string>([
  ["spousal_maintenance_waiver", "spousal_support_waiver"],
  ["alimony_waiver", "spousal_support_waiver"],
  ["spousal_support_limit", "spousal_support_cap"],
  ["maintenance_cap", "spousal_support_cap"],
  ["separate_property_clause", "separate_property_exclusion"],
  ["retirement_exclusion", "pension_exclusion"],
  ["debt_allocation", "debt_allocation_rule"],
  ["debt_rule", "debt_allocation_rule"],
  ["division_ratio", "asset_split_ratio"],
  ["split_ratio", "asset_split_ratio"],
  ["marital_home", "marital_home_allocation"],
  ["home_allocation", "marital_home_allocation"],
  ["governing_law", "choice_of_law"],
]);

const IMPACT_DIRECTIONS = new Set(["weakens_user", "benefits_user", "neutral", "unknown"]);

const IMPACT_DIRECTION_ALIASES = new Map<string, string>([
  ["harms_user", "weakens_user"],
  ["disadvantages_user", "weakens_user"],
  ["unfavorable_to_user", "weakens_user"],
  ["favors_user", "benefits_user"],
  ["supports_user", "benefits_user"],
]);

function readOpenAiKeyFromEnv() {
  for (const envKey of OPENAI_API_KEY_ENV_KEYS) {
    const value = process.env[envKey]?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

export function hasOpenAiApiKey() {
  return Boolean(readOpenAiKeyFromEnv());
}

function requireOpenAiKey() {
  const key = readOpenAiKeyFromEnv();
  if (!key) {
    throw new Error("OpenAI API key is missing. Configure OPENAI_API_KEY (or OPENAI_KEY) and redeploy.");
  }
  return key;
}

async function postChatCompletion(payload: Record<string, unknown>): Promise<ChatCompletionResponse> {
  const apiKey = requireOpenAiKey();
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as ChatCompletionResponse;
}

function textFromResponse(response: ChatCompletionResponse): string {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item?.text === "string" ? item.text : ""))
      .join("")
      .trim();
  }

  return "";
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeToken(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function pickString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return null;
}

function parsePositiveInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
}

function normalizeConfidence(value: unknown): number {
  let parsed: number | null = null;

  if (typeof value === "number" && Number.isFinite(value)) {
    parsed = value;
  } else if (typeof value === "string") {
    const trimmed = value.trim().replace(/%$/, "");
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      parsed = numeric;
    }
  }

  if (parsed === null) {
    return 0.5;
  }

  if (parsed > 1 && parsed <= 100) {
    parsed /= 100;
  }

  if (parsed < 0) {
    return 0;
  }

  if (parsed > 1) {
    return 1;
  }

  return parsed;
}

function normalizeTermType(value: unknown): string {
  const normalized = normalizeToken(value);
  if (!normalized) {
    return "other_material_term";
  }

  if (TERM_TYPES.has(normalized)) {
    return normalized;
  }

  return TERM_TYPE_ALIASES.get(normalized) ?? "other_material_term";
}

function normalizeImpactDirection(value: unknown): string {
  const normalized = normalizeToken(value);
  if (!normalized) {
    return "unknown";
  }

  if (IMPACT_DIRECTIONS.has(normalized)) {
    return normalized;
  }

  return IMPACT_DIRECTION_ALIASES.get(normalized) ?? "unknown";
}

function parseModelJson(rawContent: string): unknown | null {
  const trimmed = rawContent.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    // Continue with fallback parsing.
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (fenced) {
    try {
      return JSON.parse(fenced.trim()) as unknown;
    } catch {
      // Continue with fallback parsing.
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      // Ignore.
    }
  }

  return null;
}

function extractRawTerms(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const objectPayload = asObject(payload);
  if (!objectPayload) {
    return [];
  }

  const candidateArrays = [
    objectPayload.terms,
    objectPayload.extracted_terms,
    objectPayload.extractedTerms,
    objectPayload.clauses,
    objectPayload.items,
    objectPayload.results,
  ];

  for (const candidate of candidateArrays) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function normalizeCitation(term: Record<string, unknown>) {
  const citation = asObject(term.citation) ?? {};

  const quote = pickString([
    citation.quote,
    citation.text,
    citation.excerpt,
    term.quote,
    term.excerpt,
    term.clause_text,
    term.clause_quote,
  ]);

  if (!quote) {
    return null;
  }

  const normalizedCitation: Record<string, unknown> = { quote };

  const page = parsePositiveInt(citation.page ?? term.page ?? term.page_number);
  if (page !== undefined) {
    normalizedCitation.page = page;
  }

  const section = pickString([citation.section, citation.clause, term.section, term.clause]);
  if (section) {
    normalizedCitation.section = section;
  }

  const note = pickString([citation.note, term.note, term.reasoning]);
  if (note) {
    normalizedCitation.note = note;
  }

  return normalizedCitation;
}

export function parseExtractedTermsFromModelContent(rawContent: string) {
  const parsedJson = parseModelJson(rawContent);
  if (!parsedJson) {
    return [];
  }

  const strict = extractedTermsPayloadSchema.safeParse(parsedJson);
  if (strict.success) {
    return strict.data.terms;
  }

  const normalizedTerms: Record<string, unknown>[] = [];

  for (const rawTerm of extractRawTerms(parsedJson)) {
    const term = asObject(rawTerm);
    if (!term) {
      continue;
    }

    const citation = normalizeCitation(term);
    if (!citation) {
      continue;
    }

    normalizedTerms.push({
      term_type: normalizeTermType(term.term_type ?? term.type ?? term.category ?? term.clause_type),
      term_payload: asObject(term.term_payload ?? term.payload ?? term.details) ?? {},
      impact_direction: normalizeImpactDirection(term.impact_direction ?? term.impact ?? term.direction),
      confidence: normalizeConfidence(term.confidence ?? term.confidence_score ?? term.score),
      citation,
    });
  }

  const parsedTerms = [];
  for (const candidate of normalizedTerms) {
    const parsedTerm = extractedTermSchema.safeParse(candidate);
    if (parsedTerm.success) {
      parsedTerms.push(parsedTerm.data);
    }
  }

  return parsedTerms;
}

export class OpenAiOcrProvider implements OcrProvider {
  async extractTextFromImage(input: { mimeType: string; base64: string }) {
    const response = await postChatCompletion({
      model: OPENAI_OCR_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe this legal document image exactly. Return only plain text with no commentary.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${input.mimeType};base64,${input.base64}`,
              },
            },
          ],
        },
      ],
    });

    return textFromResponse(response);
  }
}

export class OpenAiTermExtractionProvider implements TermExtractionProvider {
  async extractTerms(input: AgreementTermExtractionInput) {
    const combinedText = input.textByPage.map((entry) => `Page ${entry.page}:\n${entry.text}`).join("\n\n");

    const response = await postChatCompletion({
      model: OPENAI_EXTRACTION_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract legal agreement terms relevant to divorce/separation modelling. Return strict JSON as {\"terms\":[...]} with citation.quote for every term.",
        },
        {
          role: "user",
          content: JSON.stringify({
            jurisdiction: input.jurisdiction,
            agreement_type: input.agreement.agreement_type,
            agreement_summary: input.agreement.user_summary,
            source_text: combinedText,
            allowed_term_types: [
              "spousal_support_waiver",
              "spousal_support_cap",
              "separate_property_exclusion",
              "pension_exclusion",
              "debt_allocation_rule",
              "asset_split_ratio",
              "marital_home_allocation",
              "sunset_clause",
              "choice_of_law",
              "other_material_term",
            ],
          }),
        },
      ],
    });

    const rawContent = textFromResponse(response);
    return parseExtractedTermsFromModelContent(rawContent);
  }
}
