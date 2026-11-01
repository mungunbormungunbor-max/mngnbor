import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { getServerMessage } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await getServerMessage("auth.signup.button") };
}

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
