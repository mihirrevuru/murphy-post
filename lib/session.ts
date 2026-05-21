import type { Edition } from "./murphyScore";
import { calculateScore } from "./murphyScore";

const USERNAME_KEY = "murphys_post_username";
const EDITIONS_KEY = "murphys_post_editions";
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USERNAME_KEY);
}

export function setUsername(name: string): void {
  localStorage.setItem(USERNAME_KEY, name);
}

export function getEditions(): Edition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EDITIONS_KEY);
    if (!raw) return [];
    const editions: Edition[] = JSON.parse(raw);
    const cutoff = Date.now() - TWENTY_FOUR_HOURS;
    return editions.filter((e) => new Date(e.timestamp).getTime() > cutoff);
  } catch {
    return [];
  }
}

export function addEdition(article: Edition): void {
  // Never stores red-level content (flagged in Phase 3 by API response)
  const editions = getEditions();
  editions.unshift(article);
  localStorage.setItem(EDITIONS_KEY, JSON.stringify(editions));
}

export function clearExpiredEditions(): void {
  const editions = getEditions();
  localStorage.setItem(EDITIONS_KEY, JSON.stringify(editions));
}

export function getMurphyScore(): number {
  return calculateScore(getEditions());
}
