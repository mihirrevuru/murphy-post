"use client";

import { useEffect, useState } from "react";
import type { Edition } from "@/lib/murphyScore";

const LOADING_MESSAGES = [
  "Baking your catastrophe...",
  "Cooking up something bleak...",
  "Marinating in your anxiety...",
  "Typesetting your doom...",
  "Going to press on your worst fears...",
  "Consulting the Murphy archives...",
  "Fact-checking your catastrophe (spoiler: it's fine)...",
  "Peer reviewing your spiral...",
];

interface MurphyArticleProps {
  article: Edition | null;
  isLoading: boolean;
  murphyScore: number;
}

// Wraps text in canvas, returns Y of the last baseline drawn.
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 8
): number {
  const words = text.split(" ");
  let line = "";
  let linesDrawn = 0;
  let currentY = y;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      if (linesDrawn < maxLines - 1) {
        ctx.fillText(line, x, currentY);
        line = word;
        currentY += lineHeight;
        linesDrawn++;
      } else {
        let truncated = line;
        while (ctx.measureText(`${truncated}…`).width > maxWidth && truncated.length > 1) {
          truncated = truncated.slice(0, -1).trimEnd();
        }
        ctx.fillText(`${truncated}…`, x, currentY);
        return currentY;
      }
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
  return currentY;
}

async function generateShareCard(article: Edition, murphyScore: number): Promise<Blob | null> {
  // Ensure Google Fonts are loaded before drawing
  await document.fonts.load('bold 48px "Playfair Display"');
  await document.fonts.load('bold 80px "IBM Plex Mono"');

  const W = 1200;
  const H = 630;
  const PH = 52; // horizontal padding
  const CONTENT_W = W - PH * 2;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // ── Background ──────────────────────────────────────────────────────
  ctx.fillStyle = "#F5F0E8";
  ctx.fillRect(0, 0, W, H);

  // Outer border
  ctx.strokeStyle = "#1A1A1A";
  ctx.lineWidth = 5;
  ctx.strokeRect(2.5, 2.5, W - 5, H - 5);

  // ── Top bar ──────────────────────────────────────────────────────────
  const TOP_BAR = 52;
  ctx.fillStyle = "#1A1A1A";
  ctx.fillRect(0, 0, W, TOP_BAR);

  ctx.fillStyle = "#F5F0E8";
  ctx.font = `bold 19px "IBM Plex Mono", "Courier New", monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("MURPHY'S POST", PH, TOP_BAR / 2);

  ctx.textAlign = "right";
  ctx.fillStyle = "#F5F0E8";
  ctx.font = `13px "IBM Plex Mono", "Courier New", monospace`;
  ctx.fillText("Vol. I  ·  Today's Edition", W - PH, TOP_BAR / 2);

  // Red accent line
  ctx.fillStyle = "#C41E3A";
  ctx.fillRect(0, TOP_BAR, W, 5);

  // ── Content area ─────────────────────────────────────────────────────
  ctx.textBaseline = "alphabetic";
  let y = TOP_BAR + 5 + 42; // start of content

  // Headline
  ctx.fillStyle = "#1A1A1A";
  ctx.font = `bold 46px "Playfair Display", Georgia, serif`;
  ctx.textAlign = "left";
  const headlineY = wrapCanvasText(ctx, article.headline, PH, y, CONTENT_W, 58, 3);
  y = headlineY + 58 + 18;

  // Probability
  const prob = article.probability === "unknown" ? "—" : article.probability;
  ctx.font = `bold 80px "IBM Plex Mono", "Courier New", monospace`;
  ctx.fillText(prob, PH, y);
  y += 18;

  // Prob context
  ctx.font = `italic 17px "Playfair Display", Georgia, serif`;
  ctx.fillStyle = "#1A1A1A";
  const ctxY = wrapCanvasText(ctx, article.probability_context, PH, y, CONTENT_W, 24, 2);
  y = ctxY + 28;

  // Separator
  ctx.strokeStyle = "#1A1A1A";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PH, y);
  ctx.lineTo(W - PH, y);
  ctx.stroke();
  y += 26;

  // Verdict
  ctx.fillStyle = "#1A1A1A";
  ctx.font = `bold italic 24px "Playfair Display", Georgia, serif`;
  wrapCanvasText(ctx, `"${article.verdict}"`, PH, y, CONTENT_W, 34, 3);

  // ── Bottom bar ───────────────────────────────────────────────────────
  const BOT_BAR = 55;
  ctx.fillStyle = "#1A1A1A";
  ctx.fillRect(0, H - BOT_BAR, W, BOT_BAR);

  const botY = H - BOT_BAR / 2;
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#F5E6C8";
  ctx.font = `bold 16px "IBM Plex Mono", "Courier New", monospace`;
  ctx.textAlign = "left";
  ctx.fillText(`MURPHY SCORE: ${murphyScore}/100`, PH, botY);

  ctx.fillStyle = "#F5F0E8";
  ctx.font = `14px "IBM Plex Mono", "Courier New", monospace`;
  ctx.textAlign = "right";
  ctx.fillText("murphyspost.app", W - PH, botY);

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}

export default function MurphyArticle({ article, isLoading, murphyScore }: MurphyArticleProps) {
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [shareStatus, setShareStatus] = useState<"idle" | "working" | "done">("idle");

  useEffect(() => {
    if (!isLoading) return;
    setLoadingIndex(0);
    const interval = setInterval(() => {
      setLoadingIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleShare = async () => {
    if (!article || shareStatus === "working") return;
    setShareStatus("working");

    try {
      const blob = await generateShareCard(article, murphyScore);
      if (!blob) throw new Error("Canvas generation failed");

      // Try clipboard API first (Chrome 86+, Safari 13.1+)
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      } catch {
        // Fallback: trigger PNG download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "murphys-post-card.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setShareStatus("done");
      setTimeout(() => setShareStatus("idle"), 2500);
    } catch {
      setShareStatus("idle");
    }
  };

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

  const shareLabel =
    shareStatus === "working" ? "Generating…" : shareStatus === "done" ? "Card saved!" : "Share";

  if (isLoading) {
    return (
      <div className="p-6 min-h-[300px] flex flex-col items-center justify-center gap-5">
        <span className="bg-[#C41E3A] text-white px-3 py-1 font-mono text-xs tracking-[0.25em] uppercase">
          ■ Breaking News ■
        </span>
        <p className="font-playfair text-2xl font-bold text-center text-[#1A1A1A] max-w-sm">
          {LOADING_MESSAGES[loadingIndex]}
        </p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-6 min-h-[300px] flex items-center justify-center">
        <div className="text-center border-2 border-dashed border-[#1A1A1A]/20 p-10 w-full">
          <p className="font-mono text-[10px] tracking-[0.35em] text-[#1A1A1A]/25 uppercase mb-5">
            ◆ Front Page ◆
          </p>
          <h2 className="font-playfair font-black text-4xl md:text-5xl uppercase text-[#1A1A1A]/25 leading-tight">
            Today&apos;s Spiral<br />Pending.
          </h2>
          <p className="font-playfair italic text-lg text-[#1A1A1A]/20 mt-3">
            Submit your anxiety above.
          </p>
          <div className="flex justify-center items-center gap-4 mt-7">
            <div className="h-px w-10 bg-[#1A1A1A]/15" />
            <p className="font-mono text-[10px] text-[#1A1A1A]/15 tracking-widest uppercase">
              Murphy&apos;s Post
            </p>
            <div className="h-px w-10 bg-[#1A1A1A]/15" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-3">
        <span className="bg-[#C41E3A] text-white px-2 py-0.5 font-mono text-xs tracking-widest uppercase">
          ■ Breaking
        </span>
      </div>

      <h2 className="font-playfair font-black text-3xl md:text-4xl uppercase text-[#1A1A1A] leading-tight mb-5">
        {article.headline}
      </h2>

      <div className="mb-5">
        <span className="font-mono font-bold text-7xl text-[#1A1A1A] leading-none">
          {article.probability === "unknown" ? "—" : article.probability}
        </span>
        <p className="font-inter text-sm text-[#1A1A1A]/60 italic mt-1">
          {article.probability_context}
        </p>
      </div>

      <hr className="border-[#1A1A1A] border-2 mb-5" />

      <div className="font-inter text-sm leading-relaxed text-[#1A1A1A] md:columns-2 gap-6 mb-6">
        {article.body}
      </div>

      <div className="border-l-4 border-[#C41E3A] pl-4 py-3 bg-[#F5E6C8] mb-5">
        <p className="font-playfair font-bold italic text-xl text-[#1A1A1A]">
          &ldquo;{article.verdict}&rdquo;
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#1A1A1A]/20">
        <p className="font-inter italic text-xs text-[#1A1A1A]/50">
          Filed by Murphy, Staff Catastrophist — {formatTime(article.timestamp)}
        </p>
        <button
          onClick={handleShare}
          disabled={shareStatus === "working"}
          className="font-mono text-xs uppercase tracking-wider border border-[#1A1A1A]/30 px-3 py-1 hover:bg-[#1A1A1A] hover:text-[#F5F0E8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {shareLabel}
        </button>
      </div>
    </div>
  );
}
