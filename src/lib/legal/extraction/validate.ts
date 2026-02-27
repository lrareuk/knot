import type { ExtractedTerm } from "@/lib/legal/schemas";

function normalizeText(input: string) {
  return input.replace(/\s+/g, " ").trim().toLowerCase();
}

export function citationQuoteExistsInSource(quote: string, sourceText: string): boolean {
  const normalizedQuote = normalizeText(quote);
  if (!normalizedQuote) {
    return false;
  }

  const normalizedSource = normalizeText(sourceText);
  return normalizedSource.includes(normalizedQuote);
}

export function filterCitationBackedTerms(terms: ExtractedTerm[], sourceText: string): ExtractedTerm[] {
  return terms.filter((term) => citationQuoteExistsInSource(term.citation.quote, sourceText));
}
