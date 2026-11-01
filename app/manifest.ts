import type { MetadataRoute } from "next";

/** PWA manifest: the home-screen icon opens straight to today-view. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daily Plan",
    short_name: "Today",
    description: "Your plan for today, one tap from your home screen.",
    start_url: "/today-view",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f7ff",
    theme_color: "#6d4ae0",
    icons: [
      { src: "/icons/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/app-icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
