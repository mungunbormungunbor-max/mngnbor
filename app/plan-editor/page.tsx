import type { Metadata } from "next";
import { PlanEditorScreen } from "@/features/plan-editor";

export const metadata: Metadata = { title: "Edit plan" };

/** /plan-editor edits today; /plan-editor?date=YYYY-MM-DD edits another day (used by plan-calendar). */
export default async function PlanEditorPage({ searchParams }: PageProps<"/plan-editor">) {
  const { date } = await searchParams;
  return <PlanEditorScreen dateParam={typeof date === "string" ? date : null} />;
}
