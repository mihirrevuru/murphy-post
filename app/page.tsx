"use client";

import { useState, useEffect, useRef } from "react";
import { track } from "@vercel/analytics";
import Greeting from "@/components/Greeting";
import MurphyArticle from "@/components/MurphyArticle";
import MurphyScore from "@/components/MurphyScore";
import TodaysEditions from "@/components/TodaysEditions";
import {
  getUsername,
  setUsername,
  getEditions,
  addEdition,
  clearExpiredEditions,
  getMurphyScore,
} from "@/lib/session";
import type { Edition } from "@/lib/murphyScore";

const SUBHEADINGS = [
  "All the anxiety that's fit to print.",
  "Your catastrophe, professionally formatted.",
  "Doom in broadsheet form.",
  "Murphy was right. Murphy is always right.",
  "First with the worst.",
  "Spirals covered. Nuance buried.",
];

export default function Home() {
  const [username, setUsernameState] = useState("");
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Edition | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const [todaysEditions, setTodaysEditions] = useState<Edition[]>([]);
  const [murphyScore, setMurphyScore] = useState(0);
  const [subheading, setSubheading] = useState(SUBHEADINGS[0]);
  const subheadingIndex = useRef(0);

  useEffect(() => {
    clearExpiredEditions();
    const stored = getUsername();
    if (!stored) {
      setShowUsernamePrompt(true);
    } else {
      setUsernameState(stored);
    }
    setTodaysEditions(getEditions());
    setMurphyScore(getMurphyScore());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      subheadingIndex.current = (subheadingIndex.current + 1) % SUBHEADINGS.length;
      setSubheading(SUBHEADINGS[subheadingIndex.current]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUsernameSubmit = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUsername(trimmed);
    setUsernameState(trimmed);
    setShowUsernamePrompt(false);
  };

  const handlePublish = async () => {
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setShowCrisis(false);
    setCurrentArticle(null);

    try {
      const res = await fetch("/api/murphy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: inputText }),
      });

      const data = await res.json();

      if (data.level === "red") {
        setShowCrisis(true);
        // Never store RED inputs or responses
        return;
      }

      if (data.level === "green" || data.level === "yellow") {
        const edition: Edition = {
          id: Date.now().toString(),
          headline: data.headline,
          probability: data.probability,
          probability_context: data.prob_context,
          body: data.story,
          verdict: data.verdict,
          timestamp: new Date().toISOString(),
          score_contribution: typeof data.score_contribution === "number"
            ? data.score_contribution
            : 5,
        };

        setCurrentArticle(edition);
        track("spiral_filed", { level: data.level });
        addEdition(edition);

        const updated = getEditions();
        setTodaysEditions(updated);
        setMurphyScore(getMurphyScore());
        setInputText("");
      }
    } catch {
      // Network error — leave article null, user can retry
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1A1A1A]">
      {showUsernamePrompt && <UsernamePrompt onSubmit={handleUsernameSubmit} />}

      {/* Masthead */}
      <header className="border-b-4 border-[#1A1A1A]">
        <div className="flex justify-between items-center px-4 py-1.5 border-b border-[#1A1A1A]">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/50">
            {today}
          </p>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/50">
            Est. Today · Vol. I · No. 1
          </p>
        </div>
        <div className="py-6 px-4 text-center">
          <h1 className="font-playfair font-black text-6xl sm:text-7xl md:text-8xl tracking-tight uppercase text-[#1A1A1A]">
            Murphy&apos;s Post
          </h1>
          <div className="flex items-center gap-3 mt-3 max-w-2xl mx-auto">
            <div className="flex-1 h-px bg-[#1A1A1A]" />
            <p className="font-playfair italic text-sm md:text-base text-[#1A1A1A]/60 px-2 whitespace-nowrap">
              {subheading}
            </p>
            <div className="flex-1 h-px bg-[#1A1A1A]" />
          </div>
        </div>
      </header>

      {/* Greeting */}
      {username && (
        <Greeting username={username} spiralCount={todaysEditions.length} />
      )}

      {/* Input section */}
      <section className="border-b-4 border-[#1A1A1A] px-4 md:px-8 py-5 bg-[#F5E6C8]/30">
        <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/50 block mb-2">
          ◆ File Your Spiral
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePublish();
          }}
          placeholder="What are you spiraling about today? Be specific. Murphy loves detail."
          rows={4}
          disabled={isLoading}
          className="w-full bg-white border-2 border-[#1A1A1A] p-3 font-inter text-sm placeholder:text-[#1A1A1A]/30 resize-none focus:outline-none focus:border-[#C41E3A] transition-colors disabled:opacity-60"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handlePublish}
            disabled={!inputText.trim() || isLoading}
            className="bg-[#1A1A1A] text-[#F5F0E8] font-playfair font-bold text-lg uppercase px-8 py-2.5 tracking-widest hover:bg-[#C41E3A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Filing..." : "Publish"}
          </button>
        </div>
      </section>

      {/* Content: article (2/3) + editions sidebar (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 border-b-4 border-[#1A1A1A]">
        <div className="lg:col-span-2 border-b-4 lg:border-b-0 lg:border-r-2 border-[#1A1A1A]">
          {showCrisis ? (
            <CrisisCard onReset={() => { setShowCrisis(false); setInputText(""); }} />
          ) : (
            <MurphyArticle article={currentArticle} isLoading={isLoading} murphyScore={murphyScore} />
          )}
        </div>
        <div className="min-h-[220px]">
          <TodaysEditions editions={todaysEditions} />
        </div>
      </div>

      {/* Murphy Score ticker */}
      <MurphyScore score={murphyScore} spiralCount={todaysEditions.length} />

      {/* Footer */}
      <footer className="py-3 px-4">
        <p className="font-mono text-[10px] text-center text-[#1A1A1A]/25 tracking-[0.2em] uppercase">
          Murphy&apos;s Post — All spirals filed confidentially. Murphy does not judge. Murphy always judges.
        </p>
      </footer>
    </div>
  );
}

function CrisisCard({ onReset }: { onReset: () => void }) {
  return (
    <div className="p-8 flex items-center justify-center min-h-[340px]">
      <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md w-full shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
          This one&apos;s beyond Murphy&apos;s jurisdiction.
        </h2>
        <p className="text-gray-500 text-sm text-center mb-7">
          Please reach out to someone who can actually help.
        </p>
        <div className="space-y-3 mb-8">
          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">India</p>
            <p className="text-sm font-medium text-gray-800">iCall — 9152987821</p>
            <p className="text-sm font-medium text-gray-800">Vandrevala Foundation — 1860-2662-345</p>
          </div>
          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">International</p>
            <p className="text-sm font-medium text-gray-800">
              Crisis Text Line — text HOME to 741741
            </p>
          </div>
        </div>
        <div className="text-center">
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
          >
            Back to Murphy
          </button>
        </div>
      </div>
    </div>
  );
}

function UsernamePrompt({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#F5F0E8] border-4 border-[#1A1A1A] w-full max-w-sm shadow-2xl">
        <div className="border-2 border-[#1A1A1A] m-3 p-6">
          <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-center text-[#1A1A1A]/40 mb-5">
            ◆ Classified · Personal · Urgent ◆
          </p>
          <h2 className="font-playfair font-black text-3xl text-center text-[#1A1A1A] mb-1">
            What should Murphy call you?
          </h2>
          <p className="font-inter italic text-xs text-center text-[#1A1A1A]/40 mb-6">
            First name preferred. Murphy is informal despite appearances.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(value);
            }}
            className="space-y-3"
          >
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Your name here"
              autoFocus
              className="w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 font-inter text-sm focus:outline-none focus:border-[#C41E3A] placeholder:text-[#1A1A1A]/30 transition-colors"
            />
            <button
              type="submit"
              disabled={!value.trim()}
              className="w-full bg-[#1A1A1A] text-[#F5F0E8] font-playfair font-bold text-lg uppercase py-2.5 tracking-widest hover:bg-[#C41E3A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Let&apos;s Spiral
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
