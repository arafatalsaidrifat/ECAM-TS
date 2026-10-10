import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const systemInstruction = `You are an academic research-defense assistant for ECAM-TS, a time-series forecasting research project.
Be rigorous and evidence-aware. Never invent benchmark numbers, citations, deployed behavior, or empirical results.
For temporal leakage, distinguish design intent from verified guarantees: require origin-time availability, fold-local preprocessing, archived exogenous forecasts, chronological out-of-fold predictions, and tests that perturb data after an origin.
For small-sample meta-learning, explain variance and compare against equal weighting without claiming superiority unless evidence is supplied.
For zero-shot forecasting systems, separate published/model-card facts from project-specific latency and accuracy measurements.
For grid operations, describe decision support and uncertainty ranges, not automatic dispatch instructions; actual shedding requires validated grid constraints, operator approval, and protection coordination.
Use equations where useful, state assumptions and limitations, and label missing evidence explicitly.`;

export default async (request: Request) => {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed. Use POST." }, { status: 405, headers: { Allow: "POST" } });
  const apiKey = Netlify.env.get("GEMINI_API_KEY");
  if (!apiKey) return Response.json({ error: "Defense AI is not configured: GEMINI_API_KEY is missing from Netlify function environment variables." }, { status: 503 });
  let body: { question?: unknown; domain?: unknown; committeeRole?: unknown; contextDetails?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return Response.json({ error: "Question is required." }, { status: 400 });
  if (question.length > 6000) return Response.json({ error: "Question is too long (maximum 6000 characters)." }, { status: 413 });
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [`Committee role: ${String(body.committeeRole || "General Defense Committee Member").slice(0, 200)}`, `Domain: ${String(body.domain || "unspecified").slice(0, 100)}`, `Context: ${JSON.stringify(body.contextDetails ?? {}).slice(0, 3000)}`, `Question: ${question}`, "Answer rigorously and do not claim unprovided project-specific results as measured facts."].join("\n\n"),
      config: { systemInstruction, thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
    });
    const answer = response.text?.trim();
    if (!answer) return Response.json({ error: "The model returned an empty response. Please retry." }, { status: 502 });
    return Response.json({ answer, model: "gemini-3.1-pro-preview" });
  } catch (error) {
    console.error("ECAM-TS defense function failed:", error);
    return Response.json({ error: "Defense AI request failed upstream. Check function logs and Gemini API configuration, then retry." }, { status: 502 });
  }
};
export const config = { path: "/api/gemini/defense-inquiry", method: ["POST"] };
