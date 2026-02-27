function localeForCurrency(currencyCode: "GBP" | "USD" | "CAD") {
  if (currencyCode === "USD") return "en-US";
  if (currencyCode === "CAD") return "en-CA";
  return "en-GB";
}

export function toNumber(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return value;
}

export function currencySymbol(currencyCode: "GBP" | "USD" | "CAD") {
  return (
    new Intl.NumberFormat(localeForCurrency(currencyCode), {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? "$"
  );
}

export function formatMoney(value: number | null | undefined, currencyCode: "GBP" | "USD" | "CAD" = "GBP"): string {
  return new Intl.NumberFormat(localeForCurrency(currencyCode), {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function formatPounds(value: number | null | undefined): string {
  return formatMoney(value, "GBP");
}
