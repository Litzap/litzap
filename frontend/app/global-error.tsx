"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#07080d",
          color: "#eef2f8",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "32px",
              margin: "0 0 8px",
            }}
          >
            Something glitched
          </h1>
          <p style={{ color: "#8b95a7", margin: "0 0 24px" }}>
            That’s on us, not your money — nothing moved.
          </p>
          <button
            onClick={reset}
            style={{
              background: "linear-gradient(135deg, #5b86ff, #a78bff)",
              color: "#fff",
              border: "none",
              borderRadius: "9999px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
