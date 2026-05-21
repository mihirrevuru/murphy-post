"use client";

import { useState } from "react";
import type { Edition } from "@/lib/murphyScore";

interface TodaysEditionsProps {
  editions: Edition[];
}

export default function TodaysEditions({ editions }: TodaysEditionsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-4 h-full">
      <h2 className="font-playfair font-bold text-xs tracking-[0.3em] uppercase border-b-2 border-[#1A1A1A] pb-2 mb-4">
        Today&apos;s Editions
      </h2>

      {editions.length === 0 ? (
        <p className="font-inter italic text-sm text-[#1A1A1A]/40 leading-relaxed">
          No spirals yet today. Murphy is disappointed.
        </p>
      ) : (
        <ul className="space-y-4">
          {editions.map((edition) => (
            <li key={edition.id} className="border-b border-[#1A1A1A]/15 pb-4">
              <button
                onClick={() =>
                  setExpandedId(expandedId === edition.id ? null : edition.id)
                }
                className="text-left w-full group"
              >
                <p className="font-playfair font-bold text-sm leading-snug uppercase group-hover:text-[#C41E3A] transition-colors">
                  {edition.headline}
                </p>
                <p className="font-mono text-xs text-[#1A1A1A]/40 mt-1">
                  {formatTime(edition.timestamp)}
                </p>
              </button>

              {expandedId === edition.id && (
                <div className="mt-3 space-y-2">
                  <p className="font-mono font-bold text-2xl text-[#C41E3A]">
                    {edition.probability === "unknown" ? "—" : edition.probability}
                  </p>
                  <p className="font-inter text-xs text-[#1A1A1A]/70 leading-relaxed">
                    {edition.body.slice(0, 180)}…
                  </p>
                  <blockquote className="border-l-2 border-[#C41E3A] pl-3 font-inter italic text-xs text-[#1A1A1A]/80">
                    &ldquo;{edition.verdict}&rdquo;
                  </blockquote>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
