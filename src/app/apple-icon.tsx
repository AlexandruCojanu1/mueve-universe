import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background: "#050816",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #FFF9D8 0%, #FFE55A 40%, #F5B400 100%)",
            boxShadow: "0 0 40px rgba(245, 180, 0, 0.6)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
