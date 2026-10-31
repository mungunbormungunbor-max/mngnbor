import type { Metadata } from "next";
import { TodayViewScreen } from "@/features/today-view";

export const metadata: Metadata = { title: "Today" };

export default function TodayViewPage() {
  return <TodayViewScreen />;
}
