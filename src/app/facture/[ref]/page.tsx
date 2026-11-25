import { getShopData } from "@/lib/api";
import { InvoiceView } from "./InvoiceView";

export const metadata = { title: "Facture", robots: { index: false } };

export default async function InvoicePage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const { settings } = await getShopData();
  return <InvoiceView refParam={ref} settings={settings} />;
}
