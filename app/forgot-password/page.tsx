import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { getServerMessage } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await getServerMessage("auth.forgot.title") };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
