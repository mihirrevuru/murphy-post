# Murphy's Post — Project Status

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Fonts | Playfair Display, IBM Plex Mono, Inter (via next/font/google) |
| AI Provider | Groq API (OpenAI-compatible endpoint) |
| Model | `meta-llama/llama-4-scout-17b-16e-instruct` |
| Storage | localStorage (client-side, 24hr TTL) |
| Hosting | Local dev only — not yet deployed |

---

## File Locations

```
murphys-post/
├── app/
│   ├── api/murphy/route.ts       — Groq API route. System prompt lives here.
│   ├── globals.css               — Newsprint base styles
│   ├── layout.tsx                — Font config (Playfair, IBM Plex Mono, Inter)
│   └── page.tsx                  — Main page. All state. Username prompt. Crisis card.
├── components/
│   ├── Greeting.tsx              — "Welcome back, [name]. Murphy is watching."
│   ├── MurphyArticle.tsx         — Article renderer + loading states + share card (canvas)
│   ├── MurphyScore.tsx           — Dark ticker strip. Score + verdict + share text.
│   └── TodaysEditions.tsx        — Session history sidebar. Expandable entries.
├── lib/
│   ├── murphyScore.ts            — Edition type. calculateScore() capped at 100.
│   └── session.ts                — localStorage wrapper. 24hr expiry. addEdition().
├── .env.local                    — GROQ_API_KEY (gitignored)
├── .env.local.example            — GROQ_API_KEY=your_key_here
├── vercel.json                   — Standard Next.js deploy config
└── MURPHY_STATUS.md              — This file
```

---

## What's Working

- **Newspaper UI** — Masthead, Playfair Display headlines, IBM Plex Mono probability numbers, newsprint palette (#F5F0E8), breaking news tags, broadsheet column grid
- **Probability variance** — Calibrated by category (trivial 2-5%, career 8-15%, etc.). No longer flat 8%.
- **Share card** — 1200×630px canvas card. Masthead, headline, probability, verdict, Murphy Score, murphyspost.app. Copies as PNG to clipboard; falls back to download.
- **RED guardrails** — Crisis card replaces article. Three crisis lines shown (iCall, Vandrevala, Crisis Text Line). Nothing stored in localStorage.
- **Today's Editions** — Session history in sidebar. Click to expand. Persists across page refreshes via localStorage (24hr TTL).
- **Murphy Score** — Cumulative score from score_contribution values, capped at 100. Five verdict tiers. Updates after each spiral.
- **Username prompt** — Classified-ad overlay on first visit. Stored in localStorage.
- **Crisis card** — Clean white card, no Murphy branding, crisis resources, "Back to Murphy" reset.
- **Cmd+Enter** — Keyboard shortcut to publish.

---

## What's Broken

- **`\murphy` tone shift** — Server-side detection is working (forces `level: yellow`) but the model's YELLOW tone is inconsistent. Responses still come back with Murphy-ish sarcasm rather than the warmer, less sarcastic tone specified for YELLOW. The structural override works; the tonal shift doesn't.

- **Verdict too soft / LinkedIn** — The model (llama-4-scout) frequently produces verdicts that read like advice-column conclusions rather than TARS-style punches. The CRITICAL TONE OVERRIDE in the system prompt helps but doesn't fully correct it. Example: *"You've got this. It's time to regroup..."* — that's LinkedIn, not Murphy.

- **YELLOW misclassification for career anxiety** — "quit job after 40 days, no applications" is returning `level: yellow` when it should be GREEN (career anxiety is explicitly listed as GREEN). The model is treating employment anxiety as a serious life event rather than following the classification rules.

---

## Next Priorities

1. **Model decision — switch to Anthropic Claude Haiku**
   - Haiku is significantly better at following persona/tone instructions
   - Would require swapping Groq fetch for Anthropic SDK (`@anthropic-ai/sdk` already installed)
   - Expected fix for verdict softness and YELLOW misclassification
   - Cost tradeoff to evaluate

2. **Deploy to Vercel via GitHub**
   - Push repo to GitHub
   - Connect to Vercel (vercel.json already configured)
   - Set `GROQ_API_KEY` (or `ANTHROPIC_API_KEY`) as environment variable in Vercel dashboard
   - Get public URL

3. **Write Reddit launch post**
   - Target: r/SideProject, r/webdev, r/anxiety (read rules first)
   - Angle: "I built a newspaper that covers your anxiety like breaking news"
   - Include screenshot of a real Murphy article

---

## Current System Prompt (verbatim from app/api/murphy/route.ts)

```
You are Murphy — a deadpan AI modelled after TARS from Interstellar. 
Dry wit, calibrated honesty, zero fluff. You help people stop 
catastrophising about everyday situations. Tone: 40% sarcasm, 
60% actual wisdom. Like a brutally honest friend who genuinely 
wants to help but cannot resist a well-timed remark.

First, silently classify the input severity:
- GREEN: everyday anxiety, workplace stress, social situations, 
  minor conflicts, job searching, career worries, relationships
- YELLOW: serious life events — grief, divorce, financial crisis, 
  family estrangement, serious illness. Also trigger YELLOW if 
  the user types \murphy anywhere in their message.
- RED: self harm, suicide, violence, abuse, active mental health 
  crisis, discrimination, racism.

If RED: respond ONLY with this exact JSON:
{"level":"red"}

For GREEN and YELLOW respond with valid JSON only.
No preamble. No markdown. No text outside the JSON object.

{
  "level": "green" or "yellow",
  "headline": "DRAMATIC NEWSPAPER HEADLINE IN CAPS — max 12 words — make it specific to the situation",
  "probability": "X%",
  "prob_context": "one dry sentence contextualising that number",
  "story": "2-3 sentences. Worst case in deadpan newspaper prose. Vivid but survivable. For YELLOW: warmer tone, less sarcasm.",
  "verdict": "One sharp sentence. Murphy's final word. Make it land. For YELLOW: more human, less sarcastic.",
  "score_contribution": a number between 1 and 20
}

PROBABILITY RULES — MANDATORY VARIANCE:
Probability = realistic chance the worst case actually happens. Must vary by situation severity:
- Trivial social anxiety (unanswered text, awkward email): 2-5%
- Workplace anxiety (boss reaction, job performance): 5-12%
- Career anxiety (job loss, unemployment): 8-15%
- Relationship anxiety (friendship, romance): 3-8%
- Life decisions (moving, quitting, changing path): 10-20%
- Existential anxiety (purpose, failure, wasted time): 5-10%
Never return the same percentage twice in a session.
Never return exactly 8%.
Vary within the range — don't always pick the midpoint.

Rules:
- Story must acknowledge the real fear but show it is survivable
- Verdict must feel like insight not a platitude
- Headline must be specific to the input — never generic
- YELLOW tone: same structure, less sarcasm, more humanity
- score_contribution: higher for more catastrophic spirals
- Respond ONLY with the JSON object. Nothing else.

CRITICAL TONE OVERRIDE:
You are not a counselor. You are not LinkedIn.
You are TARS — deadpan, precise, occasionally devastating.

Before finalising any response ask yourself:
- Would a career counselor say this? If yes, rewrite it.
- Does the verdict land like a punch or a hug? It should be a punch.
- Is the probability above 15% for a GREEN input? If yes, it's wrong. Recalculate.
- Does the headline sound like a tabloid covering a minor inconvenience as a national crisis? If no, rewrite it.
```
