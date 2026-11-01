import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NotificationsScheduler } from "@/features/notifications";
import { getServerUserId } from "@/lib/supabase/user";
import { UserScopeProvider } from "@/lib/user-scope/user-scope-provider";
import { THEME_INIT_SCRIPT } from "@/lib/theme/theme";
import { ThemeSync } from "@/lib/theme/theme-sync";
import { I18nProvider } from "@/lib/i18n/provider";
import { getServerLanguage } from "@/lib/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Daily Plan", template: "%s · Daily Plan" },
  description: "Your plan for today, one tap from your home screen.",
  applicationName: "Daily Plan",
  appleWebApp: { capable: true, title: "Daily Plan", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0b1f" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [lang, userId] = await Promise.all([getServerLanguage(), getServerUserId()]);
  return (
    // suppressHydrationWarning: the init script adds the `dark` class to <html> before React loads.
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <UserScopeProvider userId={userId}>
          <I18nProvider initialLang={lang}>
            {children}
            <NotificationsScheduler />
            <ThemeSync />
          </I18nProvider>
        </UserScopeProvider>
      </body>
    </html>
  );
}
