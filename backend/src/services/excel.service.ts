import * as XLSX from "xlsx";
import { Email } from "../models/email.model";
import { EmailAttachment } from "../models/emailAttachment.model";

const EXCEL_SYSTEM_PROMPT = `You are a data analyst. Given structured data from an Excel/spreadsheet, provide:
1. **Summary** - 2-3 sentences describing what the data represents
2. **Key Insights** - 3-5 bullet points of important patterns, trends, or findings
3. **Recommendations** - 1-3 actionable suggestions based on the data

Be concise and data-driven. Return ONLY valid JSON:
{
  "summary": "string",
  "insights": ["string", "string", ...],
  "recommendations": ["string", "string", ...]
}`;

export interface ExcelAnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  columns: string[];
  rowCount: number;
  preview: Record<string, unknown>[];
}

function parseExcelBuffer(buffer: Buffer): { columns: string[]; rows: Record<string, unknown>[] } {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  if (!json.length) return { columns: [], rows: [] };

  const headers = json[0] as unknown[];
  const columns = headers.map((h) => String(h ?? ""));

  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < json.length; i++) {
    const raw = json[i] as unknown[];
    const row: Record<string, unknown> = {};
    columns.forEach((col, idx) => {
      row[col] = raw[idx];
    });
    rows.push(row);
  }

  return { columns, rows };
}

export async function analyzeExcelBuffer(buffer: Buffer): Promise<ExcelAnalysisResult> {
  const { columns, rows } = parseExcelBuffer(buffer);

  const preview = rows.slice(0, 10);
  const dataSample = JSON.stringify(preview, null, 2);
  const apiKey = process.env.GROQ_API_KEY;

  let summary = "Data loaded successfully.";
  let insights: string[] = [];
  let recommendations: string[] = [];

  if (apiKey && columns.length > 0 && rows.length > 0) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: EXCEL_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Analyze this spreadsheet data (columns: ${columns.join(", ")}). Sample rows:\n${dataSample}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const raw = data?.choices?.[0]?.message?.content || "{}";
        const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]) as { summary?: string; insights?: string[]; recommendations?: string[] };
          summary = parsed.summary || summary;
          insights = Array.isArray(parsed.insights) ? parsed.insights : [];
          recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
        }
      }
    } catch (e) {
      console.error("Excel AI analysis error:", e);
    }
  }

  return {
    summary,
    insights,
    recommendations,
    columns,
    rowCount: rows.length,
    preview,
  };
}

export async function fetchGmailAttachment(
  accessToken: string,
  emailId: string,
  attachmentId: string
): Promise<Buffer> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/attachments/${attachmentId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail attachment fetch failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { data?: string };
  const b64 = data.data?.replace(/-/g, "+").replace(/_/g, "/") || "";
  return Buffer.from(b64, "base64");
}

export async function getExcelAttachmentsForUser(userId: string) {
  const attachments = await EmailAttachment.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  const emailIds = [...new Set(attachments.map((a) => a.emailId))];
  const emails = await Email.find({ userId, emailId: { $in: emailIds } })
    .select("emailId subject from receivedAt")
    .lean();

  const emailMap = new Map(emails.map((e: any) => [e.emailId, e]));

  return attachments.map((a: any) => {
    const email = emailMap.get(a.emailId);
    return {
      _id: a._id,
      emailId: a.emailId,
      attachmentId: a.attachmentId,
      filename: a.filename,
      mimeType: a.mimeType,
      size: a.size,
      emailSubject: email?.subject,
      emailFrom: email?.from,
      receivedAt: email?.receivedAt,
    };
  });
}
