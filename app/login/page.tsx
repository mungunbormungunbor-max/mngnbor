import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { getServerMessage } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await getServerMessage("auth.login.button") };
}

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
