import { extractedTermsPayloadSchema } from "@/lib/legal/schemas";
import type { AgreementTermExtractionInput, OcrProvider, TermExtractionProvider } from "@/lib/legal/types";

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_OCR_MODEL = process.env.OPENAI_OCR_MODEL ?? "gpt-4.1-mini";
const OPENAI_EXTRACTION_MODEL = process.env.OPENAI_EXTRACTION_MODEL ?? "gpt-4.1-mini";
const OPENAI_API_KEY_ENV_KEYS = ["OPENAI_API_KEY", "OPENAI_KEY"] as const;

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

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
  return response.choices?.[0]?.message?.content?.trim() ?? "";
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
    const parsedJson = JSON.parse(rawContent) as unknown;
    const parsed = extractedTermsPayloadSchema.safeParse(parsedJson);

    if (!parsed.success) {
      throw new Error("Unable to parse extracted agreement terms");
    }

    return parsed.data.terms;
  }
}
