import type { Metadata } from "next";
import { TodayViewScreen } from "@/features/today-view";
import { getServerMessage } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await getServerMessage("today.title") };
}

export default function TodayViewPage() {
  return <TodayViewScreen />;
}
