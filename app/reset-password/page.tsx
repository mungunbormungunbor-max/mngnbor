import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { getServerMessage } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await getServerMessage("auth.reset.title") };
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
