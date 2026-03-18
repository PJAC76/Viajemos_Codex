export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDateRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short"
  });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}
