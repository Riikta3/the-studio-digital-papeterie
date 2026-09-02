import { TableFinder } from "@/components/jourj/TableFinder";

/**
 * `slug` is handed to `TableFinder` so each search can resolve it to a
 * wedding server-side. The component never receives a wedding id: a client
 * holding one could aim the search at a wedding it has never seen, so the
 * only identifier that crosses to the browser is the one already printed on
 * the QR code.
 */
export default async function MaTablePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TableFinder slug={slug} />;
}
