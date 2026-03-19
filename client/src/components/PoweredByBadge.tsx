import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

interface PoweredByBadgeProps {
  partnerId: string;
}

export default function PoweredByBadge({ partnerId }: PoweredByBadgeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const failCountRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Apply host element hardening styles
    applyHostStyles(el);

    // Attach closed shadow root
    const shadow = el.attachShadow({ mode: "closed" });
    shadowRootRef.current = shadow;

    const badgeUrl = `https://freeroomplanner.com?ref=${encodeURIComponent(partnerId)}&utm_source=embed`;

    shadow.innerHTML = `
      <style>
        :host {
          all: initial;
        }
        a {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 0, 0, 0.75);
          color: #ffffff;
          border-radius: 20px;
          padding: 5px 10px;
          font-size: 11px;
          font-family: system-ui, -apple-system, sans-serif;
          cursor: pointer;
          text-decoration: none;
          line-height: 1;
          white-space: nowrap;
          user-select: none;
        }
        a:hover {
          background: rgba(0, 0, 0, 0.85);
        }
        svg {
          flex-shrink: 0;
        }
      </style>
      <a href="${badgeUrl}" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        Powered by freeroomplanner.com
      </a>
    `;

    // Track click
    const link = shadow.querySelector("a");
    if (link) {
      link.addEventListener("click", () => {
        trackEvent("embed_badge_clicked", { partner: partnerId });
      });
    }

    // Integrity checks
    const enforceVisibility = () => {
      if (!el) return;

      // Re-apply host styles
      applyHostStyles(el);

      // If removed from DOM, re-append
      if (!document.body.contains(el)) {
        document.body.appendChild(el);
      }

      failCountRef.current++;

      if (failCountRef.current >= 3) {
        showBlocker();
      }
    };

    const checkIntegrity = () => {
      if (!el) return;

      const inDom = document.body.contains(el);
      const hasWidth = el.offsetWidth > 0;
      const hasHeight = el.offsetHeight > 0;
      const computed = getComputedStyle(el);
      const displayOk = computed.display !== "none";
      const visibilityOk = computed.visibility !== "hidden";
      const opacityOk = computed.opacity !== "0";

      if (!inDom || !hasWidth || !hasHeight || !displayOk || !visibilityOk || !opacityOk) {
        enforceVisibility();
      } else {
        // Reset fail count on successful check
        failCountRef.current = 0;
      }
    };

    const intervalId = setInterval(checkIntegrity, 2000);

    // Mutation observer
    const observer = new MutationObserver(() => {
      // Re-enforce on any attribute/child mutation
      if (!el) return;
      const computed = getComputedStyle(el);
      if (
        computed.display === "none" ||
        computed.visibility === "hidden" ||
        computed.opacity === "0" ||
        !document.body.contains(el)
      ) {
        enforceVisibility();
      } else {
        // Re-apply styles in case they were changed
        applyHostStyles(el);
      }
    });

    observer.observe(el, {
      attributes: true,
      childList: true,
    });

    return () => {
      clearInterval(intervalId);
      observer.disconnect();
    };
  }, [partnerId]);

  return <div ref={containerRef} />;
}

function applyHostStyles(el: HTMLElement) {
  el.style.position = "fixed";
  el.style.bottom = "12px";
  el.style.right = "12px";
  el.style.zIndex = "2147483647";
  el.style.pointerEvents = "auto";
  el.style.display = "block";
  el.style.visibility = "visible";
  el.style.opacity = "1";
}

function showBlocker() {
  // Prevent duplicate blockers
  if (document.getElementById("frp-embed-blocker")) return;

  const overlay = document.createElement("div");
  overlay.id = "frp-embed-blocker";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.right = "0";
  overlay.style.bottom = "0";
  overlay.style.zIndex = "2147483646";
  overlay.style.background = "rgba(0, 0, 0, 0.6)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";

  const msg = document.createElement("div");
  msg.style.background = "#ffffff";
  msg.style.color = "#1a1a1a";
  msg.style.padding = "32px 40px";
  msg.style.borderRadius = "12px";
  msg.style.fontSize = "16px";
  msg.style.fontFamily = "system-ui, -apple-system, sans-serif";
  msg.style.maxWidth = "480px";
  msg.style.textAlign = "center";
  msg.style.lineHeight = "1.5";
  msg.textContent = "This embed requires the 'Powered by freeroomplanner.com' badge to remain visible.";

  overlay.appendChild(msg);
  document.body.appendChild(overlay);
}
