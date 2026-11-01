import type { Metadata } from "next";
import { MoneyTrackerScreen } from "@/features/money-tracker";
import { getServerMessage } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await getServerMessage("money.title") };
}

export default function MoneyTrackerPage() {
  return <MoneyTrackerScreen />;
}
