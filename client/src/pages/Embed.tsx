import { useState, useEffect, useMemo } from "react";
import { parseEmbedParams } from "../lib/embed-params";
import EditorCore from "../components/EditorCore";
import PoweredByBadge from "../components/PoweredByBadge";
import { trackEvent } from "@/lib/analytics";

export default function Embed() {
  const params = useMemo(
    () => parseEmbedParams(window.location.search),
    []
  );

  const [isDark, setIsDark] = useState(() => {
    if (params.dark === true) return true;
    if (params.dark === false) return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Track embed load
  useEffect(() => {
    if (params.partner) {
      trackEvent("embed_loaded", {
        partner: params.partner,
        referrer: document.referrer,
      });
    }
  }, [params.partner]);

  // Error state: no valid partner
  if (!params.partner) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#666",
          fontSize: "16px",
          padding: "20px",
          textAlign: "center",
        }}
      >
        Embed configuration error: a valid partner ID is required.
      </div>
    );
  }

  const rootStyle: React.CSSProperties = {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    ...(params.brandColor
      ? ({ "--embed-brand-color": `#${params.brandColor}` } as React.CSSProperties)
      : {}),
  };

  return (
    <div className="bg-background" style={rootStyle} data-testid="embed-page">
      {/* Optional branding strip */}
      {params.logoUrl && (
        <div
          className="flex items-center px-3 py-1 border-b border-border bg-card"
          style={params.brandColor ? { borderBottomColor: `var(--embed-brand-color)` } : undefined}
        >
          <img
            src={params.logoUrl}
            alt=""
            style={{
              maxHeight: "40px",
              maxWidth: "200px",
              objectFit: "contain",
            }}
          />
        </div>
      )}

      <EditorCore
        storageKey="freeroomplanner-embed-autosave"
        units={params.units}
        hideToolbar={params.hideToolbar}
        isDark={isDark}
      />

      <PoweredByBadge partnerId={params.partner} />
    </div>
  );
}
