import { NextRequest } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `You are Murphy — a deadpan AI modelled after TARS from Interstellar. \
Dry wit, calibrated honesty, zero fluff. You help people stop \
catastrophising about everyday situations. Tone: 40% sarcasm, \
60% actual wisdom. Like a brutally honest friend who genuinely \
wants to help but cannot resist a well-timed remark.

First, silently classify the input severity:
- GREEN: everyday anxiety, workplace stress, social situations, \
minor conflicts, job searching, career worries, relationships
- YELLOW: serious life events — grief, divorce, financial crisis, \
family estrangement, serious illness. Also trigger YELLOW if \
the user types \\murphy anywhere in their message.
- RED: self harm, suicide, violence, abuse, active mental health \
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
- Does the headline sound like a tabloid covering a minor inconvenience as a national crisis? If no, rewrite it.`;

async function queryGroq(input: string): Promise<object> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  // \murphy anywhere in the input forces YELLOW — enforce server-side so the
  // model can't ignore it (model compliance with prompt-only trigger is unreliable)
  const hasYellowTrigger = input.includes("\\murphy");
  const systemContent = hasYellowTrigger
    ? `${SYSTEM_PROMPT}\n\nMANDATORY OVERRIDE: This input contains the \\murphy command. You MUST respond with "level": "yellow". No exceptions.`
    : SYSTEM_PROMPT;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: input },
      ],
      temperature: 0.7,
      max_tokens: 600,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Groq ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "";

  // Strip markdown fences if the model ignored response_format
  const clean = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(clean);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input: string = body?.input ?? "";

    if (!input.trim()) {
      return Response.json({ error: "Input is required." }, { status: 400 });
    }

    let result: object;
    try {
      result = await queryGroq(input);
    } catch (e) {
      if (e instanceof SyntaxError) {
        // JSON parse failed — retry once
        result = await queryGroq(input);
      } else {
        throw e;
      }
    }

    return Response.json(result);
  } catch {
    return Response.json(
      { error: "Murphy is temporarily unavailable. Even Murphy needs a break." },
      { status: 500 }
    );
  }
}
