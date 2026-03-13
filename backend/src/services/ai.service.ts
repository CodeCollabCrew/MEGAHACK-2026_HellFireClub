import { TaskPriority } from "../models/task.model";

export interface ExtractedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  deadline: string | null;
  confidence: number;
  reasoning: string;
}

export interface ExtractionResult {
  hasActionItems: boolean;
  tasks: ExtractedTask[];
  summary: string;
  needsFollowUp: boolean;
}

const SYSTEM_PROMPT = `You are an AI that extracts actionable tasks from emails with high precision.

Rules:
- Only extract tasks for the EMAIL RECIPIENT (not things the sender says they will do)
- Detect urgency: "urgent/ASAP/today" = urgent, "this week" = high, "next week" = medium, else = low
- Parse relative dates: "tomorrow" = +1 day, "Friday" = next Friday, "next week" = +7 days
- Confidence: 0.9+ for explicit requests, 0.6-0.8 for implied tasks, below 0.5 = skip
- needsFollowUp: true if the email sender is waiting on a reply

CRITICAL: Return ONLY raw valid JSON. No markdown. No code fences. No explanation. Just JSON.
{
  "hasActionItems": true,
  "tasks": [{"title": "string", "description": "string", "priority": "low|medium|high|urgent", "deadline": "ISO string or null", "confidence": 0.9, "reasoning": "string"}],
  "summary": "string",
  "needsFollowUp": false
}`;

export const extractTasksFromEmail = async (
  subject: string,
  body: string,
  from: string
): Promise<ExtractionResult> => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("❌ GROQ_API_KEY is not set in .env");
    return { hasActionItems: false, tasks: [], summary: "GROQ_API_KEY missing in .env file.", needsFollowUp: false };
  }

  const userPrompt = `Analyze this email:
FROM: ${from}
SUBJECT: ${subject}
DATE: ${new Date().toISOString()}
BODY:
${body}`;

  try {
    const isXAI = apiKey.startsWith("xai-");
    const endpoint = isXAI 
      ? "https://api.x.ai/v1/chat/completions" 
      : "https://api.groq.com/openai/v1/chat/completions";
    
    const model = isXAI ? "grok-beta" : "llama-3.3-70b-versatile";

    const response = await fetch(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 1500,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", response.status, errText);
      return { hasActionItems: false, tasks: [], summary: `Groq API error: ${response.status}`, needsFollowUp: false };
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };

    const raw = data?.choices?.[0]?.message?.content || "";
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    // Find JSON object in response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Groq response:", raw);
      return { hasActionItems: false, tasks: [], summary: "AI returned invalid format.", needsFollowUp: false };
    }

    const result = JSON.parse(jsonMatch[0]) as ExtractionResult;
    return result;

  } catch (error) {
    console.error("Groq extraction error:", error);
    return { hasActionItems: false, tasks: [], summary: "Could not analyze email.", needsFollowUp: false };
  }
};