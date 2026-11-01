import type { Metadata } from "next";
import { PlanEditorScreen } from "@/features/plan-editor";
import { getServerMessage } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await getServerMessage("editor.titleOther") };
}

/** /plan-editor edits today; /plan-editor?date=YYYY-MM-DD edits another day (used by plan-calendar). */
export default async function PlanEditorPage({ searchParams }: PageProps<"/plan-editor">) {
  const { date } = await searchParams;
  return <PlanEditorScreen dateParam={typeof date === "string" ? date : null} />;
}
