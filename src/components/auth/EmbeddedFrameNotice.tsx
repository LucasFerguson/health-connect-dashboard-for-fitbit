"use client";

import { useEffect, useState } from "react";

/**
 * Shown on the sign-in page when it is embedded in an iframe on another site
 * over plain HTTP. Browsers won't store a session cookie there (see
 * `sessionCookieOptions`), so signing in would silently bounce back here.
 * Over HTTPS, or from the same host, embedding works and this stays hidden.
 */
export function EmbeddedFrameNotice() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let embedded = false;
    try {
      embedded = window.self !== window.top;
    } catch {
      // Reading `window.top` can throw across origins; that means embedded.
      embedded = true;
    }
    if (!embedded || window.location.protocol !== "http:") return;
    let parentHost: string | null = null;
    try {
      parentHost = document.referrer
        ? new URL(document.referrer).hostname
        : null;
    } catch {
      parentHost = null;
    }
    setBlocked(parentHost !== window.location.hostname);
  }, []);

  if (!blocked) return null;
  return (
    <p className="border-caution text-caution-text mb-4 border-l-2 pl-3 text-sm">
      Signing in doesn&apos;t work inside this embedded frame over plain HTTP:
      the browser won&apos;t keep the login. Serve the dashboard over HTTPS to
      embed it, or{" "}
      <a
        href={window.location.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ink-0 underline underline-offset-2"
      >
        open it in a new tab
      </a>
      .
    </p>
  );
}
