// src/components/blog/ShareButtons.tsx
"use client";

import { useState } from "react";

interface ShareButtonsProps {
  title: string;
  url?: string; // defaults to window.location.href
}

const SHARE_CHANNELS = [
  {
    id: "linkedin",
    icon: "fab fa-linkedin-in",
    label: "LinkedIn",
    color: "rgba(10,102,194,0.15)",
    border: "rgba(10,102,194,0.25)",
    text: "rgba(10,102,194,1)",
    getUrl: (url: string, title: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: "twitter",
    icon: "fab fa-x-twitter",
    label: "X / Twitter",
    color: "rgba(240,240,240,0.08)",
    border: "rgba(255,255,255,0.15)",
    text: "var(--text-primary)",
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}&via=rebruid`,
  },
  {
    id: "whatsapp",
    icon: "fab fa-whatsapp",
    label: "WhatsApp",
    color: "rgba(37,211,102,0.1)",
    border: "rgba(37,211,102,0.25)",
    text: "rgba(37,211,102,1)",
    getUrl: (url: string, title: string) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}\n${url}`)}`,
  },
];

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (url) return url;
    if (typeof window !== "undefined") return window.location.href;
    return "";
  };

  const handleShare = (channel: (typeof SHARE_CHANNELS)[number]) => {
    const shareUrl = getShareUrl();
    window.open(channel.getUrl(shareUrl, title), "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select input
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span
        className="font-mono text-[0.62rem] tracking-[0.15em] uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        Share
      </span>

      {SHARE_CHANNELS.map((ch) => (
        <button
          key={ch.id}
          onClick={() => handleShare(ch)}
          title={`Share on ${ch.label}`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-pill font-mono text-[0.65rem] tracking-[0.08em] uppercase transition-all duration-250 hover:scale-[1.04]"
          style={{
            background: ch.color,
            border: `1px solid ${ch.border}`,
            color: ch.text,
          }}
        >
          <i className={`${ch.icon} text-[0.75rem]`} />
          {ch.label}
        </button>
      ))}

      {/* Copy link */}
      <button
        onClick={handleCopy}
        title="Copy link"
        className="flex items-center gap-2 px-3 py-1.5 rounded-pill font-mono text-[0.65rem] tracking-[0.08em] uppercase transition-all duration-250 hover:scale-[1.04]"
        style={{
          background: copied
            ? "rgba(122,171,126,0.15)"
            : "rgba(255,255,255,0.05)",
          border: copied
            ? "1px solid rgba(122,171,126,0.3)"
            : "1px solid var(--border-default)",
          color: copied ? "var(--forest-sage)" : "var(--text-muted)",
        }}
      >
        <i
          className={`fas ${copied ? "fa-check" : "fa-link"} text-[0.72rem]`}
        />
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
