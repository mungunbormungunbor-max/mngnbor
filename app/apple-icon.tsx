import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon (iOS ignores SVG manifest icons). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111111",
        }}
      >
        <div
          style={{
            width: 110,
            height: 104,
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div style={{ height: 24, background: "#10b981" }} />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="64" height="64" viewBox="0 0 20 20">
              <path
                d="M4 10.5l4 4 8-9"
                fill="none"
                stroke="#111111"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
