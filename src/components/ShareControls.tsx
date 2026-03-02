import { useState } from "react";
import type { DayAvailability } from "../lib/types";
import { formatAvailabilityText } from "../lib/formatting";
import { encodeAvailability } from "../lib/sharing";

interface ShareControlsProps {
  days: DayAvailability[];
  name: string;
}

export function ShareControls({ days, name }: ShareControlsProps) {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyText = async () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const text = formatAvailabilityText(days, tz);
    await navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleShareLink = async () => {
    const url = encodeAvailability(days, name);
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="share-controls">
      <button onClick={handleCopyText} className="btn">
        {copiedText ? "Copied!" : "Copy to Clipboard"}
      </button>
      <button onClick={handleShareLink} className="btn">
        {copiedLink ? "Link Copied!" : "Share Link"}
      </button>
    </div>
  );
}
