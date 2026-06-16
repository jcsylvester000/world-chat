// Client-side invoice PDF generator (jsPDF). Dynamically imported so it never
// runs on the server. Produces a branded, downloadable A4 invoice.
import { formatPeso, formatDate } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

const COMPANY = {
  name: "WorldChat",
  tagline: "Commercial Real Estate Marketplace",
  email: "billing@worldchat.dev",
};

export async function downloadInvoicePdf(inv: Invoice): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = 56;

  const ink = [15, 23, 42] as const;
  const muted = [100, 116, 139] as const;
  const brand = [37, 99, 235] as const;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...brand);
  doc.text(COMPANY.name, M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text(COMPANY.tagline, M, y + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...ink);
  doc.text("INVOICE", W - M, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text(inv.number, W - M, y + 16, { align: "right" });

  y += 44;
  doc.setDrawColor(226, 232, 240);
  doc.line(M, y, W - M, y);
  y += 28;

  // Bill to + meta
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("BILLED TO", M, y);
  doc.text("INVOICE DETAILS", W / 2, y);
  doc.setFontSize(11);
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.text(inv.userEmail, M, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const meta: [string, string][] = [
    ["Issued", formatDate(inv.issuedAt)],
    ["Due date", formatDate(inv.dueDate)],
    ["Status", inv.status === "paid" ? "PAID" : "VOID"],
  ];
  meta.forEach(([k, v], i) => {
    const yy = y + 14 + i * 16;
    doc.setTextColor(...muted);
    doc.text(k, W / 2, yy);
    doc.setTextColor(...ink);
    doc.text(v, W - M, yy, { align: "right" });
  });

  y += 84;

  // Line-item table
  doc.setFillColor(241, 245, 249);
  doc.rect(M, y, W - 2 * M, 26, "F");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("DESCRIPTION", M + 12, y + 17);
  doc.text("AMOUNT", W - M - 12, y + 17, { align: "right" });
  y += 26;

  const planName = inv.plan === "premium" ? "Premium" : "Basic";
  const desc = `${planName} subscription (${inv.interval})`;
  const period = `Billing period: ${formatDate(inv.periodStart)} – ${formatDate(inv.periodEnd)}`;
  doc.setTextColor(...ink);
  doc.setFontSize(11);
  doc.text(desc, M + 12, y + 22);
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(period, M + 12, y + 38);
  doc.setFontSize(11);
  doc.setTextColor(...ink);
  doc.text(formatPeso(inv.amount), W - M - 12, y + 22, { align: "right" });
  y += 54;
  doc.setDrawColor(226, 232, 240);
  doc.line(M, y, W - M, y);
  y += 24;

  // Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...ink);
  doc.text("Total", W - M - 140, y, { align: "left" });
  doc.text(formatPeso(inv.amount), W - M - 12, y, { align: "right" });

  y += 40;
  if (inv.reference) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text(`Payment reference: ${inv.reference}`, M, y);
    y += 14;
    doc.text("Proof of payment on file with WorldChat billing.", M, y);
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(
    `Questions? ${COMPANY.email}  ·  Billing runs at the end of each month.`,
    M,
    doc.internal.pageSize.getHeight() - 40
  );

  doc.save(`${inv.number}.pdf`);
}
