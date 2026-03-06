import pdfParse from "pdf-parse";
import { hasOpenAiApiKey, OpenAiOcrProvider, OpenAiTermExtractionProvider } from "@/lib/legal/extraction/openai";
import type { OcrProvider, TermExtractionProvider } from "@/lib/legal/types";

const FALLBACK_OCR: OcrProvider = {
  async extractTextFromImage() {
    throw new Error("OCR provider is unavailable. Configure OPENAI_API_KEY (or OPENAI_KEY).");
  },
};

const FALLBACK_TERM_EXTRACTOR: TermExtractionProvider = {
  async extractTerms() {
    throw new Error("Extraction provider is unavailable. Configure OPENAI_API_KEY (or OPENAI_KEY).");
  },
};

export function isOpenAiConfigured() {
  return hasOpenAiApiKey();
}

export function getOcrProvider(): OcrProvider {
  if (isOpenAiConfigured()) {
    return new OpenAiOcrProvider();
  }

  return FALLBACK_OCR;
}

export function getTermExtractionProvider(): TermExtractionProvider {
  if (isOpenAiConfigured()) {
    return new OpenAiTermExtractionProvider();
  }

  return FALLBACK_TERM_EXTRACTOR;
}

export async function extractPdfTextByPage(buffer: Buffer) {
  const parsed = await pdfParse(buffer);
  const text = parsed.text?.trim() ?? "";
  return [{ page: 1, text }];
}
