import { NextRequest, NextResponse } from "next/server";
import { stateSchema, weeklySummary } from "@/lib/model";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > 200000)
      return NextResponse.json({ error: "Too much data" }, { status: 413 });
    const result = stateSchema.safeParse(JSON.parse(raw));
    if (!result.success)
      return NextResponse.json(
        { error: "Invalid journal data" },
        { status: 400 },
      );
    if (!process.env.OPENAI_API_KEY || !process.env.AI_ACCESS_TOKEN)
      return NextResponse.json({
        mode: "local",
        summary: weeklySummary(result.data),
      });
    if (
      req.headers.get("authorization") !==
      `Bearer ${process.env.AI_ACCESS_TOKEN}`
    )
      return NextResponse.json(
        { error: "A valid AI access token is required." },
        { status: 401 },
      );
    const origin = req.headers.get("origin");
    if (origin && origin !== req.nextUrl.origin)
      return NextResponse.json({ error: "Origin denied" }, { status: 403 });
    const summary = weeklySummary(result.data);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        max_tokens: 450,
        messages: [
          {
            role: "system",
            content:
              "You are an evidence-conscious wellness coach. Give a short weekly reflection and 2 practical suggestions. No diagnosis, calorie prescription, guaranteed outcomes or unsupported deficit claims. Explain short-term weight uncertainty and incomplete logs. Do not encourage restrictive eating. Only use the supplied aggregate facts. State this is general information, not medical advice.",
          },
          { role: "user", content: summary },
        ],
      }),
    });
    if (!response.ok) throw new Error("Provider unavailable");
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text) throw new Error("Invalid response");
    return NextResponse.json(
      { mode: "ai", summary: text },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Coach unavailable. Use the private local summary instead." },
      { status: 502 },
    );
  }
}
