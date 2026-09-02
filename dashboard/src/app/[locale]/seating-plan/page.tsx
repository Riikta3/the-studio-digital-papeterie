import { redirect } from "@/navigation";

/** The seating plan moved under the day-of section. Old links keep working. */
export default async function SeatingPlanRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/jour-j/plan-de-table", locale });
}
