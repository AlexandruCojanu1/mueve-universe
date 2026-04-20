import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MUEVE UNIVERSE — universul mișcării";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #050816 0%, #0A0F2A 50%, #11183C 100%)",
          color: "#F5F5F5",
          padding: "80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "80px",
            right: "80px",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #FFF9D8 0%, #FFE55A 40%, #F5B400 100%)",
            boxShadow: "0 0 60px rgba(245, 180, 0, 0.6)",
          }}
        />
        <div
          style={{
            fontSize: "36px",
            fontWeight: 700,
            letterSpacing: "0.3em",
            color: "#F5F50A",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          The Movement Universe
        </div>
        <div
          style={{
            fontSize: "120px",
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          MUEVE
        </div>
        <div
          style={{
            fontSize: "80px",
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "0.05em",
            color: "#F5F50A",
            marginTop: "8px",
          }}
        >
          UNIVERSE
        </div>
        <div
          style={{
            marginTop: "60px",
            fontSize: "28px",
            opacity: 0.6,
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          Calisthenics · Yoga · Running · Community
        </div>
      </div>
    ),
    { ...size },
  );
}
