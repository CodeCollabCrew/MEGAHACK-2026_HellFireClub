/**
 * Gmail OAuth2 Service
 * Fetches REAL emails from user's Gmail inbox
 */

import { Email } from "../models/email.model";

interface GmailMessage {
  id: string;
  threadId: string;
}

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailPart {
  mimeType: string;
  body: { data?: string; size: number };
  parts?: GmailPart[];
}

interface GmailMessageDetail {
  id: string;
  threadId: string;
  payload: {
    headers: GmailHeader[];
    body: { data?: string };
    parts?: GmailPart[];
  };
  snippet: string;
  internalDate: string;
  labelIds: string[];
}

// Decode base64url to text
const decodeBase64 = (data: string): string => {
  try {
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return "";
  }
};

// Extract email body from payload (handles plain text + multipart)
const extractBody = (payload: GmailMessageDetail["payload"]): string => {
  // Direct body
  if (payload.body?.data) return decodeBase64(payload.body.data);

  // Multipart — look for text/plain first, then text/html
  if (payload.parts) {
    const findText = (parts: GmailPart[]): string => {
      for (const part of parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          return decodeBase64(part.body.data);
        }
        if (part.parts) {
          const nested = findText(part.parts);
          if (nested) return nested;
        }
      }
      // fallback to html
      for (const part of parts) {
        if (part.mimeType === "text/html" && part.body?.data) {
          return decodeBase64(part.body.data)
            .replace(/<[^>]+>/g, " ")  // strip html tags
            .replace(/\s+/g, " ")
            .trim();
        }
      }
      return "";
    };
    return findText(payload.parts);
  }
  return "";
};

// Fetch real emails using Gmail API with OAuth access token
export const fetchGmailEmails = async (
  accessToken: string,
  maxResults = 20
): Promise<{ imported: number; errors: string[] }> => {
  const errors: string[] = [];
  let imported = 0;

  try {
    // Step 1: Get list of message IDs
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=INBOX&q=is:unread OR is:important`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      const err = await listRes.text();
      throw new Error(`Gmail list error: ${listRes.status} — ${err}`);
    }

    const listData = await listRes.json() as { messages?: GmailMessage[] };
    const messages = listData.messages || [];

    if (messages.length === 0) {
      return { imported: 0, errors: ["No emails found in inbox"] };
    }

    // Step 2: Fetch each message detail
    for (const msg of messages) {
      try {
        // Skip if already imported
        const exists = await Email.findOne({ emailId: msg.id });
        if (exists) continue;

        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!detailRes.ok) {
          errors.push(`Failed to fetch message ${msg.id}`);
          continue;
        }

        const detail = await detailRes.json() as GmailMessageDetail;
        const headers = detail.payload.headers;

        const getHeader = (name: string) =>
          headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

        const from = getHeader("From");
        const subject = getHeader("Subject") || "(No Subject)";
        const body = extractBody(detail.payload);
        const receivedAt = new Date(parseInt(detail.internalDate));

        await Email.create({
          emailId: detail.id,
          from,
          subject,
          body: body.substring(0, 5000), // cap at 5000 chars
          snippet: detail.snippet || body.substring(0, 150),
          receivedAt,
          isRead: !detail.labelIds.includes("UNREAD"),
          isProcessed: false,
          hasActionItems: false,
          extractedTaskIds: [],
          needsFollowUp: false,
          aiSummary: "",
        });

        imported++;
      } catch (err) {
        errors.push(`Error processing message ${msg.id}: ${err}`);
      }
    }

    return { imported, errors };
  } catch (error) {
    throw new Error(`Gmail fetch failed: ${error}`);
  }
};
