type CurrencyCode = "GBP" | "USD" | "CAD";

function localeForCurrency(currencyCode: CurrencyCode) {
  if (currencyCode === "USD") return "en-US";
  if (currencyCode === "CAD") return "en-CA";
  return "en-GB";
}

export function formatCurrency(value: number, currencyCode: CurrencyCode = "GBP") {
  return new Intl.NumberFormat(localeForCurrency(currencyCode), {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}
