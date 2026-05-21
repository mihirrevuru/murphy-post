"use client";

import { useState } from "react";

interface MurphyScoreProps {
  score: number;
  spiralCount: number;
}

function getVerdict(score: number): string {
  if (score <= 20) return "Suspiciously well-adjusted.";
  if (score <= 40) return "Mild catastrophiser. Room to grow.";
  if (score <= 60) return "Chronic overthinker. Classic.";
  if (score <= 80) return "Professional worrier. Consider a hobby.";
  return "Seek help. Murphy's orders.";
}

export default function MurphyScore({ score }: MurphyScoreProps) {
  const [copied, setCopied] = useState(false);
  const verdict = getVerdict(score);

  const handleShare = async () => {
    const text = `My Murphy Score today: ${score}/100 — ${verdict} Murphy's Post. murphy.ai`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="bg-[#1A1A1A] text-[#F5F0E8] border-t-4 border-[#C41E3A] py-3 px-4 flex items-center justify-between gap-4">
      <p className="font-mono text-xs md:text-sm tracking-widest uppercase leading-snug">
        Today&apos;s Murphy Score:{" "}
        <span className="text-[#F5E6C8] font-bold">{score}/100</span>
        <span className="hidden md:inline"> — </span>
        <span className="block md:inline italic text-[#F5F0E8]/70">{verdict}</span>
      </p>
      <button
        onClick={handleShare}
        className="shrink-0 font-mono text-xs uppercase tracking-wider border border-[#F5F0E8]/30 px-3 py-1 hover:bg-[#F5F0E8]/10 transition-colors"
      >
        {copied ? "Copied!" : "Share"}
      </button>
    </div>
  );
}
