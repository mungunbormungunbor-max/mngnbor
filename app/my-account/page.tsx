import type { Metadata } from "next";
import { MyAccountScreen } from "@/features/my-account";
import { getServerMessage } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await getServerMessage("acct.title") };
}

export default function MyAccountPage() {
  return <MyAccountScreen />;
}
